// DELETE /api/hifz/tajweed/[id] — delete a tajweed assessment (tenant-scoped)
import { db } from "@/lib/db";
import { ok, notFound, withSession, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

export const DELETE = withSession(async ({ session, params }) => {
  const id = params?.id;
  if (!id) return notFound("Assessment not found");

  const allowed = await checkPermission(session, "hifz", "delete");
  if (!allowed) return forbidden("You don't have permission to delete assessments");

  const existing = await db.tajweedAssessment.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { student: { select: { name: true } } },
  });
  if (!existing) return notFound("Assessment not found");

  await db.tajweedAssessment.delete({ where: { id: existing.id } });

  await auditAfter(session, {
    action: "delete",
    module: "hifz",
    entityId: existing.id,
    entityName: `${existing.student?.name ?? "Unknown"} — Tajweed ${existing.surahName}`,
    details: { surahName: existing.surahName, total: existing.totalScore, grade: existing.grade },
  });

  return ok({ id: existing.id, deleted: true });
});
