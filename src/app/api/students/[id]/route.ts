// Student by id — GET (with relations), PUT (update), DELETE
// All scoped by tenantId from session.
import { db } from "@/lib/db";
import { ok, fail, notFound, withSession, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

// Helper: fetch one tenant-scoped student
async function getStudent(id: string, tenantId: string) {
  return db.student.findFirst({
    where: { id, tenantId },
    include: { class: true, wallet: true },
  });
}

// GET /api/students/[id]
export const GET = withSession(async ({ session, params }) => {
  const id = params?.id;
  if (!id) return fail("Missing student id");
  const student = await getStudent(id, session.tenantId);
  if (!student) return notFound("Student not found");

  // Aggregated stats (hifz records count, fee collections summary)
  const [hifzCount, feeAgg] = await Promise.all([
    db.hifzRecord.count({ where: { tenantId: session.tenantId, studentId: id } }),
    db.feeCollection.aggregate({
      where: { tenantId: session.tenantId, studentId: id },
      _sum: { amount: true, paidAmount: true },
      _count: true,
    }),
  ]);

  return ok({
    ...student,
    hifzCount,
    feeSummary: {
      total: feeAgg._sum.amount ?? 0,
      paid: feeAgg._sum.paidAmount ?? 0,
      due: (feeAgg._sum.amount ?? 0) - (feeAgg._sum.paidAmount ?? 0),
      count: feeAgg._count,
    },
  });
});

// PUT /api/students/[id]
export const PUT = withSession(async ({ session, req, params }) => {
  const id = params?.id;
  if (!id) return fail("Missing student id");

  const existing = await getStudent(id, session.tenantId);
  if (!existing) return notFound("Student not found");

  const body = await req.json().catch(() => ({}));
  const {
    name, nameArabic, rollNo, gender, dob, phone,
    guardianName, guardianPhone, guardianRelation,
    address, bloodGroup, classId,
    isHafiz, isZakatEligible, isActive,
  } = body || {};

  // If updating name, must be non-empty
  if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    return fail("Name cannot be empty");
  }

  // Roll No uniqueness (excluding current record)
  if (rollNo !== undefined && rollNo && rollNo !== existing.rollNo) {
    const dup = await db.student.findFirst({
      where: { tenantId: session.tenantId, rollNo, NOT: { id } },
      select: { id: true },
    });
    if (dup) return fail("Roll No already exists for another student");
  }

  // Validate classId belongs to tenant
  if (classId) {
    const cls = await db.class.findFirst({
      where: { id: classId, tenantId: session.tenantId },
      select: { id: true },
    });
    if (!cls) return fail("Selected class does not exist in your madrasa");
  }

  // Build update payload (only provided fields)
  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name.trim();
  if (nameArabic !== undefined) data.nameArabic = nameArabic?.trim() || null;
  if (rollNo !== undefined) data.rollNo = rollNo?.trim() || null;
  if (gender !== undefined) data.gender = gender === "female" ? "female" : "male";
  if (phone !== undefined) data.phone = phone?.trim() || null;
  if (guardianName !== undefined) data.guardianName = guardianName?.trim() || null;
  if (guardianPhone !== undefined) data.guardianPhone = guardianPhone?.trim() || null;
  if (guardianRelation !== undefined) data.guardianRelation = guardianRelation || null;
  if (address !== undefined) data.address = address?.trim() || null;
  if (bloodGroup !== undefined) data.bloodGroup = bloodGroup || null;
  if (classId !== undefined) data.classId = classId || null;
  if (isHafiz !== undefined) data.isHafiz = !!isHafiz;
  if (isZakatEligible !== undefined) data.isZakatEligible = !!isZakatEligible;
  if (isActive !== undefined) data.isActive = !!isActive;
  if (dob !== undefined) {
    if (dob) {
      const d = new Date(dob);
      data.dob = isNaN(d.getTime()) ? null : d;
    } else {
      data.dob = null;
    }
  }

  const updated = await db.student.update({
    where: { id },
    data,
    include: { class: true, wallet: true },
  });

  // Capture before/after for audit — only the scalar fields that changed.
  const { class: _x, wallet: _y, ...beforeScalars } = existing as Record<string, unknown>;
  const { class: _a, wallet: _b, ...afterScalars } = updated as Record<string, unknown>;

  await auditAfter(session, {
    action: "update",
    module: "students",
    entityId: id,
    entityName: updated.name,
    before: beforeScalars,
    after: afterScalars,
    details: { changed: Object.keys(data) },
  });

  return ok(updated);
});

// DELETE /api/students/[id]
export const DELETE = withSession(async ({ session, params }) => {
  // RBAC: require students:delete permission
  const allowed = await checkPermission(session, "students", "delete");
  if (!allowed) return forbidden("You don't have permission to delete students");

  const id = params?.id;
  if (!id) return fail("Missing student id");

  const existing = await getStudent(id, session.tenantId);
  if (!existing) return notFound("Student not found");

  // Cascade-related records handled by Prisma relations, but we explicitly
  // remove the wallet to keep clean state (wallet is 1:1 with student).
  await db.student.delete({ where: { id } });

  await auditAfter(session, {
    action: "delete",
    module: "students",
    entityId: id,
    entityName: existing.name,
  });

  return ok({ id });
});
