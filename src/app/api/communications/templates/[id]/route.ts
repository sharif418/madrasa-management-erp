// Template update/delete — PUT /api/communications/templates/[id], DELETE same.
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

const VALID_CHANNELS = new Set(["sms", "whatsapp", "email", "app"]);
const VALID_CATEGORIES = new Set([
  "fee_reminder", "absence_alert", "event_notice", "exam_result", "general",
]);

function extractVars(body: string): string[] {
  const re = /\{(\w+)\}/g;
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) set.add(m[1]);
  return [...set];
}

export const PUT = withSession(async ({ session, req, params }) => {
  const allowed = await checkPermission(session, "communications", "update");
  if (!allowed) return forbidden("You don't have permission to update templates");

  const id = params?.id;
  if (!id) return fail("Template id required");

  const existing = await db.messageTemplate.findFirst({
    where: { id, tenantId: session.tenantId },
  });
  if (!existing) return fail("Template not found", 404);

  const body = await req.json().catch(() => ({}));
  const { name, channel, subject, body: msgBody, variables, category } = body || {};

  const data: Record<string, unknown> = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim();
  if (typeof channel === "string" && VALID_CHANNELS.has(channel)) data.channel = channel;
  if (typeof subject === "string") data.subject = subject.trim() || null;
  if (typeof msgBody === "string" && msgBody.trim()) {
    data.body = msgBody.trim();
    data.variables = JSON.stringify(
      Array.isArray(variables) ? variables.map(String) : extractVars(msgBody)
    );
  } else if (Array.isArray(variables)) {
    data.variables = JSON.stringify(variables.map(String));
  }
  if (typeof category === "string" && VALID_CATEGORIES.has(category)) data.category = category;

  const updated = await db.messageTemplate.update({ where: { id }, data });

  await auditAfter(session, {
    action: "update", module: "communications",
    entityId: id, entityName: `Template: ${updated.name}`,
  });

  return ok(updated);
});

export const DELETE = withSession(async ({ session, params }) => {
  const allowed = await checkPermission(session, "communications", "delete");
  if (!allowed) return forbidden("You don't have permission to delete templates");

  const id = params?.id;
  if (!id) return fail("Template id required");

  const existing = await db.messageTemplate.findFirst({
    where: { id, tenantId: session.tenantId }, select: { id: true, name: true },
  });
  if (!existing) return fail("Template not found", 404);

  await db.messageTemplate.delete({ where: { id } });

  await auditAfter(session, {
    action: "delete", module: "communications",
    entityId: id, entityName: `Template: ${existing.name}`,
  });

  return ok({ id, deleted: true });
});
