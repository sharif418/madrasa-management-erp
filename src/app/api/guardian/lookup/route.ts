// POST /api/guardian/lookup — guardian phone lookup (requires session)
// Finds all students within the caller's tenant whose guardianPhone matches.
// Returns a non-sensitive summary per student: id, name, nameArabic, rollNo,
// className, photoUrl, isHafiz, isActive, tenantName — enough to render a card.
import { NextResponse } from "next/server";
import { withSession } from "@/lib/api";
import { db } from "@/lib/db";

export const POST = withSession(async ({ session, req }) => {
  const body = (await req.json().catch(() => ({}))) as { phone?: string };
  const phone = (body?.phone || "").trim();
  if (!phone) {
    return NextResponse.json(
      { ok: false, error: "Phone number is required" },
      { status: 400 }
    );
  }

  // Search within the caller's tenant only — tenant isolation.
  const students = await db.student.findMany({
    where: { tenantId: session.tenantId, guardianPhone: phone },
    include: { class: true, tenant: { select: { name: true } } },
    orderBy: [{ name: "asc" }],
    take: 50,
  });

  if (students.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No students found for this phone number" },
      { status: 404 }
    );
  }

  const items = students.map((s) => ({
    id: s.id,
    tenantId: s.tenantId,
    tenantName: s.tenant?.name ?? "",
    name: s.name,
    nameArabic: s.nameArabic,
    rollNo: s.rollNo,
    className: s.class?.name ?? null,
    photoUrl: s.photoUrl,
    isHafiz: s.isHafiz,
    isActive: s.isActive,
    guardianPhone: s.guardianPhone,
  }));

  return NextResponse.json({ ok: true, data: { students: items } });
});
