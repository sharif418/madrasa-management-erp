// GET /api/prayer-times — returns today's prayer times for the current tenant.
// Uses tenant's latitude/longitude. If location unset, returns null + hint.
import { db } from "@/lib/db";
import { ok, withSession } from "@/lib/api";
import { getPrayerTimes } from "@/lib/prayer-times";

export const GET = withSession(async ({ session }) => {
  const tenant = await db.tenant.findUnique({
    where: { id: session.tenantId },
    select: { latitude: true, longitude: true, language: true },
  });
  if (!tenant || tenant.latitude == null || tenant.longitude == null) {
    return ok({ available: false, message: "Set location in settings to enable prayer times." });
  }
  const locale = tenant.language === "ar" ? "ar" : tenant.language === "bn" ? "bn" : "en";
  const times = getPrayerTimes(tenant.latitude, tenant.longitude, new Date(), locale);
  return ok({ available: true, times });
});
