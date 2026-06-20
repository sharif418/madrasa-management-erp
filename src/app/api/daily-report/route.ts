// Daily Report / End-of-day Summary API
// GET /api/daily-report?date=YYYY-MM-DD  (default: today)
// Comprehensive one-day snapshot for admins: attendance, fees, admissions,
// hifz, notices, visitors, gate passes, finance, muhasaba, library.
// All scoped by tenantId + date. Cached 30s per (tenant, date).
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { unauthorized } from "@/lib/api";
import { getSession } from "@/lib/session";
import { cacheWrap } from "@/lib/cache";

export const dynamic = "force-dynamic";

function dayRange(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return {
    start: new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0),
    end: new Date(y, (m || 1) - 1, (d || 1) + 1, 0, 0, 0, 0),
  };
}
const round1 = (n: number) => Math.round(n * 10) / 10;
const countBy = <T, K extends string>(items: T[], key: (i: T) => K) => {
  const m = new Map<K, number>();
  for (const i of items) m.set(key(i), (m.get(key(i)) ?? 0) + 1);
  return Array.from(m.entries()).map(([k, count]) => ({ type: k, count }));
};

async function compute(tenantId: string, dateStr: string) {
  const { start, end } = dayRange(dateStr);

  const [
    attendance, fees, admissions, hifz, notices, visitors, gatePasses,
    transactions, muhasaba, lendings, students, classes, funds,
  ] = await Promise.all([
    db.attendance.findMany({ where: { tenantId, date: { gte: start, lt: end }, personType: "student" }, select: { personId: true, status: true } }),
    db.feeCollection.findMany({ where: { tenantId, paidDate: { gte: start, lt: end } }, select: { studentId: true, paidAmount: true, method: true } }),
    db.admissionApplication.findMany({ where: { tenantId, applicationDate: { gte: start, lt: end } }, select: { status: true } }),
    db.hifzRecord.findMany({ where: { tenantId, recordedAt: { gte: start, lt: end } }, select: { studentId: true, type: true, paraNumber: true, qualityRating: true } }),
    db.notice.findMany({ where: { tenantId, publishedAt: { gte: start, lt: end } }, select: { title: true, type: true, audience: true } }),
    db.visitor.findMany({ where: { tenantId, checkIn: { gte: start, lt: end } }, select: { name: true, purpose: true, checkIn: true, checkOut: true } }),
    db.gatePass.findMany({ where: { tenantId, createdAt: { gte: start, lt: end } }, select: { status: true } }),
    db.transaction.findMany({ where: { tenantId, date: { gte: start, lt: end } }, select: { fundId: true, amount: true, type: true, description: true } }),
    db.muhasabaRecord.findMany({ where: { tenantId, date: { gte: start, lt: end } }, select: { akhlaqRating: true } }),
    db.bookLending.findMany({ where: { tenantId, borrowedAt: { gte: start, lt: end } }, select: { returnedAt: true } }),
    db.student.findMany({ where: { tenantId }, select: { id: true, name: true, classId: true } }),
    db.class.findMany({ where: { tenantId }, select: { id: true, name: true } }),
    db.fund.findMany({ where: { tenantId }, select: { id: true, name: true } }),
  ]);

  const studById = new Map(students.map((s) => [s.id, s]));
  const classById = new Map(classes.map((c) => [c.id, c.name]));
  const fundById = new Map(funds.map((f) => [f.id, f.name]));

  // Attendance — counts + by-class breakdown
  const counts = { present: 0, absent: 0, late: 0, leave: 0 };
  const byClassMap = new Map<string, { present: number; absent: number; late: number; leave: number; total: number }>();
  for (const a of attendance) {
    const st = (a.status || "absent") as keyof typeof counts;
    if (st in counts) counts[st] += 1;
    const cid = studById.get(a.personId)?.classId ?? "unassigned";
    const cur = byClassMap.get(cid) ?? { present: 0, absent: 0, late: 0, leave: 0, total: 0 };
    if (st in cur) (cur as Record<string, number>)[st] += 1;
    cur.total += 1;
    byClassMap.set(cid, cur);
  }
  const total = attendance.length;
  const rate = total > 0 ? round1(((counts.present + counts.late) / total) * 100) : 0;
  const byClass = Array.from(byClassMap.entries())
    .map(([classId, c]) => ({
      classId, className: classById.get(classId) ?? "Unassigned",
      present: c.present, absent: c.absent, late: c.late, leave: c.leave, total: c.total,
      rate: c.total > 0 ? round1(((c.present + c.late) / c.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Fees — methods breakdown
  const methodsMap = new Map<string, { count: number; amount: number }>();
  for (const f of fees) {
    const m = f.method || "cash";
    const cur = methodsMap.get(m) ?? { count: 0, amount: 0 };
    cur.count += 1; cur.amount += f.paidAmount;
    methodsMap.set(m, cur);
  }

  // Hifz
  let qSum = 0, qCount = 0;
  const hifzItems = hifz.map((r) => {
    if (r.qualityRating != null) { qSum += r.qualityRating; qCount += 1; }
    return { student: studById.get(r.studentId)?.name ?? "—", type: r.type, para: r.paraNumber, quality: r.qualityRating };
  });

  // Finance — by fund
  let income = 0, expense = 0;
  const byFundMap = new Map<string, { fundName: string; income: number; expense: number }>();
  for (const tx of transactions) {
    if (tx.type === "income") income += tx.amount;
    else if (tx.type === "expense") expense += tx.amount;
    const fname = fundById.get(tx.fundId) ?? "—";
    const cur = byFundMap.get(tx.fundId) ?? { fundName: fname, income: 0, expense: 0 };
    if (tx.type === "income") cur.income += tx.amount;
    else if (tx.type === "expense") cur.expense += tx.amount;
    byFundMap.set(tx.fundId, cur);
  }

  return {
    date: dateStr,
    attendance: { ...counts, total, rate, byClass },
    fees: {
      collected: fees.reduce((s, f) => s + f.paidAmount, 0),
      count: fees.length,
      methods: Array.from(methodsMap.entries()).map(([method, v]) => ({ method, ...v })),
    },
    admissions: {
      newApplications: admissions.length,
      approved: admissions.filter((a) => a.status === "approved").length,
      enrolled: admissions.filter((a) => a.status === "enrolled").length,
    },
    hifz: {
      records: hifz.length,
      byType: countBy(hifz, (r) => r.type),
      avgQuality: qCount > 0 ? round1(qSum / qCount) : 0,
      items: hifzItems.slice(0, 50),
    },
    notices: {
      published: notices.length,
      byType: countBy(notices, (n) => n.type),
      items: notices.slice(0, 30).map((n) => ({ title: n.title, type: n.type, audience: n.audience })),
    },
    visitors: {
      checkedIn: visitors.length,
      checkedOut: visitors.filter((v) => v.checkOut != null).length,
      items: visitors.slice(0, 30).map((v) => ({
        name: v.name, purpose: v.purpose,
        checkIn: v.checkIn.toISOString(),
        checkOut: v.checkOut ? v.checkOut.toISOString() : null,
      })),
    },
    gatePasses: {
      issued: gatePasses.length,
      used: gatePasses.filter((g) => g.status === "used").length,
      pending: gatePasses.filter((g) => g.status === "pending").length,
    },
    finance: {
      income, expense, net: round1(income - expense),
      byFund: Array.from(byFundMap.values()),
      items: transactions.slice(0, 50).map((tx) => ({
        fund: fundById.get(tx.fundId) ?? "—",
        type: tx.type, amount: tx.amount, description: tx.description,
      })),
    },
    muhasaba: {
      records: muhasaba.length,
      avgAkhlaq: muhasaba.length > 0 ? round1(muhasaba.reduce((s, r) => s + r.akhlaqRating, 0) / muhasaba.length) : 0,
    },
    library: {
      booksLent: lendings.length,
      returned: lendings.filter((l) => l.returnedAt != null).length,
    },
  };
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { tenantId } = session;

  const url = new URL(req.url);
  const today = new Date();
  const dateStr = url.searchParams.get("date")
    || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const data = await cacheWrap(
    `dailyreport:${tenantId}:${dateStr}`,
    30 * 1000,
    () => compute(tenantId, dateStr)
  );

  return NextResponse.json(
    { ok: true, data },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
