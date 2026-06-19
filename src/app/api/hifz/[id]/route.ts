// DELETE /api/hifz/[id] — delete a hifz record (tenant-scoped)
import { db } from "@/lib/db";
import { ok, notFound, withSession, auditAfter } from "@/lib/api";

export const DELETE = withSession(async ({ session, params }) => {
  const id = params?.id;
  if (!id) return notFound("Hifz record not found");

  // Tenant-scoped fetch first to confirm ownership before delete
  const existing = await db.hifzRecord.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { student: { select: { name: true } } },
  });
  if (!existing) return notFound("Hifz record not found");

  await db.hifzRecord.delete({ where: { id: existing.id } });

  await auditAfter(session, {
    action: "delete",
    module: "hifz",
    entityId: existing.id,
    entityName: `${existing.student?.name ?? "Unknown"} — ${existing.type} (Para ${existing.paraNumber})`,
    details: { type: existing.type, paraNumber: existing.paraNumber, status: existing.status },
  });

  return ok({ id: existing.id, deleted: true });
});
