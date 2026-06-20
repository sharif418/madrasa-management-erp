// Staff Leave [id] API — PATCH to approve / reject a pending leave request.
// PATCH /api/teachers/leave/[id]  { status: "approved" | "rejected" }
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, forbidden } from "@/lib/api";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const allowed = await checkPermission(session, "teachers", "update");
  if (!allowed) return forbidden("No permission to approve/reject leave");

  const { id } = await ctx.params;
  if (!id) return fail("Leave id is required");

  const body = await req.json().catch(() => ({}));
  const status = body?.status;
  if (status !== "approved" && status !== "rejected") {
    return fail("Status must be 'approved' or 'rejected'");
  }

  const existing = await db.staffLeave.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { teacher: { select: { name: true } } },
  });
  if (!existing) return fail("Leave request not found", 404);

  const updated = await db.staffLeave.update({
    where: { id },
    data: {
      status,
      approvedBy: session.userId,
      approvedAt: new Date(),
    },
  });

  await recordAudit({
    session,
    action: "update",
    module: "teachers",
    entityId: updated.id,
    entityName: `Leave — ${existing.teacher?.name ?? "—"}`,
    details: { status, teacherId: existing.teacherId, type: existing.type },
  });

  return ok(updated);
}
