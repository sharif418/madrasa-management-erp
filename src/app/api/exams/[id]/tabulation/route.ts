// Tabulation sheet — class-wide results matrix for an exam.
// GET /api/exams/[id]/tabulation → { exam, subjects, students, subjectStats }
// Each student has: name, rollNo, marksBySubject, total, average, grade, rank.
// Subject stats: highest, lowest, average, passRate per subject.
import { db } from "@/lib/db";
import { ok, fail, notFound, withSession } from "@/lib/api";

// Simple grade boundaries (out of 100). Total marks are scaled to 100 per subject.
function gradeFor(pct: number): string {
  if (pct >= 80) return "A+";
  if (pct >= 70) return "A";
  if (pct >= 60) return "A-";
  if (pct >= 50) return "B";
  if (pct >= 40) return "C";
  if (pct >= 33) return "D";
  return "F";
}

export const GET = withSession(async ({ session, params }) => {
  const id = params?.id;
  if (!id) return fail("Missing exam id");

  const exam = await db.exam.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { class: { select: { id: true, name: true } } },
  });
  if (!exam) return notFound("Exam not found");

  // Fetch all results for this exam (tenant-scoped via exam ownership)
  const results = await db.examResult.findMany({
    where: { examId: id },
    include: {
      student: { select: { id: true, name: true, rollNo: true } },
    },
  });

  // If exam has a class, also fetch all enrolled students so absentees show up
  let classStudents: { id: string; name: string; rollNo: string | null }[] = [];
  if (exam.classId) {
    classStudents = await db.student.findMany({
      where: { classId: exam.classId, tenantId: session.tenantId, isActive: true },
      select: { id: true, name: true, rollNo: true },
      orderBy: [{ rollNo: "asc" }, { name: "asc" }],
    });
  }

  // Build a unique subjects list (sorted, deduped, case-insensitive)
  const subjectsSet = new Set<string>();
  for (const r of results) subjectsSet.add(r.subject);
  const subjects = [...subjectsSet].sort((a, b) => a.localeCompare(b));

  // Group results by studentId
  const byStudent = new Map<string, Map<string, { marks: number; total: number }>>();
  const studentMeta = new Map<string, { id: string; name: string; rollNo: string | null }>();
  for (const r of results) {
    if (!byStudent.has(r.studentId)) byStudent.set(r.studentId, new Map());
    byStudent.get(r.studentId)!.set(r.subject, { marks: r.marks, total: r.total || 100 });
    studentMeta.set(r.studentId, {
      id: r.student.id, name: r.student.name, rollNo: r.student.rollNo,
    });
  }
  // Include enrolled class students even if they have no marks yet
  for (const s of classStudents) {
    if (!studentMeta.has(s.id)) {
      studentMeta.set(s.id, { id: s.id, name: s.name, rollNo: s.rollNo });
      byStudent.set(s.id, new Map());
    }
  }

  // Per-subject stats collection
  const perSubjectMarks: Record<string, number[]> = {};
  for (const s of subjects) perSubjectMarks[s] = [];

  // Build student rows with total + average + grade
  const rows = [...studentMeta.values()].map((meta) => {
    const subjMap = byStudent.get(meta.id) ?? new Map();
    let total = 0;
    let maxPossible = 0;
    const marksBySubject: Record<string, { marks: number; total: number; pct: number } | null> = {};
    for (const s of subjects) {
      const cell = subjMap.get(s);
      if (cell) {
        const pct = cell.total > 0 ? (cell.marks / cell.total) * 100 : 0;
        marksBySubject[s] = { marks: cell.marks, total: cell.total, pct };
        total += cell.marks;
        maxPossible += cell.total || 100;
        perSubjectMarks[s].push(cell.marks);
      } else {
        marksBySubject[s] = null;
      }
    }
    const avg = subjects.length > 0 ? total / subjects.length : 0;
    const overallPct = maxPossible > 0 ? (total / maxPossible) * 100 : 0;
    return {
      studentId: meta.id, name: meta.name, rollNo: meta.rollNo,
      marksBySubject, total, average: Math.round(avg * 100) / 100,
      grade: subjects.length > 0 ? gradeFor(overallPct) : "—",
    };
  });

  // Rank by total (desc) — students with no marks share last "—"
  const sortedForRank = [...rows].filter((r) => subjects.length > 0 && r.marksBySubject[subjects[0]] !== null);
  sortedForRank.sort((a, b) => b.total - a.total);
  const rankMap = new Map<string, number>();
  let currentRank = 0;
  let lastTotal = -Infinity;
  for (let i = 0; i < sortedForRank.length; i++) {
    const r = sortedForRank[i];
    if (r.total !== lastTotal) {
      currentRank = i + 1;
      lastTotal = r.total;
    }
    rankMap.set(r.studentId, currentRank);
  }
  const ranked = rows.map((r) => ({
    ...r,
    rank: rankMap.get(r.studentId) ?? null,
  }));
  // Sort output by rank (nulls last) then by name
  ranked.sort((a, b) => {
    if (a.rank == null && b.rank == null) return a.name.localeCompare(b.name);
    if (a.rank == null) return 1;
    if (b.rank == null) return -1;
    return a.rank - b.rank;
  });

  // Per-subject statistics
  const subjectStats = subjects.map((s) => {
    const arr = perSubjectMarks[s];
    if (arr.length === 0) return { subject: s, highest: 0, lowest: 0, average: 0, passRate: 0, count: 0 };
    const sum = arr.reduce((a, b) => a + b, 0);
    const passed = arr.filter((m) => m >= 33).length;
    return {
      subject: s,
      highest: Math.max(...arr),
      lowest: Math.min(...arr),
      average: Math.round((sum / arr.length) * 100) / 100,
      passRate: Math.round((passed / arr.length) * 100),
      count: arr.length,
    };
  });

  return ok({
    exam: {
      id: exam.id, name: exam.name, className: exam.class?.name ?? null,
      term: exam.term,
      startDate: exam.startDate ? exam.startDate.toISOString() : null,
      endDate: exam.endDate ? exam.endDate.toISOString() : null,
    },
    subjects,
    students: ranked,
    subjectStats,
    totals: {
      studentCount: ranked.length,
      subjectCount: subjects.length,
      classAverage: ranked.length > 0
        ? Math.round((ranked.reduce((a, b) => a + b.average, 0) / ranked.length) * 100) / 100
        : 0,
      overallPassRate: (() => {
        if (ranked.length === 0) return 0;
        const passed = ranked.filter((r) => r.grade && r.grade !== "F" && r.grade !== "—").length;
        return Math.round((passed / ranked.length) * 100);
      })(),
    },
  });
});
