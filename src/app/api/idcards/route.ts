// GET /api/idcards — tenant info + students + teachers for ID card generation.
// All queries filter by session.tenantId (multi-tenant isolation).
import { db } from "@/lib/db";
import { withSession } from "@/lib/api";

export const GET = withSession(async ({ session }) => {
  const [tenant, students, teachers, classes] = await Promise.all([
    db.tenant.findUnique({
      where: { id: session.tenantId },
      select: {
        name: true, logoUrl: true, address: true, phone: true,
        email: true, subdomain: true,
      },
    }),
    db.student.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      select: {
        id: true, name: true, nameArabic: true, rollNo: true,
        bloodGroup: true, guardianPhone: true, photoUrl: true, dob: true,
        gender: true, classId: true,
        class: { select: { id: true, name: true } },
      },
      orderBy: [{ rollNo: "asc" }, { name: "asc" }],
    }),
    db.teacher.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      select: {
        id: true, name: true, nameArabic: true, designation: true,
        phone: true, photoUrl: true, specialization: true,
        gender: true, email: true,
      },
      orderBy: [{ name: "asc" }],
    }),
    db.class.findMany({
      where: { tenantId: session.tenantId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    tenant: tenant
      ? {
          name: tenant.name,
          logoUrl: tenant.logoUrl,
          address: tenant.address,
          phone: tenant.phone,
          email: tenant.email,
        }
      : null,
    students: students.map((s) => ({
      id: s.id,
      name: s.name,
      nameArabic: s.nameArabic,
      rollNo: s.rollNo,
      className: s.class?.name || null,
      classId: s.classId,
      bloodGroup: s.bloodGroup,
      guardianPhone: s.guardianPhone,
      photoUrl: s.photoUrl,
      dob: s.dob ? s.dob.toISOString().slice(0, 10) : null,
    })),
    teachers: teachers.map((t) => ({
      id: t.id,
      name: t.name,
      nameArabic: t.nameArabic,
      designation: t.designation,
      specialization: t.specialization,
      phone: t.phone,
      email: t.email,
      photoUrl: t.photoUrl,
    })),
    classes,
  };
});
