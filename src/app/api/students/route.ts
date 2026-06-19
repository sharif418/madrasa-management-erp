// Students API — list (with filters + pagination) & create (with auto Wallet)
// All queries scoped by tenantId from session.
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter } from "@/lib/api";

// GET /api/students?search=&classId=&gender=&page=1&limit=20
export const GET = withSession(async ({ session, req }) => {
  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim() || "";
  const classId = url.searchParams.get("classId") || "";
  const gender = url.searchParams.get("gender") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));

  // Build tenant-scoped where clause
  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (classId) where.classId = classId;
  if (gender === "male" || gender === "female") where.gender = gender;

  if (search) {
    const s = search.toLowerCase();
    where.OR = [
      { name: { contains: s } },
      { nameArabic: { contains: s } },
      { rollNo: { contains: s } },
      { phone: { contains: s } },
      { guardianName: { contains: s } },
      { guardianPhone: { contains: s } },
    ];
  }

  const [items, total] = await Promise.all([
    db.student.findMany({
      where,
      include: { class: true, wallet: true },
      orderBy: [{ rollNo: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.student.count({ where }),
  ]);

  return ok({ items, total, page, limit });
});

// POST /api/students — create new student + auto-create wallet
export const POST = withSession(async ({ session, req }) => {
  const body = await req.json().catch(() => ({}));
  const {
    name, nameArabic, rollNo, gender, dob, phone,
    guardianName, guardianPhone, guardianRelation,
    address, bloodGroup, classId,
    isHafiz = false, isZakatEligible = false,
  } = body || {};

  if (!name || typeof name !== "string" || !name.trim()) {
    return fail("Name is required");
  }

  // Validate gender
  const g = gender === "female" ? "female" : "male";

  // Validate classId belongs to tenant (if provided)
  if (classId) {
    const cls = await db.class.findFirst({
      where: { id: classId, tenantId: session.tenantId },
      select: { id: true },
    });
    if (!cls) return fail("Selected class does not exist in your madrasa");
  }

  // Roll No uniqueness within tenant
  if (rollNo) {
    const exists = await db.student.findFirst({
      where: { tenantId: session.tenantId, rollNo },
      select: { id: true },
    });
    if (exists) return fail("Roll No already exists for another student");
  }

  // Parse DOB if provided
  let dobDate: Date | null = null;
  if (dob) {
    const d = new Date(dob);
    if (!isNaN(d.getTime())) dobDate = d;
  }

  // Create student + wallet in a transaction
  const student = await db.$transaction(async (tx) => {
    const created = await tx.student.create({
      data: {
        tenantId: session.tenantId,
        name: name.trim(),
        nameArabic: nameArabic?.trim() || null,
        rollNo: rollNo?.trim() || null,
        gender: g,
        dob: dobDate,
        phone: phone?.trim() || null,
        guardianName: guardianName?.trim() || null,
        guardianPhone: guardianPhone?.trim() || null,
        guardianRelation: guardianRelation || null,
        address: address?.trim() || null,
        bloodGroup: bloodGroup || null,
        classId: classId || null,
        isHafiz: !!isHafiz,
        isZakatEligible: !!isZakatEligible,
      },
      include: { class: true, wallet: true },
    });

    // Auto-create wallet with 0 balance
    const wallet = await tx.wallet.create({
      data: { studentId: created.id, tenantId: session.tenantId, balance: 0 },
    });

    return { ...created, wallet };
  });

  await auditAfter(session, {
    action: "create",
    module: "students",
    entityId: student.id,
    entityName: student.name,
    details: { rollNo: student.rollNo, classId: student.classId },
  });

  return ok(student, 201);
});
