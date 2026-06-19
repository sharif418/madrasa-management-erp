// Muhasaba — 14-day analytics summary for the tenant
// GET /api/muhasaba/stats
// Returns: avgSalahConsistency (0-1), adhkarRate (0-1), avgAkhlaq (1-5),
//          dailyStacked (14d of { date, jamaat, alone, qadha }),
//          akhlaqTrend (14d of { date, avg }),
//          topStudents (top 5 by jamaat+alone ratio)
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, unauthorized } from "@/lib/api";

const SALAH_FIELDS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
const ADHKAR_FIELDS = ["tahajjud", "quranRecitation", "morningAdhkar", "eveningAdhkar", "sadaqah"] as const;

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const records = await db.muhasabaRecord.findMany({
    where: { tenantId: session.tenantId, date: { gte: since } },
    include: { student: { select: { id: true, name: true, rollNo: true } } },
  });

  if (records.length === 0) {
    return ok({
      avgSalahConsistency: 0,
      adhkarRate: 0,
      avgAkhlaq: 0,
      dailyStacked: [],
      akhlaqTrend: [],
      topStudents: [],
    });
  }

  // Aggregate per-day stacked salah + akhlaq trend
  const dayMap = new Map<string, { jamaat: number; alone: number; qadha: number; akhlaqSum: number; akhlaqCount: number }>();
  for (const r of records) {
    const key = r.date.toISOString().slice(0, 10);
    if (!dayMap.has(key)) dayMap.set(key, { jamaat: 0, alone: 0, qadha: 0, akhlaqSum: 0, akhlaqCount: 0 });
    const bucket = dayMap.get(key)!;
    for (const f of SALAH_FIELDS) {
      const v = r[f];
      if (v === "jamaat") bucket.jamaat += 1;
      else if (v === "alone") bucket.alone += 1;
      else if (v === "qadha") bucket.qadha += 1;
    }
    bucket.akhlaqSum += r.akhlaqRating;
    bucket.akhlaqCount += 1;
  }

  const dailyStacked = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, b]) => ({ date, jamaat: b.jamaat, alone: b.alone, qadha: b.qadha }));

  const akhlaqTrend = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, b]) => ({ date, avg: +(b.akhlaqSum / b.akhlaqCount).toFixed(2) }));

  // Overall aggregates
  let salahTotal = 0, salahDone = 0, adhkarTotal = 0, adhkarDone = 0, akhlaqSum = 0;
  for (const r of records) {
    for (const f of SALAH_FIELDS) {
      salahTotal += 1;
      if (r[f] === "jamaat" || r[f] === "alone") salahDone += 1;
    }
    for (const f of ADHKAR_FIELDS) {
      adhkarTotal += 1;
      if (r[f]) adhkarDone += 1;
    }
    akhlaqSum += r.akhlaqRating;
  }

  // Top 5 students by (jamaat + alone) / total salah entries
  const studentMap = new Map<string, { name: string; rollNo: string | null; done: number; total: number; akhlaq: number }>();
  for (const r of records) {
    if (!studentMap.has(r.studentId)) {
      studentMap.set(r.studentId, { name: r.student.name, rollNo: r.student.rollNo, done: 0, total: 0, akhlaq: 0 });
    }
    const bucket = studentMap.get(r.studentId)!;
    for (const f of SALAH_FIELDS) {
      bucket.total += 1;
      if (r[f] === "jamaat" || r[f] === "alone") bucket.done += 1;
    }
    bucket.akhlaq += r.akhlaqRating;
  }
  const topStudents = Array.from(studentMap.entries())
    .map(([id, v]) => ({
      id,
      name: v.name,
      rollNo: v.rollNo,
      consistency: v.total > 0 ? +(v.done / v.total).toFixed(2) : 0,
      akhlaq: +(v.akhlaq / Math.max(1, v.total / SALAH_FIELDS.length)).toFixed(2),
    }))
    .sort((a, b) => b.consistency - a.consistency || b.akhlaq - a.akhlaq)
    .slice(0, 5);

  return ok({
    avgSalahConsistency: salahTotal > 0 ? +(salahDone / salahTotal).toFixed(2) : 0,
    adhkarRate: adhkarTotal > 0 ? +(adhkarDone / adhkarTotal).toFixed(2) : 0,
    avgAkhlaq: +(akhlaqSum / records.length).toFixed(2),
    dailyStacked,
    akhlaqTrend,
    topStudents,
  });
}
