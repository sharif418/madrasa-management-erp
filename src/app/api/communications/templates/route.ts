// SMS/Message Templates API — list (with filters) & create.
// GET  /api/communications/templates?category=&channel=
// POST /api/communications/templates  { name, channel, subject?, body, variables?, category? }
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

const VALID_CHANNELS = new Set(["sms", "whatsapp", "email", "app"]);
const VALID_CATEGORIES = new Set([
  "fee_reminder", "absence_alert", "event_notice", "exam_result", "general",
]);

// Auto-extract {variable} placeholders from the body
function extractVars(body: string): string[] {
  const re = /\{(\w+)\}/g;
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) set.add(m[1]);
  return [...set];
}

export const GET = withSession(async ({ session, req }) => {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") || "";
  const channel = url.searchParams.get("channel") || "";

  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (category && VALID_CATEGORIES.has(category)) where.category = category;
  if (channel && VALID_CHANNELS.has(channel)) where.channel = channel;

  const items = await db.messageTemplate.findMany({
    where, orderBy: { updatedAt: "desc" }, take: 200,
  });

  // Parse variables JSON for convenience
  const parsed = items.map((t) => ({
    ...t,
    variables: t.variables ? safeParse(t.variables) : extractVars(t.body),
  }));

  return ok({ items: parsed, total: parsed.length });
});

function safeParse(s: string): string[] {
  try { const v = JSON.parse(s); return Array.isArray(v) ? v.map(String) : []; } catch { return []; }
}

export const POST = withSession(async ({ session, req }) => {
  const allowed = await checkPermission(session, "communications", "create");
  if (!allowed) return forbidden("You don't have permission to create templates");

  const body = await req.json().catch(() => ({}));
  const { name, channel, subject, body: msgBody, variables, category } = body || {};

  if (!name || typeof name !== "string" || !name.trim()) return fail("Template name is required");
  if (!msgBody || typeof msgBody !== "string" || !msgBody.trim()) return fail("Message body is required");

  const ch = VALID_CHANNELS.has(channel) ? channel : "sms";
  const cat = VALID_CATEGORIES.has(category) ? category : "general";

  // Auto-detect variables from body if not explicitly provided
  const vars: string[] = Array.isArray(variables)
    ? variables.map(String)
    : extractVars(msgBody);

  const tpl = await db.messageTemplate.create({
    data: {
      tenantId: session.tenantId,
      name: name.trim(),
      channel: ch,
      subject: subject?.trim() || null,
      body: msgBody.trim(),
      variables: JSON.stringify(vars),
      category: cat,
    },
  });

  await auditAfter(session, {
    action: "create", module: "communications",
    entityId: tpl.id, entityName: `Template: ${name}`,
    details: { channel: ch, category: cat, variables: vars },
  });

  return ok({ ...tpl, variables: vars }, 201);
});
