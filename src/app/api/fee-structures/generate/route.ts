// Fee Structures generate API — auto-create FeeCollection records for all
// active students in a class (or all classes). Idempotent per feeStructure + month.
// POST /api/fee-structures/generate  body: { feeStructureId, classId?, month?, dueDate? }
import { db } from "@/lib/db";
import { ok, fail, forbidden, withSession, auditAfter } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

type GenerateBody = {
  feeStructureId?: string;
  classId?: string | null;
  month?: string | null; // "YYYY-MM"
  dueDate?: string | null; // ISO date
};

// Parse "YYYY-MM" → Date at first day of that month (UTC).
function monthStart(month: string): Date | null {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return null;
  return new Date(Date.UTC(y, mo - 1, 1));
}

// Build a month-range (start..endExclusive) from a date for dedup queries.
function monthRange(d: Date): { gte: Date; lt: Date } {
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  return { gte: start, lt: end };
}

export const POST = withSession(async ({ session, req }) => {
  const allowed = await checkPermission(session, "finance", "create");
  if (!allowed) return forbidden("No permission to generate collections");

  const body = (await req.json().catch(() => ({}))) as GenerateBody;
  const { feeStructureId, classId, month, dueDate } = body;

  if (!feeStructureId || typeof feeStructureId !== "string") {
    return fail("feeStructureId is required");
  }

  const structure = await db.feeStructure.findFirst({
    where: { id: feeStructureId, tenantId: session.tenantId },
    select: { id: true, name: true, amount: true, type: true, frequency: true, classId: true },
  });
  if (!structure) return fail("Fee structure not found", 404);

  // Resolve dueDate — prefer explicit dueDate, else month→first-of-month, else now+7d
  let resolvedDue: Date | null = null;
  if (typeof month === "string" && month.trim()) {
    resolvedDue = monthStart(month.trim());
    if (!resolvedDue) return fail("Invalid month format. Use YYYY-MM");
  } else if (typeof dueDate === "string" && dueDate.trim()) {
    const d = new Date(dueDate);
    if (Number.isNaN(d.getTime())) return fail("Invalid dueDate");
    resolvedDue = d;
  } else {
    resolvedDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  // Resolve target class — explicit classId overrides structure.classId
  let targetClassId: string | null = null;
  if (classId === "all" || classId === null || classId === undefined || classId === "") {
    targetClassId = structure.classId; // may still be null (all classes)
  } else if (typeof classId === "string") {
    const cls = await db.class.findFirst({
      where: { id: classId, tenantId: session.tenantId },
      select: { id: true },
    });
    if (!cls) return fail("Class not found");
    targetClassId = cls.id;
  }

  // Fetch active students in scope
  const students = await db.student.findMany({
    where: {
      tenantId: session.tenantId,
      isActive: true,
      ...(targetClassId ? { classId: targetClassId } : {}),
    },
    select: { id: true, name: true, classId: true },
  });

  if (students.length === 0) {
    return ok({ generated: 0, skipped: 0, total: 0, message: "No active students in scope" });
  }

  // Dedup: find existing collections for this feeStructureId in the same month
  const range = monthRange(resolvedDue);
  const existing = await db.feeCollection.findMany({
    where: {
      tenantId: session.tenantId,
      feeStructureId: structure.id,
      dueDate: { gte: range.gte, lt: range.lt },
    },
    select: { studentId: true },
  });
  const existingSet = new Set(existing.map((e) => e.studentId));

  const toCreate = students
    .filter((s) => !existingSet.has(s.id))
    .map((s) => ({
      tenantId: session.tenantId,
      studentId: s.id,
      feeStructureId: structure.id,
      amount: structure.amount,
      paidAmount: 0,
      dueDate: resolvedDue!,
      status: "pending",
    }));

  let created = 0;
  if (toCreate.length > 0) {
    const r = await db.feeCollection.createMany({ data: toCreate });
    created = r.count;
  }

  const skipped = students.length - created;

  await auditAfter(session, {
    action: "create",
    module: "finance",
    entityId: structure.id,
    entityName: structure.name,
    details: {
      generated: created,
      skipped,
      total: students.length,
      feeStructureId: structure.id,
      classId: targetClassId,
      month: typeof month === "string" ? month : null,
      dueDate: resolvedDue.toISOString(),
    },
  });

  return ok({ generated: created, skipped, total: students.length });
});
