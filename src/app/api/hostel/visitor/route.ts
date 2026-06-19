// Hostel — visitor check-in (POST) and check-out (PATCH)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized, auditAfter } from "@/lib/api";

type Input = {
  name?: string;
  phone?: string;
  purpose?: string;
  visitingStudentId?: string;
  checkIn?: string;
  visitorId?: string;
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as Input;
  const name = (body.name || "").trim();
  const purpose = (body.purpose || "").trim();
  if (!name) return fail("Visitor name required");
  if (!purpose) return fail("Purpose required");

  let visitingStudentId: string | null = null;
  if (body.visitingStudentId) {
    const student = await db.student.findFirst({
      where: { id: body.visitingStudentId, tenantId: session.tenantId },
      select: { id: true },
    });
    if (student) visitingStudentId = student.id;
  }

  const checkIn = body.checkIn ? new Date(body.checkIn) : new Date();

  const visitor = await db.visitor.create({
    data: {
      tenantId: session.tenantId,
      name,
      phone: (body.phone || "").trim() || null,
      purpose,
      visitingStudentId,
      checkIn,
    },
  });

  await auditAfter(session, {
    action: "create", module: "hostel", entityId: visitor.id,
    entityName: name,
    details: { type: "visitor_checkin", purpose, visitingStudentId },
  });

  return ok(visitor, 201);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as Input;
  const visitorId = (body.visitorId || "").trim();
  if (!visitorId) return fail("Visitor ID required");

  const visitor = await db.visitor.findFirst({
    where: { id: visitorId, tenantId: session.tenantId },
  });
  if (!visitor) return fail("Visitor not found", 404);
  if (visitor.checkOut) return fail("Already checked out");

  const updated = await db.visitor.update({
    where: { id: visitorId },
    data: { checkOut: new Date() },
  });

  await auditAfter(session, {
    action: "update", module: "hostel", entityId: updated.id,
    entityName: visitor.name,
    details: { type: "visitor_checkout" },
  });

  return ok(updated);
}
