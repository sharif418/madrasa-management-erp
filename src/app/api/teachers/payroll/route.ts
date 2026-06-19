// Teachers Payroll (HR) — collection API
// GET  /api/teachers/payroll?teacherId=&month=YYYY-MM
// POST /api/teachers/payroll        — create/update payroll record
//       { action: "process" }        — bulk-create payroll for all active teachers for a given month
//       { teacherId, month, baseSalary, deduction, bonus, netPay, status, paidAt, action: "save"|"pay" }
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized, auditAfter } from "@/lib/api";

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const url = req.nextUrl;
  const teacherId = url.searchParams.get("teacherId") || "";
  const month = url.searchParams.get("month") || "";

  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (teacherId) where.teacherId = teacherId;
  if (month && MONTH_RE.test(month)) where.month = month;

  const records = await db.payroll.findMany({
    where,
    orderBy: [{ month: "desc" }, { createdAt: "desc" }],
    take: 200,
    include: { teacher: { select: { id: true, name: true, nameArabic: true, phone: true, salary: true, isActive: true } } },
  });

  return ok({ items: records });
}

type Input = {
  action?: "save" | "pay" | "process";
  teacherId?: string;
  month?: string;
  baseSalary?: number;
  deduction?: number;
  bonus?: number;
  netPay?: number;
  status?: string;
  paidAt?: string;
};

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0);

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as Input;
  const action = body.action || "save";

  // Bulk process: create payroll for all active teachers (skip existing)
  if (action === "process") {
    const month = (body.month || "").trim();
    if (!MONTH_RE.test(month)) return fail("Invalid month (use YYYY-MM)");

    const teachers = await db.teacher.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      select: { id: true, name: true, salary: true },
    });
    if (teachers.length === 0) return fail("No active teachers");

    const existing = await db.payroll.findMany({
      where: { tenantId: session.tenantId, month },
      select: { teacherId: true },
    });
    const have = new Set(existing.map((e) => e.teacherId));

    const toCreate = teachers.filter((t) => !have.has(t.id));
    const created = await db.$transaction(
      toCreate.map((t) =>
        db.payroll.create({
          data: {
            tenantId: session.tenantId,
            teacherId: t.id,
            month,
            baseSalary: t.salary,
            deduction: 0,
            bonus: 0,
            netPay: t.salary,
            status: "pending",
          },
        })
      )
    );

    await auditAfter(session, {
      action: "create", module: "payroll",
      entityName: `Payroll ${month}`,
      details: { type: "process", month, count: created.length },
    });

    return ok({ processed: created.length, month }, 201);
  }

  // Single record: save (upsert) or pay (mark paid)
  const teacherId = (body.teacherId || "").trim();
  const month = (body.month || "").trim();
  if (!teacherId) return fail("Teacher ID required");
  if (!MONTH_RE.test(month)) return fail("Invalid month (use YYYY-MM)");

  const teacher = await db.teacher.findFirst({
    where: { id: teacherId, tenantId: session.tenantId },
    select: { id: true, name: true, salary: true },
  });
  if (!teacher) return fail("Teacher not found", 404);

  const baseSalary = num(body.baseSalary);
  const deduction = Math.max(0, num(body.deduction));
  const bonus = Math.max(0, num(body.bonus));
  const netPay = body.netPay !== undefined ? num(body.netPay) : baseSalary - deduction + bonus;

  const existing = await db.payroll.findFirst({
    where: { tenantId: session.tenantId, teacherId, month },
  });

  if (action === "pay") {
    if (!existing) return fail("Payroll record not found — save it first", 404);
    const updated = await db.payroll.update({
      where: { id: existing.id },
      data: { status: "paid", paidAt: body.paidAt ? new Date(body.paidAt) : new Date() },
    });
    await auditAfter(session, {
      action: "update", module: "payroll", entityId: updated.id,
      entityName: `${teacher.name} — ${month}`,
      details: { type: "pay", month, netPay: existing.netPay },
    });
    return ok(updated);
  }

  // save / upsert
  let record;
  if (existing) {
    record = await db.payroll.update({
      where: { id: existing.id },
      data: { baseSalary, deduction, bonus, netPay },
    });
  } else {
    record = await db.payroll.create({
      data: {
        tenantId: session.tenantId,
        teacherId,
        month,
        baseSalary,
        deduction,
        bonus,
        netPay,
        status: "pending",
      },
    });
  }

  await auditAfter(session, {
    action: existing ? "update" : "create",
    module: "payroll",
    entityId: record.id,
    entityName: `${teacher.name} — ${month}`,
    details: { type: "save", month, baseSalary, deduction, bonus, netPay },
  });

  return ok(record, 201);
}
