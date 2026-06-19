// Timetable collection API
// GET  /api/timetable            — list slots for current tenant (optional ?classId=)
// POST /api/timetable            — create slot (audit recorded)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized, auditAfter } from "@/lib/api";

const DAYS = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const url = req.nextUrl;
  const classId = url.searchParams.get("classId") || "";

  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (classId) where.classId = classId;

  const slots = await db.timetableSlot.findMany({
    where,
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
  });

  // Resolve class + teacher names in a single lookup each (avoid N+1)
  const classIds = [...new Set(slots.map((s) => s.classId).filter(Boolean))] as string[];
  const teacherIds = [...new Set(slots.map((s) => s.teacherId).filter(Boolean))] as string[];

  const [classes, teachers] = await Promise.all([
    classIds.length
      ? db.class.findMany({ where: { id: { in: classIds }, tenantId: session.tenantId }, select: { id: true, name: true } })
      : Promise.resolve([]),
    teacherIds.length
      ? db.teacher.findMany({ where: { id: { in: teacherIds }, tenantId: session.tenantId }, select: { id: true, name: true } })
      : Promise.resolve([]),
  ]);

  const classMap = new Map(classes.map((c) => [c.id, c.name]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t.name]));

  const items = slots.map((s) => ({
    id: s.id,
    classId: s.classId,
    className: s.classId ? classMap.get(s.classId) ?? null : null,
    day: s.day,
    startTime: s.startTime,
    endTime: s.endTime,
    subject: s.subject,
    teacherId: s.teacherId,
    teacherName: s.teacherId ? teacherMap.get(s.teacherId) ?? null : null,
    room: s.room,
    createdAt: s.createdAt.toISOString(),
  }));

  // Group by day for convenience
  const byDay: Record<string, typeof items> = {};
  for (const d of DAYS) byDay[d] = [];
  for (const it of items) {
    if (!byDay[it.day]) byDay[it.day] = [];
    byDay[it.day].push(it);
  }

  return ok({ items, byDay, total: items.length });
}

type CreateInput = {
  classId?: string | null;
  day?: string;
  startTime?: string;
  endTime?: string;
  subject?: string;
  teacherId?: string | null;
  room?: string | null;
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as CreateInput;
  const day = (body.day || "").trim().toLowerCase();
  const startTime = (body.startTime || "").trim();
  const endTime = (body.endTime || "").trim();
  const subject = (body.subject || "").trim();

  if (!DAYS.includes(day)) return fail("Invalid day");
  if (!startTime || !endTime) return fail("Start and end time are required");
  if (!subject) return fail("Subject is required");
  if (startTime >= endTime) return fail("End time must be after start time");

  let classId: string | null = null;
  if (body.classId) {
    const cls = await db.class.findFirst({
      where: { id: body.classId, tenantId: session.tenantId },
      select: { id: true },
    });
    if (!cls) return fail("Class not found", 404);
    classId = cls.id;
  }

  let teacherId: string | null = null;
  if (body.teacherId) {
    const tc = await db.teacher.findFirst({
      where: { id: body.teacherId, tenantId: session.tenantId },
      select: { id: true },
    });
    if (!tc) return fail("Teacher not found", 404);
    teacherId = tc.id;
  }

  const created = await db.timetableSlot.create({
    data: {
      tenantId: session.tenantId,
      classId,
      day,
      startTime,
      endTime,
      subject,
      teacherId,
      room: (body.room || "").trim() || null,
    },
  });

  await auditAfter(session, {
    action: "create",
    module: "timetable",
    entityId: created.id,
    entityName: subject,
    details: { day, startTime, endTime, classId, teacherId, room: created.room },
  });

  return ok({ ...created, createdAt: created.createdAt.toISOString() }, 201);
}
