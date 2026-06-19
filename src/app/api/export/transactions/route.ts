// GET /api/export/transactions — export all finance transactions for the current tenant as CSV.
// Optional query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD&type=income|expense|transfer
import { db } from "@/lib/db";
import { unauthorized, fail } from "@/lib/api";
import { getSession } from "@/lib/session";
import { toCsv } from "@/lib/csv";

const VALID_TYPES = new Set(["income", "expense", "transfer"]);

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();

  const url = new URL(req.url);
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";
  const type = url.searchParams.get("type") || "";

  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (type && VALID_TYPES.has(type)) where.type = type;
  const dateFilter: Record<string, Date> = {};
  if (from) {
    const d = new Date(from);
    if (!isNaN(d.getTime())) dateFilter.gte = d;
    else return fail("Invalid 'from' date");
  }
  if (to) {
    const d = new Date(to);
    if (!isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      dateFilter.lte = d;
    } else return fail("Invalid 'to' date");
  }
  if (Object.keys(dateFilter).length) where.date = dateFilter;

  const txns = await db.transaction.findMany({
    where,
    include: {
      fund: { select: { name: true, type: true } },
      student: { select: { name: true, rollNo: true } },
    },
    orderBy: { date: "desc" },
  });

  const headers = [
    "date", "type", "amount", "fund", "fundType", "category",
    "paymentMethod", "description", "studentName", "studentRoll",
  ];
  const rows = txns.map((t) => [
    t.date ? t.date.toISOString() : "",
    t.type,
    t.amount,
    t.fund?.name ?? "",
    t.fund?.type ?? "",
    t.category ?? "",
    t.paymentMethod ?? "",
    t.description ?? "",
    t.student?.name ?? "",
    t.student?.rollNo ?? "",
  ]);

  const csv = toCsv([headers, ...rows]);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="transactions.csv"',
      "Cache-Control": "no-store",
    },
  });
}
