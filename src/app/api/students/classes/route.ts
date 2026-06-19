// GET /api/students/classes — lightweight class list for student form dropdown
// Kept inside students namespace to avoid touching /api/classes (other agent's scope).
import { db } from "@/lib/db";
import { ok, withSession } from "@/lib/api";

export const GET = withSession(async ({ session }) => {
  const classes = await db.class.findMany({
    where: { tenantId: session.tenantId },
    orderBy: [{ level: "asc" }, { name: "asc" }],
    select: { id: true, name: true, code: true, level: true, curriculum: true },
  });
  return ok({ items: classes });
});
