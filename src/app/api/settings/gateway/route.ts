// Gateway Settings API — GET & PUT (SMS / WhatsApp / Email provider config)
// Stored as tenant-scoped key-value pairs in the Setting table.
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

// Whitelisted setting keys (prevents arbitrary key injection)
const ALLOWED_KEYS = new Set([
  "sms_provider", "sms_api_key", "sms_api_secret", "sms_sender_id",
  "whatsapp_provider", "whatsapp_api_key", "whatsapp_phone_number_id",
  "email_provider", "email_smtp_host", "email_smtp_port",
  "email_username", "email_password", "email_from_email",
]);

// GET /api/settings/gateway — return all gateway settings as a key-value object
export const GET = withSession(async ({ session }) => {
  const rows = await db.setting.findMany({
    where: { tenantId: session.tenantId, key: { in: Array.from(ALLOWED_KEYS) } },
    select: { key: true, value: true },
  });
  const settings: Record<string, string> = {};
  for (const r of rows) settings[r.key] = r.value;
  return ok(settings);
});

type PutBody =
  | { key: string; value: string }
  | { settings: Record<string, string> };

// PUT /api/settings/gateway — upsert one or many settings
export const PUT = withSession(async ({ session, req }) => {
  const allowed = await checkPermission(session, "settings", "update");
  if (!allowed) return forbidden("You don't have permission to update gateway settings");

  const body = (await req.json().catch(() => ({}))) as PutBody;
  const entries: Array<[string, string]> = [];

  if ("settings" in body && body.settings && typeof body.settings === "object") {
    for (const [k, v] of Object.entries(body.settings)) {
      if (ALLOWED_KEYS.has(k)) entries.push([k, String(v ?? "")]);
    }
  } else if ("key" in body && typeof body.key === "string" && ALLOWED_KEYS.has(body.key)) {
    entries.push([body.key, String(body.value ?? "")]);
  }

  if (entries.length === 0) return fail("No valid settings provided");

  // Mask sensitive keys for audit log (don't expose API secrets)
  const SENSITIVE = /key|secret|password/i;
  const maskedChanged = entries.map(([k]) => (SENSITIVE.test(k) ? `${k}=***` : k));

  // Upsert each entry (SQLite doesn't have upsert with composite unique via Prisma easily)
  const ops = entries.map(([key, value]) =>
    db.setting.upsert({
      where: { tenantId_key: { tenantId: session.tenantId, key } },
      update: { value },
      create: { tenantId: session.tenantId, key, value },
    })
  );
  await Promise.all(ops);

  await auditAfter(session, {
    action: "update",
    module: "settings",
    entityName: "Gateway Config",
    details: { changed: maskedChanged, type: "gateway" },
  });

  // Return the updated settings (re-read to confirm)
  const rows = await db.setting.findMany({
    where: { tenantId: session.tenantId, key: { in: entries.map(([k]) => k) } },
    select: { key: true, value: true },
  });
  const result: Record<string, string> = {};
  for (const r of rows) result[r.key] = r.value;
  return ok(result);
});
