// POST /api/fees/late-fee — calculate late fees on overdue FeeCollections.
// Body: { classId?, month? }  — optional filters; otherwise all overdue collections.
// For each unpaid collection where dueDate < today:
//   - daysOverdue = today - dueDate
//   - lateFee     = daysOverdue × feeStructure.lateFeePerDay
//   - update lateFee + status="overdue" (if status was pending/partial)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, forbidden } from "@/lib/api";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";

const MS_PER_DAY = 86_400_000;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const allowed = await checkPermission(session, "finance", "update");
  if (!allowed) return forbidden("No permission to update fee collections");

  const body = await req.json().catch(() => ({}));
  const classId = body?.classId && body.classId !== "all" ? String(body.classId) : undefined;
  const now = new Date();

  // Build tenant-scoped where clause for overdue, unpaid collections
  const where: Record<string, unknown> = {
    tenantId: session.tenantId,
    status: { not: "paid" },
    dueDate: { lt: now },
    feeStructure: { lateFeePerDay: { gt: 0 } },
  };
  if (classId) where.student = { classId };

  const collections = await db.feeCollection.findMany({
    where,
    include: { feeStructure: { select: { lateFeePerDay: true, name: true } } },
    take: 2000,
  });

  let updatedCount = 0;
  let totalLateFee = 0;

  for (const c of collections) {
    if (!c.dueDate) continue;
    const daysOverdue = Math.max(
      0,
      Math.floor((now.getTime() - c.dueDate.getTime()) / MS_PER_DAY),
    );
    if (daysOverdue === 0) continue;
    const rate = c.feeStructure?.lateFeePerDay ?? 0;
    if (rate <= 0) continue;
    const lateFee = Number((daysOverdue * rate).toFixed(2));
    if (lateFee <= 0) continue;

    await db.feeCollection.update({
      where: { id: c.id },
      data: {
        lateFee,
        status: "overdue",
      },
    });
    updatedCount++;
    totalLateFee += lateFee;
  }

  await recordAudit({
    session,
    action: "update",
    module: "finance",
    entityName: "Late Fee Calculation",
    details: { updatedCount, totalLateFee, classId },
  });

  return ok({ updated: updatedCount, totalLateFee: Number(totalLateFee.toFixed(2)) });
}
