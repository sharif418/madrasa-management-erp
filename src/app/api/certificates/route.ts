// GET /api/certificates — tenant info + active students + recent exams (for merit certs).
// All queries filter by session.tenantId (multi-tenant isolation).
import { db } from "@/lib/db";
import { withSession } from "@/lib/api";

export const GET = withSession(async ({ session }) => {
  const [tenant, students, recentExams] = await Promise.all([
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
        isHafiz: true, admissionDate: true,
        class: { select: { id: true, name: true } },
      },
      orderBy: [{ rollNo: "asc" }, { name: "asc" }],
    }),
    db.exam.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, name: true, term: true,
        startDate: true, endDate: true,
        class: { select: { name: true } },
      },
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
      classId: s.class?.id || null,
      isHafiz: s.isHafiz,
      admissionDate: s.admissionDate
        ? s.admissionDate.toISOString().slice(0, 10)
        : null,
    })),
    recentExams: recentExams.map((e) => ({
      id: e.id,
      name: e.name,
      term: e.term,
      className: e.class?.name || null,
      startDate: e.startDate ? e.startDate.toISOString().slice(0, 10) : null,
    })),
  };
});
