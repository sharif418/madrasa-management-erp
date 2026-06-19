// Vaccination API — POST create vaccination record
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter } from "@/lib/api";

type Body = {
  studentId?: string;
  vaccineName?: string;
  doseNumber?: number;
  dateAdministered?: string;
  nextDue?: string | null;
  administeredBy?: string;
  batchNumber?: string;
};

export const POST = withSession(async ({ session, req }) => {
  const body = (await req.json().catch(() => ({}))) as Body;
  const tenantId = session.tenantId;
  if (!body.studentId) return fail("Student is required");
  if (!body.vaccineName || !body.vaccineName.trim()) return fail("Vaccine name is required");

  const stu = await db.student.findFirst({
    where: { id: body.studentId, tenantId },
    select: { id: true, name: true },
  });
  if (!stu) return fail("Student not found");

  const dateAdministered = body.dateAdministered ? new Date(body.dateAdministered) : new Date();
  if (isNaN(dateAdministered.getTime())) return fail("Invalid date");

  let nextDue: Date | null = null;
  if (body.nextDue) {
    const d = new Date(body.nextDue);
    if (!isNaN(d.getTime())) nextDue = d;
  }

  const created = await db.vaccination.create({
    data: {
      tenantId,
      studentId: body.studentId,
      vaccineName: body.vaccineName.trim(),
      doseNumber: Number(body.doseNumber) || 1,
      dateAdministered,
      nextDue,
      administeredBy: body.administeredBy?.trim() || null,
      batchNumber: body.batchNumber?.trim() || null,
    },
  });

  await auditAfter(session, {
    action: "create", module: "health", entityId: created.id,
    entityName: `${stu.name} — ${body.vaccineName}`,
    details: { kind: "vaccination", doseNumber: created.doseNumber },
  });

  return ok(created, 201);
});
