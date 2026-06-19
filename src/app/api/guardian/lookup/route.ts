// POST /api/guardian/lookup — public guardian phone lookup (NO admin session)
// Finds all students across ALL tenants whose guardianPhone matches the input.
// Returns a non-sensitive summary per student: id, name, nameArabic, rollNo,
// className, photoUrl, isHafiz, isActive, tenantName — enough to render a card.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { phone?: string };
    const phone = (body?.phone || "").trim();
    if (!phone) {
      return NextResponse.json(
        { ok: false, error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Search across all tenants — guardianPhone is the link.
    // We do not require a tenant context here; this is intentional and the
    // response contains only non-sensitive public info (no passwords, no
    // admin notes, no address/DOB/blood group etc.).
    const students = await db.student.findMany({
      where: { guardianPhone: phone },
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
  } catch (e) {
    console.error("[guardian.lookup] error:", e);
    return NextResponse.json(
      { ok: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
