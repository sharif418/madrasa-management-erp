// GET /api/hifz/revision-today — HifzRecords due for revision today (or overdue)
// Returns items grouped by student with student name + record metadata.
import { db } from "@/lib/db";
import { ok, withSession } from "@/lib/api";

type DueItem = {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string | null;
  type: string;
  paraNumber: number;
  surahName: string | null;
  ayahFrom: number | null;
  ayahTo: number | null;
  nextRevisionDate: string | null;
  revisionCount: number;
  strengthScore: number;
  status: "overdue" | "due" | "upcoming";
};

export const GET = withSession(async ({ session }) => {
  const tenantId = session.tenantId;

  // Today's window — fetch all records with nextRevisionDate within the next 3 days (so we can show overdue/due/upcoming)
  const now = new Date();
  const startWindow = new Date(0); // include everything from the past (overdue)
  const endWindow = new Date(now);
  endWindow.setHours(23, 59, 59, 999);
  endWindow.setDate(endWindow.getDate() + 2); // today + next 2 days

  const rows = await db.hifzRecord.findMany({
    where: {
      tenantId,
      nextRevisionDate: { gte: startWindow, lte: endWindow },
    },
    orderBy: { nextRevisionDate: "asc" },
    take: 500,
    include: { student: { select: { id: true, name: true, rollNo: true } } },
  });

  const todayStr = now.toISOString().slice(0, 10);

  const items: DueItem[] = rows.map((r) => {
    const due = r.nextRevisionDate ? r.nextRevisionDate.toISOString().slice(0, 10) : null;
    let status: DueItem["status"] = "upcoming";
    if (due && due < todayStr) status = "overdue";
    else if (due && due === todayStr) status = "due";
    return {
      id: r.id,
      studentId: r.studentId,
      studentName: r.student?.name ?? "",
      rollNo: r.student?.rollNo ?? null,
      type: r.type,
      paraNumber: r.paraNumber,
      surahName: r.surahName,
      ayahFrom: r.ayahFrom,
      ayahTo: r.ayahTo,
      nextRevisionDate: r.nextRevisionDate ? r.nextRevisionDate.toISOString() : null,
      revisionCount: r.revisionCount,
      strengthScore: r.strengthScore,
      status,
    };
  });

  // Group by student
  const byStudent = new Map<string, { studentId: string; studentName: string; rollNo: string | null; items: DueItem[] }>();
  for (const it of items) {
    if (!byStudent.has(it.studentId)) {
      byStudent.set(it.studentId, {
        studentId: it.studentId,
        studentName: it.studentName,
        rollNo: it.rollNo,
        items: [],
      });
    }
    byStudent.get(it.studentId)!.items.push(it);
  }

  const groups = Array.from(byStudent.values()).sort(
    (a, b) =>
      a.items.filter((i) => i.status !== "upcoming").length <
      b.items.filter((i) => i.status !== "upcoming").length
        ? 1
        : -1
  );

  const counts = {
    overdue: items.filter((i) => i.status === "overdue").length,
    due: items.filter((i) => i.status === "due").length,
    upcoming: items.filter((i) => i.status === "upcoming").length,
    total: items.length,
  };

  return ok({ groups, counts });
});
