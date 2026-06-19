// Hostel — allocate a bed to a student (or release it)
// POST /api/hostel/allocate      { bedId, studentId }      → allocate
// POST /api/hostel/allocate      { bedId, action: "release" } → release
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized, auditAfter } from "@/lib/api";

type Input = {
  bedId?: string;
  studentId?: string;
  action?: "allocate" | "release";
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as Input;
  const bedId = (body.bedId || "").trim();
  if (!bedId) return fail("Bed ID required");

  const bed = await db.bed.findFirst({
    where: { id: bedId, room: { floor: { block: { hostel: { tenantId: session.tenantId } } } } },
    include: {
      allocations: { where: { releasedAt: null }, include: { student: { select: { name: true } } } },
      room: { select: { roomNumber: true, floor: { select: { level: true, block: { select: { name: true, hostel: { select: { name: true } } } } } } } },
    },
  });
  if (!bed) return fail("Bed not found", 404);

  const action = body.action === "release" ? "release" : "allocate";

  if (action === "release") {
    if (bed.allocations.length === 0) return fail("Bed is already vacant");
    const active = bed.allocations[0];
    await db.bedAllocation.update({
      where: { id: active.id },
      data: { releasedAt: new Date() },
    });
    await db.bed.update({ where: { id: bed.id }, data: { status: "vacant" } });

    await auditAfter(session, {
      action: "update", module: "hostel", entityId: bed.id,
      entityName: bed.bedNumber,
      details: { type: "release", studentId: active.studentId },
    });

    return ok({ released: true, bedId });
  }

  // allocate
  const studentId = (body.studentId || "").trim();
  if (!studentId) return fail("Student ID required");

  const student = await db.student.findFirst({
    where: { id: studentId, tenantId: session.tenantId },
    select: { id: true, name: true },
  });
  if (!student) return fail("Student not found", 404);

  if (bed.status === "maintenance") return fail("Bed is under maintenance");
  if (bed.allocations.length > 0) return fail("Bed is already occupied");

  const allocation = await db.bedAllocation.create({
    data: { bedId, studentId, tenantId: session.tenantId },
  });
  await db.bed.update({ where: { id: bed.id }, data: { status: "occupied" } });

  await auditAfter(session, {
    action: "create", module: "hostel", entityId: allocation.id,
    entityName: `${student.name} → ${bed.bedNumber}`,
    details: { type: "allocate", bedId, studentId },
  });

  return ok({ allocation, bedId }, 201);
}
