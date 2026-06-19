// GET /api/dashboard/teacher — role-specific dashboard data for teachers
// Scoped by tenantId. Links the logged-in User to a Teacher record by phone.
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { ok, unauthorized } from "@/lib/api";

// Map JS getDay() (0=Sun..6=Sat) → timetable day code used in the schema.
const DAY_CODES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function todayCode(): string {
  return DAY_CODES[new Date().getDay()];
}

// Parse "HH:mm" string → minutes since midnight. Returns 0 on bad input.
function toMinutes(t: string | null | undefined): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  const { tenantId, userId, phone } = session;

  // Link the user to a Teacher profile by phone within the same tenant.
  const teacher = await db.teacher.findFirst({
    where: { tenantId, phone },
    select: { id: true, name: true, nameArabic: true, designation: true, specialization: true, photoUrl: true },
  });

  // Classes assigned to this teacher (Class.teacherId → Teacher.id).
  const myClasses = teacher
    ? await db.class.findMany({
        where: { tenantId, teacherId: teacher.id },
        select: {
          id: true, name: true, code: true, level: true, capacity: true, curriculum: true,
          _count: { select: { students: true } },
        },
        orderBy: { level: "asc" },
      })
    : [];

  const classIds = myClasses.map((c) => c.id);

  // Parallel: today's slots, student counts, hafiz students, recent hifz, exams
  const day = todayCode();
  const [todaySlots, studentCount, hafizCount, recentHifz, exams] = await Promise.all([
    db.timetableSlot.findMany({
      where: { tenantId, classId: { in: classIds.length ? classIds : undefined }, day },
      select: { id: true, startTime: true, endTime: true, subject: true, room: true, classId: true },
      orderBy: { startTime: "asc" },
    }),
    db.student.count({ where: { tenantId, classId: { in: classIds.length ? classIds : undefined } } }),
    db.student.count({ where: { tenantId, classId: { in: classIds.length ? classIds : undefined }, isHafiz: true } }),
    db.hifzRecord.findMany({
      where: { tenantId, teacherId: userId },
      orderBy: { recordedAt: "desc" },
      take: 5,
      select: {
        id: true, type: true, paraNumber: true, qualityRating: true, recordedAt: true,
        student: { select: { name: true } },
      },
    }),
    db.exam.findMany({
      where: { tenantId, classId: { in: classIds.length ? classIds : undefined } },
      orderBy: { startDate: "asc" },
      take: 5,
      select: { id: true, name: true, term: true, startDate: true, endDate: true, classId: true, class: { select: { name: true } } },
    }),
  ]);

  const classNameById = new Map(myClasses.map((c) => [c.id, c.name] as const));

  return ok({
    teacher: teacher
      ? { name: teacher.name, nameArabic: teacher.nameArabic, designation: teacher.designation, specialization: teacher.specialization, photoUrl: teacher.photoUrl }
      : null,
    myClasses: myClasses.map((c) => ({
      id: c.id, name: c.name, code: c.code, level: c.level, capacity: c.capacity,
      curriculum: c.curriculum, studentCount: c._count.students,
    })),
    todaySchedule: todaySlots.map((s) => ({
      id: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      subject: s.subject,
      room: s.room,
      className: classNameById.get(s.classId ?? "") ?? "—",
      startMinutes: toMinutes(s.startTime),
      endMinutes: toMinutes(s.endTime),
    })),
    recentHifz: recentHifz.map((r) => ({
      id: r.id,
      studentName: r.student?.name ?? "—",
      type: r.type,
      paraNumber: r.paraNumber,
      qualityRating: r.qualityRating,
      recordedAt: r.recordedAt,
    })),
    myExams: exams.map((e) => ({
      id: e.id,
      name: e.name,
      term: e.term,
      startDate: e.startDate,
      endDate: e.endDate,
      className: e.class?.name ?? "—",
    })),
    stats: {
      totalClasses: myClasses.length,
      totalStudents: studentCount,
      todayClasses: todaySlots.length,
      hifzStudents: hafizCount,
    },
  });
}
