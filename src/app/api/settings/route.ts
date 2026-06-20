// Settings API — GET (tenant info) + PUT (update fields except plan/status)
// All scoped to session.tenantId.
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter } from "@/lib/api";

const CURRENCIES = new Set(["BDT", "USD", "SAR", "EUR"]);
const LANGUAGES = new Set(["bn", "en", "ar"]);

// Theme presets — backward compat single colors + new 3-color palettes
const THEME_PRESETS = new Set([
  "emerald", "violet", "rose", "amber", "teal", "cyan",
  "emeraldIslamic", "royalViolet", "sunsetAmber", "oceanTeal", "roseGarden",
]);

// Validate theme value: preset key OR custom palette "custom:#hex,#hex,#hex"
function isValidTheme(v: string): boolean {
  if (typeof v !== "string" || !v) return false;
  if (v.length > 80) return false;
  if (THEME_PRESETS.has(v)) return true;
  if (v.startsWith("custom:")) {
    const colors = v.slice(7).split(",");
    if (colors.length < 1 || colors.length > 3) return false;
    return colors.every((c) => /^#[0-9a-fA-F]{6}$/.test(c));
  }
  return false;
}

// GET /api/settings — return current tenant info
export const GET = withSession(async ({ session }) => {
  const tenant = await db.tenant.findUnique({
    where: { id: session.tenantId },
    select: {
      id: true, name: true, subdomain: true, logoUrl: true,
      phone: true, email: true, address: true,
      currency: true, language: true, theme: true,
      plan: true, status: true, latitude: true, longitude: true,
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
  latitude?: number | string | null;
  longitude?: number | string | null;
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
  if (body.theme !== undefined && isValidTheme(body.theme)) data.theme = body.theme;
  if (body.latitude !== undefined) {
    const lat = typeof body.latitude === "string" ? parseFloat(body.latitude) : body.latitude;
    data.latitude = lat == null || isNaN(lat) ? null : Math.max(-90, Math.min(90, lat));
  }
  if (body.longitude !== undefined) {
    const lng = typeof body.longitude === "string" ? parseFloat(body.longitude) : body.longitude;
    data.longitude = lng == null || isNaN(lng) ? null : Math.max(-180, Math.min(180, lng));
  }

  if (Object.keys(data).length === 0) return fail("No valid fields to update");

  const updated = await db.tenant.update({
    where: { id: session.tenantId },
    data,
    select: {
      id: true, name: true, subdomain: true, logoUrl: true,
      phone: true, email: true, address: true,
      currency: true, language: true, theme: true,
      plan: true, status: true, latitude: true, longitude: true,
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
