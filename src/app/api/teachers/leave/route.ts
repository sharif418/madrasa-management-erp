// Staff Leave API — list + create leave requests.
// GET  /api/teachers/leave?status=&teacherId=
// POST /api/teachers/leave   { teacherId, type, startDate, endDate, reason }
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, forbidden } from "@/lib/api";
import { getSession } from "@/lib/session";
import { checkPermission } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";

const TYPES = ["sick", "casual", "annual", "maternity", "emergency"] as const;

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || undefined;
  const teacherId = url.searchParams.get("teacherId") || undefined;

  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (status && status !== "all") where.status = status;
  if (teacherId) where.teacherId = teacherId;

  const items = await db.staffLeave.findMany({
    where,
    include: { teacher: { select: { id: true, name: true, nameArabic: true, phone: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const data = items.map((l) => ({
    id: l.id,
    teacherId: l.teacherId,
    teacherName: l.teacher?.name ?? "—",
    teacherNameArabic: l.teacher?.nameArabic ?? null,
    teacherPhone: l.teacher?.phone ?? null,
    type: l.type,
    startDate: l.startDate,
    endDate: l.endDate,
    reason: l.reason,
    status: l.status,
    approvedBy: l.approvedBy,
    approvedAt: l.approvedAt,
    createdAt: l.createdAt,
  }));

  return ok({ items: data });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const allowed = await checkPermission(session, "teachers", "create");
  if (!allowed) return forbidden("No permission to apply for leave");

  const body = await req.json().catch(() => ({}));
  const { teacherId, type, startDate, endDate, reason } = body || {};

  if (!teacherId || typeof teacherId !== "string") return fail("Teacher is required");
  if (!TYPES.includes(type)) return fail("Invalid leave type");
  if (!startDate || !endDate) return fail("Start and end dates are required");
  if (!reason || typeof reason !== "string" || !reason.trim()) return fail("Reason is required");

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return fail("Invalid dates");
  if (end < start) return fail("End date must be on or after start date");

  // Verify teacher belongs to tenant
  const teacher = await db.teacher.findFirst({
    where: { id: teacherId, tenantId: session.tenantId },
    select: { id: true, name: true },
  });
  if (!teacher) return fail("Teacher not found", 404);

  const created = await db.staffLeave.create({
    data: {
      tenantId: session.tenantId,
      teacherId,
      type,
      startDate: start,
      endDate: end,
      reason: reason.trim(),
      status: "pending",
    },
  });

  await recordAudit({
    session,
    action: "create",
    module: "teachers",
    entityId: created.id,
    entityName: `Leave — ${teacher.name}`,
    details: { type, startDate: start, endDate: end, teacherId },
  });

  return ok(created, 201);
}
