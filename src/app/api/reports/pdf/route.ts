// POST /api/reports/pdf — generates a real downloadable PDF for the requested report type.
// Body: { reportType }. Returns binary PDF (Content-Type: application/pdf, attachment).
// All DB queries filter by session.tenantId for multi-tenant isolation.
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { unauthorized, fail } from "@/lib/api";
import { createPdfDoc, addSection, addTable, addKpiRow, addParagraph, finalizePdf, type PdfCtx } from "@/lib/pdf";

const REPORT_TYPES = ["student-directory", "fee-ledger", "hifz-progress", "finance-summary", "attendance-summary"] as const;
type ReportType = (typeof REPORT_TYPES)[number];
const cur = (n: number) => `BDT ${new Intl.NumberFormat("en-US").format(Math.round(n || 0))}`;
const num = (n: number) => new Intl.NumberFormat("en-US").format(n || 0);
const TITLES: Record<ReportType, string> = {
  "student-directory": "Student Directory", "fee-ledger": "Fee Ledger",
  "hifz-progress": "Hifz Progress Report", "finance-summary": "Finance Summary",
  "attendance-summary": "Attendance Summary (7d)",
};
const cnt = <T,>(arr: T[], pred: (x: T) => boolean) => arr.filter(pred).length;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { tenantId } = session;
  let body: { reportType?: string };
  try { body = await req.json(); } catch { body = {}; }
  const reportType = body.reportType as ReportType;
  if (!REPORT_TYPES.includes(reportType))
    return fail(`Invalid reportType. Expected one of: ${REPORT_TYPES.join(", ")}`, 400);
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { name: true } });
  let ctx: PdfCtx;
  try { ctx = await createPdfDoc(TITLES[reportType], tenant?.name || "Madrasa"); }
  catch (e) {
    console.error("[reports/pdf] createPdfDoc failed:", e);
    return fail("Failed to initialize PDF document", 500);
  }
  try {
    const builders: Record<ReportType, (c: PdfCtx, t: string) => Promise<void>> = {
      "student-directory": buildStudentDirectory, "fee-ledger": buildFeeLedger,
      "hifz-progress": buildHifzProgress, "finance-summary": buildFinanceSummary,
      "attendance-summary": buildAttendanceSummary,
    };
    await builders[reportType](ctx, tenantId);
    const bytes = await finalizePdf(ctx);
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${reportType}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[reports/pdf] build failed:", e);
    return fail(e instanceof Error ? e.message : "PDF generation failed", 500);
  }
}

function sectionTable(ctx: PdfCtx, title: string, headers: string[], rows: string[][], widths: number[], emptyMsg: string) {
  ctx.y = addSection(ctx, title);
  ctx.y = addTable(ctx, headers, rows.length ? rows : [headers.map(() => "—").fill(emptyMsg, 0, 1)], widths);
}

async function buildStudentDirectory(ctx: PdfCtx, tenantId: string) {
  const students = await db.student.findMany({
    where: { tenantId },
    select: {
      rollNo: true, name: true, gender: true, isActive: true,
      guardianName: true, guardianPhone: true, class: { select: { name: true } },
    },
    orderBy: [{ class: { name: "asc" } }, { rollNo: "asc" }],
  });
  ctx.y = addKpiRow(ctx, [
    { label: "TOTAL STUDENTS", value: num(students.length) },
    { label: "ACTIVE", value: num(cnt(students, (s) => s.isActive)) },
    { label: "MALE", value: num(cnt(students, (s) => s.gender === "male")) },
    { label: "FEMALE", value: num(cnt(students, (s) => s.gender === "female")) },
  ]);
  const rows = students.map((s) => [s.rollNo || "—", s.name, s.class?.name || "—", s.guardianName || "—", s.guardianPhone || "—", s.isActive ? "Active" : "Inactive"]);
  sectionTable(ctx, "Student List", ["Roll", "Name", "Class", "Guardian", "Phone", "Status"], rows, [45, 140, 100, 120, 90, 50], "No students found");
}

async function buildFeeLedger(ctx: PdfCtx, tenantId: string) {
  const fees = await db.feeCollection.findMany({
    where: { tenantId },
    select: {
      amount: true, paidAmount: true, status: true, method: true,
      paidDate: true, createdAt: true,
      student: { select: { name: true } },
      feeStructure: { select: { name: true } },
    },
    orderBy: { paidDate: "desc" }, take: 200,
  });
  const collected = fees.reduce((s, f) => s + (f.paidAmount || 0), 0);
  const due = fees.reduce((s, f) => s + Math.max(0, (f.amount || 0) - (f.paidAmount || 0)), 0);
  ctx.y = addKpiRow(ctx, [
    { label: "RECORDS", value: num(fees.length) },
    { label: "COLLECTED", value: cur(collected) },
    { label: "OUTSTANDING", value: cur(due) },
    { label: "PAID FULL", value: num(cnt(fees, (f) => f.status === "paid")) },
  ]);
  const rows = fees.map((f) => [
    new Date(f.paidDate || f.createdAt).toLocaleDateString("en-GB"),
    f.student?.name || "—", f.feeStructure?.name || "—",
    cur(f.amount), cur(f.paidAmount),
    (f.status || "—").toUpperCase(), (f.method || "—").toUpperCase(),
  ]);
  sectionTable(ctx, "Recent Fee Collections (max 200)", ["Date", "Student", "Fee Type", "Amount", "Paid", "Status", "Method"], rows, [60, 110, 100, 70, 70, 55, 60], "No fee records found");
}

async function buildHifzProgress(ctx: PdfCtx, tenantId: string) {
  const d30 = new Date(Date.now() - 30 * 86400_000);
  const records = await db.hifzRecord.findMany({
    where: { tenantId, recordedAt: { gte: d30 } },
    select: { type: true, paraNumber: true, qualityRating: true, studentId: true, student: { select: { name: true, rollNo: true } } },
  });
  const byStudent = new Map<string, { name: string; roll: string; count: number; paras: Set<number>; qSum: number; qN: number }>();
  for (const r of records) {
    if (!byStudent.has(r.studentId)) byStudent.set(r.studentId, {
      name: r.student?.name || "—", roll: r.student?.rollNo || "—",
      count: 0, paras: new Set(), qSum: 0, qN: 0,
    });
    const e = byStudent.get(r.studentId)!;
    e.count += 1; e.paras.add(r.paraNumber);
    if (r.qualityRating) { e.qSum += r.qualityRating; e.qN += 1; }
  }
  const rated = records.filter((r) => r.qualityRating);
  const avgQ = rated.length ? rated.reduce((s, r) => s + (r.qualityRating || 0), 0) / rated.length : 0;
  const topStreak = Math.max(0, ...[...byStudent.values()].map((e) => e.count));
  ctx.y = addKpiRow(ctx, [
    { label: "RECORDS (30d)", value: num(records.length) },
    { label: "STUDENTS", value: num(byStudent.size) },
    { label: "AVG QUALITY", value: avgQ.toFixed(1) + " / 5" },
    { label: "TOP STREAK", value: num(topStreak) },
  ]);
  const rows = [...byStudent.values()].sort((a, b) => b.count - a.count).slice(0, 100)
    .map((e) => [e.roll, e.name, num(e.count), num(e.paras.size), e.qN ? (e.qSum / e.qN).toFixed(1) : "—"]);
  sectionTable(ctx, "Per-Student Hifz Activity (30 days)", ["Roll", "Student", "Records", "Paras", "Avg Quality"], rows, [60, 180, 80, 80, 110], "No hifz records in last 30 days");
}

async function buildFinanceSummary(ctx: PdfCtx, tenantId: string) {
  const d30 = new Date(Date.now() - 30 * 86400_000);
  const [funds, txns] = await Promise.all([
    db.fund.findMany({ where: { tenantId }, select: { name: true, type: true, balance: true } }),
    db.transaction.findMany({ where: { tenantId, date: { gte: d30 } }, select: { type: true, amount: true, category: true } }),
  ]);
  const income = txns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalBalance = funds.reduce((s, f) => s + f.balance, 0);
  ctx.y = addKpiRow(ctx, [
    { label: "TOTAL BALANCE", value: cur(totalBalance) },
    { label: "INCOME (30d)", value: cur(income) },
    { label: "EXPENSE (30d)", value: cur(expense) },
    { label: "NET (30d)", value: cur(income - expense) },
  ]);
  sectionTable(ctx, "Fund Balances", ["Fund", "Type", "Balance"], funds.map((f) => [f.name, f.type, cur(f.balance)]), [220, 110, 130], "No funds found");
  const catAgg: Record<string, number> = {};
  for (const t of txns) if (t.type === "expense") catAgg[t.category || "uncategorized"] = (catAgg[t.category || "uncategorized"] || 0) + t.amount;
  const topCats = Object.entries(catAgg).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([c, a]) => [c, cur(a)]);
  sectionTable(ctx, "Top Expense Categories (30d)", ["Category", "Amount"], topCats, [320, 140], "No expenses recorded");
}

async function buildAttendanceSummary(ctx: PdfCtx, tenantId: string) {
  const d7Start = new Date(Date.now() - 6 * 86400_000);
  d7Start.setHours(0, 0, 0, 0);
  const [attendance, students, classes] = await Promise.all([
    db.attendance.findMany({ where: { tenantId, date: { gte: d7Start } }, select: { status: true, personId: true, personType: true } }),
    db.student.findMany({ where: { tenantId }, select: { id: true, classId: true } }),
    db.class.findMany({ where: { tenantId }, select: { id: true, name: true } }),
  ]);
  const present = cnt(attendance, (a) => a.status === "present");
  const absent = cnt(attendance, (a) => a.status === "absent");
  const late = cnt(attendance, (a) => a.status === "late");
  const leave = cnt(attendance, (a) => a.status === "leave");
  const rate = attendance.length ? Math.round(((present + late) / attendance.length) * 100) : 0;
  ctx.y = addKpiRow(ctx, [
    { label: "ATTENDANCE RATE", value: rate + "%" },
    { label: "PRESENT", value: num(present) },
    { label: "ABSENT", value: num(absent) },
    { label: "LATE", value: num(late) },
  ]);
  const className = new Map(classes.map((c) => [c.id, c.name]));
  const studentClass = new Map(students.map((s) => [s.id, s.classId]));
  const byClass = new Map<string, { name: string; present: number; total: number }>();
  for (const a of attendance) {
    if (a.personType !== "student") continue;
    const cid = studentClass.get(a.personId);
    if (!cid) continue;
    if (!byClass.has(cid)) byClass.set(cid, { name: className.get(cid) || "—", present: 0, total: 0 });
    const e = byClass.get(cid)!;
    e.total += 1;
    if (a.status === "present" || a.status === "late") e.present += 1;
  }
  const rows = [...byClass.values()]
    .map((e) => ({ name: e.name, rate: e.total ? Math.round((e.present / e.total) * 100) : 0, present: e.present, total: e.total }))
    .sort((a, b) => b.rate - a.rate)
    .map((e) => [e.name, num(e.present), num(e.total), e.rate + "%"]);
  sectionTable(ctx, "Attendance by Class (7 days)", ["Class", "Present", "Total", "Rate"], rows, [200, 90, 90, 90], "No attendance records found");
  ctx.y = addParagraph(ctx, `Leave entries (last 7 days): ${num(leave)}.`);
}
