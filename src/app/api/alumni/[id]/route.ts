// Alumni by id — PUT (update) / DELETE
import { db } from "@/lib/db";
import { ok, fail, notFound, withSession, auditAfter } from "@/lib/api";

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

export const PUT = withSession(async ({ session, req, params }) => {
  const id = params?.id;
  if (!id) return fail("Missing alumni id");

  const existing = await db.alumni.findFirst({
    where: { id, tenantId: session.tenantId },
    select: { id: true, name: true },
  });
  if (!existing) return notFound("Alumni not found");

  const body = (await req.json().catch(() => ({}))) as Body;
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const n = body.name.trim();
    if (!n) return fail("Name cannot be empty");
    data.name = n;
  }
  if (body.nameArabic !== undefined) data.nameArabic = body.nameArabic?.trim() || null;
  if (body.graduationYear !== undefined) {
    const y = Number(body.graduationYear);
    if (y < 1900 || y > 2100) return fail("Invalid graduation year");
    data.graduationYear = y;
  }
  if (body.graduatedLevel !== undefined) data.graduatedLevel = body.graduatedLevel?.trim() || null;
  if (body.rollNumber !== undefined) data.rollNumber = body.rollNumber?.trim() || null;
  if (body.currentOccupation !== undefined) data.currentOccupation = body.currentOccupation?.trim() || null;
  if (body.organization !== undefined) data.organization = body.organization?.trim() || null;
  if (body.currentCity !== undefined) data.currentCity = body.currentCity?.trim() || null;
  if (body.currentCountry !== undefined) data.currentCountry = body.currentCountry?.trim() || "Bangladesh";
  if (body.phone !== undefined) data.phone = body.phone?.trim() || null;
  if (body.email !== undefined) data.email = body.email?.trim() || null;
  if (body.linkedin !== undefined) data.linkedin = body.linkedin?.trim() || null;
  if (body.achievements !== undefined) data.achievements = body.achievements?.trim() || null;
  if (body.isActive !== undefined) data.isActive = !!body.isActive;
  if (body.isMentor !== undefined) data.isMentor = !!body.isMentor;

  const updated = await db.alumni.update({ where: { id }, data });

  await auditAfter(session, {
    action: "update", module: "alumni", entityId: id,
    entityName: existing.name, details: { changed: Object.keys(data) },
  });

  return ok(updated);
});

export const DELETE = withSession(async ({ session, params }) => {
  const id = params?.id;
  if (!id) return fail("Missing alumni id");

  const existing = await db.alumni.findFirst({
    where: { id, tenantId: session.tenantId },
    select: { id: true, name: true },
  });
  if (!existing) return notFound("Alumni not found");

  await db.alumni.delete({ where: { id } });

  await auditAfter(session, {
    action: "delete", module: "alumni", entityId: id,
    entityName: existing.name,
  });

  return ok({ id });
});
