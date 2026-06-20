// Fee Collections list API — recent collections for the tenant.
// GET /api/fee-structures/collections?status=&classId=&type=&limit=100
import { db } from "@/lib/db";
import { ok, withSession } from "@/lib/api";

export const GET = withSession(async ({ session, req }) => {
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || undefined;
  const classId = url.searchParams.get("classId") || undefined;
  const type = url.searchParams.get("type") || undefined;
  const limit = Math.min(Number(url.searchParams.get("limit") || "200"), 500);

  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (status && status !== "all") where.status = status;

  // type filter requires joining via feeStructure
  if (type && type !== "all") {
    where.feeStructure = { type };
  }
  // classId filter requires joining via student
  if (classId && classId !== "all") {
    where.student = { classId };
  }

  const items = await db.feeCollection.findMany({
    where,
    include: {
      student: { select: { id: true, name: true, classId: true, class: { select: { name: true } } } },
      feeStructure: { select: { id: true, name: true, type: true, frequency: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const data = items.map((c) => ({
    id: c.id,
    studentId: c.studentId,
    studentName: c.student?.name ?? "—",
    className: c.student?.class?.name ?? null,
    feeStructureId: c.feeStructureId,
    feeName: c.feeStructure?.name ?? null,
    feeType: c.feeStructure?.type ?? null,
    amount: c.amount,
    paidAmount: c.paidAmount,
    lateFee: c.lateFee,
    dueDate: c.dueDate,
    paidDate: c.paidDate,
    status: c.status,
    method: c.method,
    notes: c.notes,
    createdAt: c.createdAt,
  }));

  // Summary aggregates (include lateFee in outstanding)
  const totalCollected = items.reduce((s, c) => s + (c.paidAmount || 0), 0);
  const totalOutstanding = items.reduce(
    (s, c) => s + Math.max(0, (c.amount || 0) + (c.lateFee || 0) - (c.paidAmount || 0)),
    0
  );
  const totalAmount = items.reduce((s, c) => s + (c.amount || 0) + (c.lateFee || 0), 0);
  const collectionRate = totalAmount > 0 ? Math.round((totalCollected / totalAmount) * 100) : 0;

  return ok({
    items: data,
    summary: { totalCollected, totalOutstanding, collectionRate, count: items.length },
  });
});
