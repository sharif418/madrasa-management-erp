// Quran Log [id] API — DELETE only.
// Tenant-scoped. RBAC: academic:delete.
import { db } from "@/lib/db";
import { ok, fail, forbidden, withSession, auditAfter } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

// DELETE /api/quranlog/[id]
export const DELETE = withSession(async ({ session, params }) => {
  const id = params?.id;
  if (!id) return fail("Quran log id is required");

  const allowed = await checkPermission(session, "academic", "delete");
  if (!allowed) return forbidden("No permission to delete Quran reading logs");

  const existing = await db.quranLog.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { student: { select: { name: true } } },
  });
  if (!existing) return fail("Quran log not found", 404);

  await db.quranLog.delete({ where: { id } });

  await auditAfter(session, {
    action: "delete",
    module: "academic",
    entityId: existing.id,
    entityName: existing.student.name,
    details: { type: "quranlog", pagesRead: existing.pagesRead, date: existing.date.toISOString().slice(0, 10) },
  });

  return ok({ id, deleted: true });
});
