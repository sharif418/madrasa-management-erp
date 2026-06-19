// Transport allocation deletion — DELETE /api/transport/[id]
import { db } from "@/lib/db";
import { ok, fail, notFound, withSession, auditAfter } from "@/lib/api";

export const DELETE = withSession(async ({ session, params }) => {
  const id = params?.id;
  if (!id) return fail("Missing allocation id");

  const alloc = await db.transportAllocation.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { student: { select: { name: true } } },
  });
  if (!alloc) return notFound("Allocation not found");

  await db.transportAllocation.delete({ where: { id } });

  await auditAfter(session, {
    action: "delete", module: "transport", entityId: id,
    entityName: alloc.student?.name || "allocation",
    details: { vehicleId: alloc.vehicleId, routeId: alloc.routeId },
  });

  return ok({ id });
});
