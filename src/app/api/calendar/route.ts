// Calendar / Events API — list (with Hijri conversion) + create (audit recorded).
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized, auditAfter } from "@/lib/api";

const TYPES = ["exam", "holiday", "islamic", "meeting", "admission", "result", "event"];
const AUDIENCES = ["all", "staff", "parents", "students"];

// Convert a Date to a Hijri (Islamic) string using the host Intl calendar.
function toHijri(d: Date, locale = "en"): string {
  try {
    return new Intl.DateTimeFormat(`${locale}-u-ca-islamic`, {
      day: "numeric", month: "long", year: "numeric",
    }).format(d);
  } catch {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(d);
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const url = req.nextUrl;
  const type = url.searchParams.get("type") || "";
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";
  const lang = (url.searchParams.get("lang") || "en").slice(0, 2);

  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (type && TYPES.includes(type)) where.type = type;

  const dateFilter: Record<string, Date> = {};
  if (from) { const d = new Date(from); if (!isNaN(d.getTime())) dateFilter.gte = d; }
  if (to) {
    const d = new Date(to);
    if (!isNaN(d.getTime())) { d.setHours(23, 59, 59, 999); dateFilter.lte = d; }
  }
  if (Object.keys(dateFilter).length) where.startDate = dateFilter;

  const events = await db.calendarEvent.findMany({
    where,
    orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  // Decorate each event with a hijri date string for the requested locale
  const decorated = events.map((e) => ({
    ...e,
    hijriDate: toHijri(new Date(e.startDate), lang),
    hijriEnd: e.endDate ? toHijri(new Date(e.endDate), lang) : null,
  }));

  // Upcoming = next 30 days, startDate >= today
  const now = new Date();
  const in30 = new Date(); in30.setDate(now.getDate() + 30);
  const upcoming = decorated.filter((e) => {
    const s = new Date(e.startDate);
    return s >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) && s <= in30;
  });

  return ok({
    items: decorated,
    upcoming,
    todayHijri: toHijri(now, lang),
    todayGreg: now.toISOString(),
  });
}

type CreateInput = {
  title?: string;
  titleArabic?: string;
  description?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  isAllDay?: boolean;
  location?: string;
  audience?: string;
  isHighlighted?: boolean;
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as CreateInput;
  const title = (body.title || "").trim();
  if (!title) return fail("Title is required");
  if (!body.startDate) return fail("Start date is required");
  const start = new Date(body.startDate);
  if (isNaN(start.getTime())) return fail("Invalid start date");

  const end = body.endDate ? new Date(body.endDate) : null;
  if (end && isNaN(end.getTime())) return fail("Invalid end date");
  const type = TYPES.includes(body.type || "") ? body.type! : "event";
  const audience = AUDIENCES.includes(body.audience || "") ? body.audience! : "all";

  const event = await db.calendarEvent.create({
    data: {
      tenantId: session.tenantId,
      title,
      titleArabic: (body.titleArabic || "").trim() || null,
      description: (body.description || "").trim() || null,
      type,
      startDate: start,
      endDate: end,
      isAllDay: body.isAllDay !== false,
      location: (body.location || "").trim() || null,
      audience,
      isHighlighted: !!body.isHighlighted,
    },
  });

  await auditAfter(session, {
    action: "create",
    module: "calendar",
    entityId: event.id,
    entityName: event.title,
    details: { type, startDate: start.toISOString(), audience },
  });

  return ok(event, 201);
}
