// Attendance API — list (with filters + person name lookup) & bulk mark (upsert)
// GET  /api/attendance?date=&personType=&status=&page=1&limit=50
// POST /api/attendance  { date?, entries: [{ personId, personType, status, notes? }] }
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

const PERSON_TYPES = new Set(["student", "teacher"]);
const STATUSES = new Set(["present", "absent", "late", "leave"]);

// GET — list attendance records with person name resolution
export const GET = withSession(async ({ session, req }) => {
  const url = new URL(req.url);
  const dateStr = url.searchParams.get("date") || "";
  const personType = url.searchParams.get("personType") || "";
  const status = url.searchParams.get("status") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));

  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (personType && PERSON_TYPES.has(personType)) where.personType = personType;
  if (status && STATUSES.has(status)) where.status = status;
  if (dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      where.date = { gte: start, lt: end };
    }
  }

  const [rows, total] = await Promise.all([
    db.attendance.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.attendance.count({ where }),
  ]);

  // Resolve person names in parallel
  const studentIds = [...new Set(rows.filter((r) => r.personType === "student").map((r) => r.personId))];
  const teacherIds = [...new Set(rows.filter((r) => r.personType === "teacher").map((r) => r.personId))];
  const [students, teachers] = await Promise.all([
    studentIds.length
      ? db.student.findMany({ where: { id: { in: studentIds }, tenantId: session.tenantId }, select: { id: true, name: true, rollNo: true, classId: true } })
      : Promise.resolve([]),
    teacherIds.length
      ? db.teacher.findMany({ where: { id: { in: teacherIds }, tenantId: session.tenantId }, select: { id: true, name: true, designation: true } })
      : Promise.resolve([]),
  ]);

  const studentMap = new Map(students.map((s) => [s.id, s]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));

  const items = rows.map((r) => {
    const meta = r.personType === "student"
      ? studentMap.get(r.personId)
      : teacherMap.get(r.personId);
    return {
      id: r.id,
      personId: r.personId,
      personType: r.personType,
      personName: meta?.name ?? "—",
      rollNo: r.personType === "student" ? (meta as { rollNo?: string } | undefined)?.rollNo ?? null : null,
      designation: r.personType === "teacher" ? (meta as { designation?: string } | undefined)?.designation ?? null : null,
      date: r.date.toISOString(),
      status: r.status,
      notes: r.notes,
      markedBy: r.markedBy,
    };
  });

  return ok({ items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
});

// POST — bulk upsert attendance for a single date
type Entry = { personId?: string; personType?: string; status?: string; notes?: string };
type Payload = { date?: string; entries?: Entry[] };

export const POST = withSession(async ({ session, req }) => {
  // RBAC: require attendance:create permission
  const allowed = await checkPermission(session, "attendance", "create");
  if (!allowed) return forbidden("You don't have permission to mark attendance");

  const body = (await req.json().catch(() => ({}))) as Payload;
  const entries = Array.isArray(body.entries) ? body.entries : [];
  if (entries.length === 0) return fail("No attendance entries provided");

  // Resolve date (default today, midnight local)
  let date: Date;
  if (body.date) {
    const d = new Date(body.date);
    if (isNaN(d.getTime())) return fail("Invalid date");
    date = d;
  } else {
    date = new Date();
  }
  date.setHours(0, 0, 0, 0);

  // Validate every entry first
  for (const [i, e] of entries.entries()) {
    if (!e.personId) return fail(`Entry ${i + 1}: personId is required`);
    if (!e.personType || !PERSON_TYPES.has(e.personType)) return fail(`Entry ${i + 1}: invalid personType`);
    if (!e.status || !STATUSES.has(e.status)) return fail(`Entry ${i + 1}: invalid status`);
  }

  // Verify persons belong to tenant
  const stuIds = entries.filter((e) => e.personType === "student").map((e) => e.personId!);
  const tchIds = entries.filter((e) => e.personType === "teacher").map((e) => e.personId!);
  if (stuIds.length) {
    const c = await db.student.count({ where: { id: { in: stuIds }, tenantId: session.tenantId } });
    if (c !== stuIds.length) return fail("Some students do not belong to your tenant");
  }
  if (tchIds.length) {
    const c = await db.teacher.count({ where: { id: { in: tchIds }, tenantId: session.tenantId } });
    if (c !== tchIds.length) return fail("Some teachers do not belong to your tenant");
  }

  // Upsert each entry (unique constraint: [tenantId, personId, personType, date])
  const results = await db.$transaction(
    entries.map((e) =>
      db.attendance.upsert({
        where: {
          tenantId_personId_personType_date: {
            tenantId: session.tenantId,
            personId: e.personId!,
            personType: e.personType!,
            date,
          },
        },
        create: {
          tenantId: session.tenantId,
          personId: e.personId!,
          personType: e.personType!,
          date,
          status: e.status!,
          notes: e.notes?.trim() || null,
          markedBy: session.userId,
        },
        update: {
          status: e.status!,
          notes: e.notes?.trim() || null,
          markedBy: session.userId,
        },
      })
    )
  );

  await auditAfter(session, {
    action: "update",
    module: "attendance",
    entityName: `Attendance — ${date.toISOString().slice(0, 10)}`,
    details: { date: date.toISOString(), count: results.length, types: { student: stuIds.length, teacher: tchIds.length } },
  });

  return ok({ saved: results.length, date: date.toISOString() });
});
