// GET /api/auth/me — current session info
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { ok, unauthorized } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  const tenant = await db.tenant.findUnique({
    where: { id: session.tenantId },
    select: { id: true, name: true, language: true, theme: true, plan: true, currency: true },
  });

  return ok({ user: session, tenant });
}
