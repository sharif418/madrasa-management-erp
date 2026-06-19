// Settings — list existing tenant roles for the Roles tab
// GET /api/settings/roles
import { db } from "@/lib/db";
import { ok, withSession } from "@/lib/api";

export const GET = withSession(async ({ session }) => {
  const roles = await db.role.findMany({
    where: { tenantId: session.tenantId },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    select: { id: true, name: true, description: true, isSystem: true, createdAt: true },
  });
  return ok({ items: roles });
});
