// GET/POST /api/zakat — Zakat distribution management
import { withSession, fail } from "@/lib/api";
import { db } from "@/lib/db";
import { createHmac } from "crypto";

function generateAuditHash(data: Record<string, unknown>): string {
  const secret = process.env.MM_SECRET || "default";
  return createHmac("sha256", secret).update(JSON.stringify(data)).digest("hex").slice(0, 16);
}

export const GET = withSession(async ({ session, req }) => {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);

  const [items, total, stats] = await Promise.all([
    db.zakatDistribution.findMany({
      where: { tenantId: session.tenantId },
      include: { student: { select: { id: true, name: true, rollNo: true, class: { select: { name: true } } } } },
      orderBy: { distributedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.zakatDistribution.count({ where: { tenantId: session.tenantId } }),
    db.zakatDistribution.aggregate({
      where: { tenantId: session.tenantId },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  return { items, total, page, limit, stats: { totalAmount: stats._sum.amount || 0, totalDistributions: stats._count._all } };
});

export const POST = withSession(async ({ session, req }) => {
  const body = await req.json();
  const { studentId, amount, purpose, tamlikStatus } = body;
  if (!studentId || !amount || !purpose) return fail("studentId, amount, purpose required");

  const auditHash = generateAuditHash({ studentId, amount, purpose, date: new Date().toISOString(), by: session.userId });

  const item = await db.zakatDistribution.create({
    data: {
      tenantId: session.tenantId,
      studentId, amount: parseFloat(amount), purpose,
      tamlikStatus: tamlikStatus || "completed",
      approvedBy: session.userId,
      auditHash,
    },
    include: { student: { select: { id: true, name: true, rollNo: true } } },
  });
  return item;
});
