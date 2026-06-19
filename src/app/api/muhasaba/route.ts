// Muhasaba (Tarbiyah) Tracker — collection API
// GET  /api/muhasaba?studentId=&from=&to=&page=1&limit=30
// POST /api/muhasaba       — create record
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized, auditAfter } from "@/lib/api";

const SALAH_STATUSES = ["jamaat", "alone", "qadha", "pending"] as const;
type SalahStatus = (typeof SALAH_STATUSES)[number];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const url = req.nextUrl;
  const studentId = url.searchParams.get("studentId") || "";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "30", 10) || 30));

  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (studentId) where.studentId = studentId;
  if (from || to) {
    const dateRange: Record<string, Date> = {};
    if (from) dateRange.gte = new Date(from);
    if (to) dateRange.lte = new Date(to);
    where.date = dateRange;
  }

  const [total, rows] = await Promise.all([
    db.muhasabaRecord.count({ where }),
    db.muhasabaRecord.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { student: { select: { id: true, name: true, rollNo: true } } },
    }),
  ]);

  return ok({
    items: rows,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}

type CreateInput = {
  studentId?: string;
  date?: string;
  fajr?: string;
  dhuhr?: string;
  asr?: string;
  maghrib?: string;
  isha?: string;
  tahajjud?: boolean;
  quranRecitation?: boolean;
  morningAdhkar?: boolean;
  eveningAdhkar?: boolean;
  sadaqah?: boolean;
  akhlaqRating?: number;
  teacherNote?: string;
};

const normSalah = (v?: string): SalahStatus =>
  (v && SALAH_STATUSES.includes(v as SalahStatus)) ? (v as SalahStatus) : "pending";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as CreateInput;
  const studentId = (body.studentId || "").trim();
  if (!studentId) return fail("Student ID required");
  if (!body.date) return fail("Date required");

  const student = await db.student.findFirst({
    where: { id: studentId, tenantId: session.tenantId },
    select: { id: true, name: true },
  });
  if (!student) return fail("Student not found", 404);

  const date = new Date(body.date);
  if (Number.isNaN(date.getTime())) return fail("Invalid date");

  const akhlaqRating = Math.max(1, Math.min(5, Math.trunc(Number(body.akhlaqRating) || 3)));

  const record = await db.muhasabaRecord.create({
    data: {
      tenantId: session.tenantId,
      studentId,
      date,
      fajr: normSalah(body.fajr),
      dhuhr: normSalah(body.dhuhr),
      asr: normSalah(body.asr),
      maghrib: normSalah(body.maghrib),
      isha: normSalah(body.isha),
      tahajjud: !!body.tahajjud,
      quranRecitation: !!body.quranRecitation,
      morningAdhkar: !!body.morningAdhkar,
      eveningAdhkar: !!body.eveningAdhkar,
      sadaqah: !!body.sadaqah,
      akhlaqRating,
      teacherNote: (body.teacherNote || "").trim() || null,
    },
  });

  await auditAfter(session, {
    action: "create", module: "muhasaba", entityId: record.id,
    entityName: `${student.name} — ${body.date}`,
    details: { studentId, date: body.date, akhlaqRating },
  });

  return ok(record, 201);
}
