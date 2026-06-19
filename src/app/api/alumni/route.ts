// Alumni API
// GET  /api/alumni?search=&year=  — list alumni (with filters)
// POST /api/alumni                — create alumni (admin)
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter } from "@/lib/api";

// GET — list alumni with search + year filter
export const GET = withSession(async ({ session, req }) => {
  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim() || "";
  const year = url.searchParams.get("year") || "";

  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (year) {
    const y = parseInt(year, 10);
    if (!isNaN(y)) where.graduationYear = y;
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { nameArabic: { contains: search } },
      { currentOccupation: { contains: search } },
      { organization: { contains: search } },
      { currentCity: { contains: search } },
      { currentCountry: { contains: search } },
      { rollNumber: { contains: search } },
    ];
  }

  const items = await db.alumni.findMany({
    where,
    orderBy: [{ graduationYear: "desc" }, { name: "asc" }],
    take: 300,
  });

  // KPIs
  const total = items.length;
  const mentors = items.filter((a) => a.isMentor).length;
  const countries = new Set(items.map((a) => a.currentCountry).filter(Boolean)).size;

  // Year distribution for analytics
  const yearMap: Record<string, number> = {};
  for (const a of items) {
    yearMap[String(a.graduationYear)] = (yearMap[String(a.graduationYear)] || 0) + 1;
  }

  return ok({
    items: items.map((a) => ({
      id: a.id,
      name: a.name,
      nameArabic: a.nameArabic,
      graduationYear: a.graduationYear,
      graduatedLevel: a.graduatedLevel,
      rollNumber: a.rollNumber,
      currentOccupation: a.currentOccupation,
      organization: a.organization,
      currentCity: a.currentCity,
      currentCountry: a.currentCountry,
      phone: a.phone,
      email: a.email,
      linkedin: a.linkedin,
      achievements: a.achievements,
      isActive: a.isActive,
      isMentor: a.isMentor,
    })),
    kpis: { total, mentors, countries },
    years: Object.entries(yearMap).map(([year, count]) => ({ year, count })).sort((a, b) => b.year.localeCompare(a.year)),
  });
});

// POST — create alumni
type Body = {
  name?: string;
  nameArabic?: string;
  graduationYear?: number;
  graduatedLevel?: string;
  rollNumber?: string;
  currentOccupation?: string;
  organization?: string;
  currentCity?: string;
  currentCountry?: string;
  phone?: string;
  email?: string;
  linkedin?: string;
  achievements?: string;
  isActive?: boolean;
  isMentor?: boolean;
};

export const POST = withSession(async ({ session, req }) => {
  const body = (await req.json().catch(() => ({}))) as Body;
  const name = (body.name || "").trim();
  if (!name) return fail("Name is required");
  const graduationYear = Number(body.graduationYear);
  if (!graduationYear || graduationYear < 1900 || graduationYear > 2100)
    return fail("Valid graduation year is required");

  const created = await db.alumni.create({
    data: {
      tenantId: session.tenantId,
      name,
      nameArabic: body.nameArabic?.trim() || null,
      graduationYear,
      graduatedLevel: body.graduatedLevel?.trim() || null,
      rollNumber: body.rollNumber?.trim() || null,
      currentOccupation: body.currentOccupation?.trim() || null,
      organization: body.organization?.trim() || null,
      currentCity: body.currentCity?.trim() || null,
      currentCountry: body.currentCountry?.trim() || "Bangladesh",
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      linkedin: body.linkedin?.trim() || null,
      achievements: body.achievements?.trim() || null,
      isActive: body.isActive !== false,
      isMentor: !!body.isMentor,
    },
  });

  await auditAfter(session, {
    action: "create", module: "alumni", entityId: created.id,
    entityName: name, details: { graduationYear, isMentor: !!body.isMentor },
  });

  return ok(created, 201);
});
