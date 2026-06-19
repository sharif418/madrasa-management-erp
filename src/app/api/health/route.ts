// Health & Wellness API
// GET  /api/health                  — list records + vaccinations + KPIs
// POST /api/health                  — create health record
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter } from "@/lib/api";

const RECORD_TYPES = new Set(["checkup", "vaccination", "illness", "allergy", "injury", "dental", "vision"]);
const SEVERITIES = new Set(["mild", "moderate", "severe"]);
const STATUSES = new Set(["ongoing", "treated", "referred"]);

// GET — health records + vaccinations + KPIs
export const GET = withSession(async ({ session }) => {
  const tenantId = session.tenantId;

  const [records, vaccinations, students] = await Promise.all([
    db.healthRecord.findMany({
      where: { tenantId },
      include: { student: { select: { id: true, name: true, rollNo: true } } },
      orderBy: { date: "desc" },
    }),
    db.vaccination.findMany({
      where: { tenantId },
      include: { student: { select: { id: true, name: true, rollNo: true } } },
      orderBy: { dateAdministered: "desc" },
    }),
    db.student.count({ where: { tenantId, isActive: true } }),
  ]);

  // Follow-ups due within next 7 days
  const now = new Date();
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const followupsDue = records.filter(
    (r) => r.followUpDate && r.followUpDate >= now && r.followUpDate <= weekLater
  ).length;

  // Vaccination rate = vaccinated students / active students
  const vaccinatedStudents = new Set(vaccinations.map((v) => v.studentId)).size;
  const vaccRate = students > 0 ? Math.round((vaccinatedStudents / students) * 100) : 0;

  return ok({
    records: records.map((r) => ({
      id: r.id,
      recordType: r.recordType,
      date: r.date.toISOString(),
      description: r.description,
      diagnosis: r.diagnosis,
      treatment: r.treatment,
      medication: r.medication,
      doctorName: r.doctorName,
      followUpDate: r.followUpDate ? r.followUpDate.toISOString() : null,
      severity: r.severity,
      status: r.status,
      student: r.student,
    })),
    vaccinations: vaccinations.map((v) => ({
      id: v.id,
      vaccineName: v.vaccineName,
      doseNumber: v.doseNumber,
      dateAdministered: v.dateAdministered.toISOString(),
      nextDue: v.nextDue ? v.nextDue.toISOString() : null,
      administeredBy: v.administeredBy,
      batchNumber: v.batchNumber,
      student: v.student,
    })),
    kpis: {
      totalRecords: records.length,
      vaccinationRate: vaccRate,
      vaccinatedStudents,
      followupsDue,
      activeStudents: students,
    },
  });
});

// POST — create health record
type Body = {
  studentId?: string;
  recordType?: string;
  date?: string;
  description?: string;
  diagnosis?: string;
  treatment?: string;
  medication?: string;
  doctorName?: string;
  followUpDate?: string | null;
  severity?: string;
  status?: string;
};

export const POST = withSession(async ({ session, req }) => {
  const body = (await req.json().catch(() => ({}))) as Body;
  const tenantId = session.tenantId;
  if (!body.studentId) return fail("Student is required");
  if (!body.description || !body.description.trim()) return fail("Description is required");

  const stu = await db.student.findFirst({
    where: { id: body.studentId, tenantId },
    select: { id: true, name: true },
  });
  if (!stu) return fail("Student not found");

  const recordType = body.recordType && RECORD_TYPES.has(body.recordType) ? body.recordType : "checkup";
  const severity = body.severity && SEVERITIES.has(body.severity) ? body.severity : "mild";
  const status = body.status && STATUSES.has(body.status) ? body.status : "treated";

  const date = body.date ? new Date(body.date) : new Date();
  if (isNaN(date.getTime())) return fail("Invalid date");

  let followUpDate: Date | null = null;
  if (body.followUpDate) {
    const d = new Date(body.followUpDate);
    if (!isNaN(d.getTime())) followUpDate = d;
  }

  const created = await db.healthRecord.create({
    data: {
      tenantId,
      studentId: body.studentId,
      recordType,
      date,
      description: body.description.trim(),
      diagnosis: body.diagnosis?.trim() || null,
      treatment: body.treatment?.trim() || null,
      medication: body.medication?.trim() || null,
      doctorName: body.doctorName?.trim() || null,
      followUpDate,
      severity,
      status,
    },
  });

  await auditAfter(session, {
    action: "create", module: "health", entityId: created.id,
    entityName: stu.name, details: { recordType, severity, status },
  });

  return ok(created, 201);
});
