// GET /api/export/hifz — export all hifz records for the current tenant as CSV.
// Optional query params: ?studentId=&type=&from=&to=
import { db } from "@/lib/db";
import { unauthorized } from "@/lib/api";
import { getSession } from "@/lib/session";
import { toCsv } from "@/lib/csv";

const VALID_TYPES = new Set(["sabak", "sabaq_para", "dhor"]);

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();

  const url = new URL(req.url);
  const studentId = url.searchParams.get("studentId") || "";
  const type = url.searchParams.get("type") || "";
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";

  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (studentId) where.studentId = studentId;
  if (type && VALID_TYPES.has(type)) where.type = type;
  const dateFilter: Record<string, Date> = {};
  if (from) {
    const d = new Date(from);
    if (!isNaN(d.getTime())) dateFilter.gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      dateFilter.lte = d;
    }
  }
  if (Object.keys(dateFilter).length) where.recordedAt = dateFilter;

  const records = await db.hifzRecord.findMany({
    where,
    include: {
      student: { select: { name: true, rollNo: true } },
      teacher: { select: { name: true } },
    },
    orderBy: { recordedAt: "desc" },
  });

  const headers = [
    "recordedAt", "studentName", "studentRoll", "type", "paraNumber",
    "surahName", "ayahFrom", "ayahTo", "qualityRating", "mistakesCount",
    "status", "teacherName", "notes",
  ];
  const rows = records.map((r) => [
    r.recordedAt ? r.recordedAt.toISOString() : "",
    r.student?.name ?? "",
    r.student?.rollNo ?? "",
    r.type,
    r.paraNumber,
    r.surahName ?? "",
    r.ayahFrom ?? "",
    r.ayahTo ?? "",
    r.qualityRating ?? "",
    r.mistakesCount,
    r.status,
    r.teacher?.name ?? "",
    r.notes ?? "",
  ]);

  const csv = toCsv([headers, ...rows]);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="hifz-records.csv"',
      "Cache-Control": "no-store",
    },
  });
}
