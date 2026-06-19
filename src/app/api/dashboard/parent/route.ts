// GET /api/dashboard/parent — role-specific dashboard data for parents
// Scoped by tenantId. Links the logged-in User's phone to Student.guardianPhone.
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { ok, unauthorized } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  const { tenantId, phone } = session;

  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

  // All children whose guardian phone matches the logged-in parent's phone.
  const students = await db.student.findMany({
    where: { tenantId, guardianPhone: phone },
    select: {
      id: true, name: true, nameArabic: true, rollNo: true, photoUrl: true, isHafiz: true,
      class: { select: { name: true } },
      hifzRecords: {
        orderBy: { recordedAt: "desc" },
        select: { paraNumber: true, qualityRating: true, recordedAt: true },
      },
      feeCollections: {
        select: { amount: true, paidAmount: true, status: true, dueDate: true },
      },
      examResults: {
        orderBy: { id: "desc" },
        take: 3,
        select: { subject: true, marks: true, total: true, grade: true },
      },
    },
  });

  // Attendance is polymorphic (personId + personType) — query separately.
  const studentIds = students.map((s) => s.id);
  const attendanceRecords = studentIds.length
    ? await db.attendance.findMany({
        where: { tenantId, personId: { in: studentIds }, personType: "student", date: { gte: d30 } },
        select: { personId: true, status: true },
      })
    : [];
  const attendanceByStudent = new Map<string, { total: number; present: number }>();
  for (const a of attendanceRecords) {
    const cur = attendanceByStudent.get(a.personId) ?? { total: 0, present: 0 };
    cur.total += 1;
    if (a.status === "present" || a.status === "late") cur.present += 1;
    attendanceByStudent.set(a.personId, cur);
  }

  let totalOutstanding = 0;
  let perfSum = 0;
  let perfCount = 0;

  const children = students.map((s) => {
    // Hifz progress
    const totalRecords = s.hifzRecords.length;
    const ratedRecords = s.hifzRecords.filter((r) => r.qualityRating != null);
    const avgQuality = ratedRecords.length
      ? Math.round((ratedRecords.reduce((sum, r) => sum + (r.qualityRating ?? 0), 0) / ratedRecords.length) * 10) / 10
      : 0;
    const parasCovered = new Set(s.hifzRecords.map((r) => r.paraNumber)).size;

    // Attendance rate over last 30 days (polymorphic lookup)
    const att = attendanceByStudent.get(s.id) ?? { total: 0, present: 0 };
    const attendanceRate = att.total ? Math.round((att.present / att.total) * 100) : 0;

    // Fee status
    const totalDue = s.feeCollections.reduce((sum, f) => sum + (f.amount || 0), 0);
    const totalPaid = s.feeCollections.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
    const outstanding = Math.max(0, totalDue - totalPaid);
    const pendingCount = s.feeCollections.filter((f) => f.status !== "paid").length;
    totalOutstanding += outstanding;

    // Recent results
    const recentResults = s.examResults.map((r) => ({
      subject: r.subject,
      marks: r.marks,
      total: r.total,
      grade: r.grade,
      percentage: r.total ? Math.round((r.marks / r.total) * 100) : 0,
    }));
    recentResults.forEach((r) => {
      perfSum += r.percentage;
      perfCount += 1;
    });

    return {
      id: s.id,
      name: s.name,
      nameArabic: s.nameArabic,
      rollNo: s.rollNo,
      photoUrl: s.photoUrl,
      isHafiz: s.isHafiz,
      className: s.class?.name ?? "—",
      hifzProgress: { totalRecords, avgQuality, parasCovered },
      attendanceRate,
      feeStatus: { totalDue, totalPaid, outstanding, pendingCount },
      recentResults,
    };
  });

  const avgPerformance = perfCount ? Math.round(perfSum / perfCount) : 0;

  return ok({
    children,
    stats: {
      totalChildren: children.length,
      avgPerformance,
      totalOutstandingFees: totalOutstanding,
    },
  });
}
