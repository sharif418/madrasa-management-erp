// Transfer Certificate PDF API — GET /api/students/[id]/transfer-certificate
// Generates a printable PDF transfer certificate (A4 portrait, Latin-only).
// Tenant-scoped. RBAC: students:export.
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { unauthorized, fail, forbidden, notFound, auditAfter } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";
import { buildTransferCertificatePdf } from "@/lib/pdf-transfer";

const fmtDate = (d: Date | null) =>
  d ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null;

const gradeFor = (pct: number) => {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
};

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!(await checkPermission(session, "students", "export")))
    return forbidden("No permission to export transfer certificates");

  const { id } = await ctx.params;
  if (!id) return fail("Missing student id");

  const [student, tenant, lastExamRow, attendanceAgg] = await Promise.all([
    db.student.findFirst({
      where: { id, tenantId: session.tenantId },
      include: { class: { select: { name: true } } },
    }),
    db.tenant.findUnique({
      where: { id: session.tenantId },
      select: { name: true, address: true, phone: true },
    }),
    db.examResult.findFirst({
      where: { studentId: id },
      include: { exam: { select: { id: true, name: true } } },
      orderBy: { exam: { startDate: "desc" } },
    }),
    db.attendance.aggregate({
      _count: { _all: true },
      where: { tenantId: session.tenantId, personId: id, personType: "student" },
    }),
  ]);

  if (!student) return notFound("Student not found");

  // Determine last exam + grade by averaging this student's results in that exam
  let lastExamName: string | null = null;
  let lastGrade: string | null = null;
  if (lastExamRow) {
    lastExamName = lastExamRow.exam?.name ?? null;
    const results = await db.examResult.findMany({
      where: { examId: lastExamRow.examId, studentId: id },
    });
    if (results.length > 0) {
      const totalMarks = results.reduce((a, r) => a + r.marks, 0);
      const maxMarks = results.reduce((a, r) => a + r.total, 0);
      const pct = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
      lastGrade = gradeFor(pct);
    }
  }

  // Attendance: count of "present" rows / total rows
  let attendancePct: number | null = null;
  const totalCount = attendanceAgg._count?._all ?? 0;
  if (totalCount > 0) {
    const presentCount = await db.attendance.count({
      where: { tenantId: session.tenantId, personId: id, personType: "student", status: "present" },
    });
    attendancePct = Math.round((presentCount / totalCount) * 100);
  }

  try {
    const pdfBytes = await buildTransferCertificatePdf({
      tenantName: tenant?.name || "Madrasa",
      tenantAddress: tenant?.address ?? null,
      tenantPhone: tenant?.phone ?? null,
      studentName: student.name,
      nameArabic: student.nameArabic,
      rollNo: student.rollNo,
      className: student.class?.name ?? null,
      dob: fmtDate(student.dob),
      admissionDate: fmtDate(student.admissionDate),
      gender: student.gender,
      guardianName: student.guardianName,
      lastExamName,
      lastGrade,
      attendancePct,
      conduct: "Good",
    });

    await auditAfter(session, {
      action: "export",
      module: "students",
      entityId: student.id,
      entityName: student.name,
      details: { type: "transfer-certificate" },
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="transfer-${student.rollNo || student.id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[transfer-certificate] build failed:", e);
    return fail(e instanceof Error ? e.message : "PDF generation failed", 500);
  }
}
