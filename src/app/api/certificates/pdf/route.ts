// POST /api/certificates/pdf — generate a printable PDF certificate (A4 landscape).
// Body: { studentId, certificateType, customText? }
// RBAC: requires students:export permission. Returns binary PDF (inline).
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { checkPermission } from "@/lib/permissions";
import { forbidden, auditAfter } from "@/lib/api";
import { generateCertificate, type CertType } from "@/lib/certificate-pdf";

const VALID: Set<CertType> = new Set(["completion", "hifz", "merit", "participation"]);

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const allowed = await checkPermission(session, "students", "export");
  if (!allowed) return forbidden("You don't have permission to generate certificates");

  const body = await req.json().catch(() => ({}));
  const { studentId, certificateType, customText } = body || {};
  if (!studentId) {
    return NextResponse.json({ ok: false, error: "Missing studentId" }, { status: 400 });
  }
  const ct = certificateType as CertType;
  if (!VALID.has(ct)) {
    return NextResponse.json({ ok: false, error: "Invalid certificate type" }, { status: 400 });
  }

  const [student, tenant] = await Promise.all([
    db.student.findFirst({
      where: { id: studentId, tenantId: session.tenantId },
      select: {
        name: true, nameArabic: true, rollNo: true,
        isHafiz: true, admissionDate: true,
        class: { select: { name: true } },
      },
    }),
    db.tenant.findUnique({
      where: { id: session.tenantId },
      select: { name: true, address: true, phone: true, email: true },
    }),
  ]);
  if (!student) {
    return NextResponse.json({ ok: false, error: "Student not found" }, { status: 404 });
  }

  const tenantName = tenant?.name || "Madrasa";
  const studentName = student.name || "Student";

  const bytes = await generateCertificate({
    tenantName,
    tenantAddress: tenant?.address,
    tenantPhone: tenant?.phone,
    tenantEmail: tenant?.email,
    studentName,
    studentNameArabic: student.nameArabic,
    className: student.class?.name || null,
    certificateType: ct,
    customText: typeof customText === "string" ? customText : null,
    studentId,
  });

  await auditAfter(session, {
    action: "export",
    module: "students",
    entityId: studentId,
    entityName: studentName,
    details: { certificateType: ct },
  });

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="certificate-${ct}-${studentId.slice(-6)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
