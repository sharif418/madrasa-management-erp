// GET /api/dashboard/student — role-specific dashboard data for students.
// Scoped by tenantId. Links the logged-in User's phone to Student.phone.
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { ok, unauthorized } from "@/lib/api";

// JS getDay() (0=Sun..6=Sat) → timetable day code.
const DAY_CODES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
function toMinutes(t: string | null | undefined): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  const { tenantId, phone } = session;

  // Find student profile by matching phone.
  const student = await db.student.findFirst({
    where: { tenantId, phone },
    select: {
      id: true, name: true, nameArabic: true, rollNo: true, photoUrl: true,
      isHafiz: true, admissionDate: true, classId: true,
      class: { select: { name: true } },
    },
  });

  if (!student) {
    return ok({ student: null, message: "no_student_linked", stats: null, todaySchedule: [],
      hifzProgress: null, examResults: [], attendance: null, fees: null, libraryBooks: [] });
  }

  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  const day = DAY_CODES[now.getDay()];
  const sid = student.id;

  // Parallel queries — keep this under the 150-line budget.
  const [slots, teachers, hifz, exams, attendance, fees, books] = await Promise.all([
    db.timetableSlot.findMany({
      where: { tenantId, classId: student.classId ?? undefined, day },
      orderBy: { startTime: "asc" },
      select: { id: true, startTime: true, endTime: true, subject: true, room: true, teacherId: true },
    }),
    db.teacher.findMany({ where: { tenantId }, select: { id: true, name: true } }),
    db.hifzRecord.findMany({
      where: { tenantId, studentId: sid },
      orderBy: { recordedAt: "desc" },
      select: { id: true, type: true, paraNumber: true, qualityRating: true, status: true, recordedAt: true },
    }),
    db.examResult.findMany({
      where: { studentId: sid },
      orderBy: { id: "desc" },
      take: 5,
      select: { id: true, subject: true, marks: true, total: true, grade: true, remarks: true },
    }),
    db.attendance.findMany({
      where: { tenantId, personId: sid, personType: "student", date: { gte: d30 } },
      select: { status: true, date: true },
    }),
    db.feeCollection.findMany({
      where: { tenantId, studentId: sid },
      orderBy: { createdAt: "desc" },
      select: { id: true, amount: true, paidAmount: true, status: true, dueDate: true, paidDate: true, method: true },
    }),
    db.bookLending.findMany({
      where: { tenantId, studentId: sid, status: "borrowed" },
      orderBy: { dueDate: "asc" },
      select: { id: true, dueDate: true, borrowedAt: true, book: { select: { title: true } } },
    }),
  ]);

  const teacherName = new Map(teachers.map((t) => [t.id, t.name] as const));
  // Hifz: distinct paras with status="completed".
  const completedParas = new Set(hifz.filter((r) => r.status === "completed").map((r) => r.paraNumber));
  const rated = hifz.filter((r) => r.qualityRating != null);
  const avgQuality = rated.length ? Math.round((rated.reduce((s, r) => s + (r.qualityRating ?? 0), 0) / rated.length) * 10) / 10 : 0;
  const hifzPercent = Math.round((completedParas.size / 30) * 100);
  const avgMarks = exams.length ? Math.round(exams.reduce((s, r) => s + (r.total ? (r.marks / r.total) * 100 : 0), 0) / exams.length) : 0;
  // Attendance buckets + last 7 days per-day breakdown.
  const att = { present: 0, absent: 0, late: 0, leave: 0 };
  for (const a of attendance) {
    if (a.status === "present") att.present++;
    else if (a.status === "absent") att.absent++;
    else if (a.status === "late") att.late++;
    else if (a.status === "leave") att.leave++;
  }
  const totalAtt = att.present + att.absent + att.late + att.leave;
  const attRate = totalAtt ? Math.round(((att.present + att.late) / totalAtt) * 100) : 0;
  const attByDay = new Map(attendance.map((a) => [a.date.toISOString().slice(0, 10), a.status] as const));
  const last7days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 24 * 3600 * 1000);
    return { date: d.toISOString(), status: attByDay.get(d.toISOString().slice(0, 10)) ?? null };
  });
  // Fees
  const totalDue = fees.reduce((s, f) => s + (f.amount || 0), 0);
  const totalPaid = fees.reduce((s, f) => s + (f.paidAmount || 0), 0);
  const outstanding = Math.max(0, totalDue - totalPaid);
  const pendingCount = fees.filter((f) => f.status !== "paid").length;

  return ok({
    student: {
      name: student.name, nameArabic: student.nameArabic, rollNo: student.rollNo,
      className: student.class?.name ?? "—", photoUrl: student.photoUrl,
      isHafiz: student.isHafiz, admissionDate: student.admissionDate,
    },
    stats: { avgMarks, outstandingFees: outstanding, libraryBooks: books.length, hifzProgressPercent: hifzPercent },
    todaySchedule: slots.map((s) => ({
      id: s.id, startTime: s.startTime, endTime: s.endTime, subject: s.subject,
      room: s.room, teacherName: (s.teacherId && teacherName.get(s.teacherId)) || "—",
      startMinutes: toMinutes(s.startTime), endMinutes: toMinutes(s.endTime),
    })),
    hifzProgress: {
      totalRecords: hifz.length, avgQuality, parasCovered: completedParas.size,
      recentRecords: hifz.slice(0, 5).map((r) => ({
        id: r.id, type: r.type, paraNumber: r.paraNumber,
        qualityRating: r.qualityRating, status: r.status, recordedAt: r.recordedAt,
      })),
    },
    examResults: exams.map((r) => ({
      id: r.id, subject: r.subject, marks: r.marks, total: r.total,
      grade: r.grade, remarks: r.remarks,
      percentage: r.total ? Math.round((r.marks / r.total) * 100) : 0,
    })),
    attendance: { last30d: { ...att, rate: attRate }, last7days },
    fees: {
      totalDue, totalPaid, outstanding, pendingCount,
      recentCollections: fees.slice(0, 3).map((f) => ({
        id: f.id, amount: f.amount, paidAmount: f.paidAmount, status: f.status,
        dueDate: f.dueDate, paidDate: f.paidDate, method: f.method,
      })),
    },
    libraryBooks: books.map((b) => ({
      id: b.id, title: b.book?.title ?? "—",
      dueDate: b.dueDate, borrowedAt: b.borrowedAt,
      overdue: new Date(b.dueDate) < now,
    })),
  });
}
