// Hostel — gate pass: create / mark-used
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized, auditAfter } from "@/lib/api";

type Input = {
  studentId?: string;
  reason?: string;
  outTime?: string;
  inTime?: string;
  status?: string;
  action?: "create" | "use";
  gatePassId?: string;
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as Input;

  // Mark-used flow: existing gate pass returns
  if (body.action === "use" && body.gatePassId) {
    const gp = await db.gatePass.findFirst({
      where: { id: body.gatePassId, tenantId: session.tenantId },
    });
    if (!gp) return fail("Gate pass not found", 404);

    const updated = await db.gatePass.update({
      where: { id: gp.id },
      data: { status: "used", inTime: body.inTime ? new Date(body.inTime) : new Date() },
    });

    await auditAfter(session, {
      action: "update", module: "hostel", entityId: updated.id,
      entityName: `GatePass ${gp.id}`,
      details: { type: "gatepass_use" },
    });

    return ok(updated);
  }

  // Create flow
  const studentId = (body.studentId || "").trim();
  const reason = (body.reason || "").trim();
  if (!studentId) return fail("Student ID required");
  if (!reason) return fail("Reason required");

  const student = await db.student.findFirst({
    where: { id: studentId, tenantId: session.tenantId },
    select: { id: true, name: true },
  });
  if (!student) return fail("Student not found", 404);

  const outTime = body.outTime ? new Date(body.outTime) : new Date();
  const status = body.status === "pending" ? "pending" : "approved";

  const gatePass = await db.gatePass.create({
    data: {
      tenantId: session.tenantId,
      studentId,
      reason,
      outTime,
      status,
      approvedBy: session.userId,
    },
  });

  await auditAfter(session, {
    action: "create", module: "hostel", entityId: gatePass.id,
    entityName: `${student.name} → ${reason}`,
    details: { type: "gatepass", studentId, reason, status },
  });

  return ok(gatePass, 201);
}
