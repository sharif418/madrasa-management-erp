// Settings API — GET (tenant info) + PUT (update fields except plan/status)
// All scoped to session.tenantId.
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter } from "@/lib/api";

const CURRENCIES = new Set(["BDT", "USD", "SAR", "EUR"]);
const LANGUAGES = new Set(["bn", "en", "ar"]);
const THEMES = new Set(["emerald", "violet", "rose", "amber", "teal", "cyan"]);

// GET /api/settings — return current tenant info
export const GET = withSession(async ({ session }) => {
  const tenant = await db.tenant.findUnique({
    where: { id: session.tenantId },
    select: {
      id: true, name: true, subdomain: true, logoUrl: true,
      phone: true, email: true, address: true,
      currency: true, language: true, theme: true,
      plan: true, status: true,
    },
  });
  if (!tenant) return fail("Tenant not found", 404);
  return ok(tenant);
});

type UpdateBody = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  currency?: string;
  language?: string;
  theme?: string;
  logoUrl?: string;
};

// PUT /api/settings — update tenant info (cannot touch plan or status)
export const PUT = withSession(async ({ session, req }) => {
  const body = (await req.json().catch(() => ({}))) as UpdateBody;
  const data: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = (body.name || "").trim();
    if (!name) return fail("Name cannot be empty");
    data.name = name;
  }
  if (body.phone !== undefined) data.phone = (body.phone || "").trim() || null;
  if (body.email !== undefined) data.email = (body.email || "").trim() || null;
  if (body.address !== undefined) data.address = (body.address || "").trim() || null;
  if (body.logoUrl !== undefined) data.logoUrl = (body.logoUrl || "").trim() || null;
  if (body.currency !== undefined && CURRENCIES.has(body.currency)) data.currency = body.currency;
  if (body.language !== undefined && LANGUAGES.has(body.language)) data.language = body.language;
  if (body.theme !== undefined && THEMES.has(body.theme)) data.theme = body.theme;

  if (Object.keys(data).length === 0) return fail("No valid fields to update");

  const updated = await db.tenant.update({
    where: { id: session.tenantId },
    data,
    select: {
      id: true, name: true, subdomain: true, logoUrl: true,
      phone: true, email: true, address: true,
      currency: true, language: true, theme: true,
      plan: true, status: true,
    },
  });

  await auditAfter(session, {
    action: "update",
    module: "settings",
    entityName: updated.name,
    details: { changed: Object.keys(data) },
  });

  return ok(updated);
});
