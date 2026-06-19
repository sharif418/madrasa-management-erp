// Report Card API — GET /api/exams/[id]/report-card
// Returns exam info + per-student: name, roll, all subject marks, total marks,
// average (percentage), grade, GPA (5.0 scale), rank (by total marks, descending).
// Tenant-scoped via exam ownership check.
import { db } from "@/lib/db";
import { ok, fail, notFound, withSession } from "@/lib/api";

// Grade scale — same thresholds used by marks entry & student profile
export function gradeFor(pct: number): "A+" | "A" | "B" | "C" | "D" | "F" {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

const GPA_MAP: Record<string, number> = { "A+": 5, A: 4, B: 3, C: 2, D: 1, F: 0 };

export const GET = withSession(async ({ session, params }) => {
  const id = params?.id;
  if (!id) return fail("Missing exam id");

  const exam = await db.exam.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { class: { select: { id: true, name: true } } },
  });
  if (!exam) return notFound("Exam not found");

  // Pull all results + student name/roll in one query
  const results = await db.examResult.findMany({
    where: { examId: id },
    include: { student: { select: { id: true, name: true, rollNo: true } } },
  });

  // Group by student
  const byStudent = new Map<string, {
    studentId: string;
    studentName: string;
    rollNo: string | null;
    subjects: { subject: string; marks: number; total: number; pct: number; grade: string }[];
  }>();

  for (const r of results) {
    const key = r.studentId;
    if (!byStudent.has(key)) {
      byStudent.set(key, {
        studentId: r.studentId,
        studentName: r.student?.name ?? "Unknown",
        rollNo: r.student?.rollNo ?? null,
        subjects: [],
      });
    }
    const total = r.total || 100;
    const pct = total > 0 ? (r.marks / total) * 100 : 0;
    byStudent.get(key)!.subjects.push({
      subject: r.subject,
      marks: r.marks,
      total,
      pct: Math.round(pct * 10) / 10,
      grade: gradeFor(pct),
    });
  }

  // Compute per-student aggregates
  const ranked = Array.from(byStudent.values()).map((s) => {
    const totalMarks = s.subjects.reduce((a, b) => a + b.marks, 0);
    const maxMarks = s.subjects.reduce((a, b) => a + b.total, 0);
    const avgPct = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
    const grade = gradeFor(avgPct);
    const gpaSum = s.subjects.reduce((a, b) => a + (GPA_MAP[b.grade] ?? 0), 0);
    const gpa = s.subjects.length > 0 ? Math.round((gpaSum / s.subjects.length) * 100) / 100 : 0;
    return {
      studentId: s.studentId,
      studentName: s.studentName,
      rollNo: s.rollNo,
      subjects: s.subjects,
      totalMarks: Math.round(totalMarks * 100) / 100,
      maxMarks,
      average: Math.round(avgPct * 10) / 10,
      grade,
      gpa,
    };
  });

  // Rank by totalMarks descending (1-indexed). Ties share rank.
  ranked.sort((a, b) => b.totalMarks - a.totalMarks);
  let lastMarks: number | null = null;
  let lastRank = 0;
  ranked.forEach((r, i) => {
    if (lastMarks !== null && r.totalMarks === lastMarks) {
      r.rank = lastRank;
    } else {
      r.rank = i + 1;
      lastRank = i + 1;
      lastMarks = r.totalMarks;
    }
  });

  return ok({
    exam: {
      id: exam.id,
      name: exam.name,
      term: exam.term,
      className: exam.class?.name ?? null,
      startDate: exam.startDate ? exam.startDate.toISOString() : null,
      endDate: exam.endDate ? exam.endDate.toISOString() : null,
    },
    students: ranked,
    totalStudents: ranked.length,
    subjects: Array.from(new Set(results.map((r) => r.subject))),
  });
});
