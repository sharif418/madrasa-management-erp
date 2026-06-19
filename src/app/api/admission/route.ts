// Admission Portal API
// GET   /api/admission?status=         — list applications (admin/session)
// POST  /api/admission                 — create application (PUBLIC, no session)
// PATCH /api/admission                 — update application status (admin/session)
//
// NOTE: POST is public so external applicants can submit. The tenantId is
// supplied in the body and validated against the Tenant table. All other
// operations require an authenticated session.
import { db } from "@/lib/db";
import { ok, fail, notFound, withSession, auditAfter } from "@/lib/api";

const STATUSES = new Set(["pending", "reviewing", "approved", "rejected", "enrolled"]);

// GET — list applications (admin)
export const GET = withSession(async ({ session, req }) => {
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "";

  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (status && STATUSES.has(status)) where.status = status;

  const items = await db.admissionApplication.findMany({
    where,
    orderBy: { applicationDate: "desc" },
    take: 200,
  });

  // KPIs
  const [total, pending, approved, enrolled] = await Promise.all([
    db.admissionApplication.count({ where: { tenantId: session.tenantId } }),
    db.admissionApplication.count({ where: { tenantId: session.tenantId, status: "pending" } }),
    db.admissionApplication.count({ where: { tenantId: session.tenantId, status: "approved" } }),
    db.admissionApplication.count({ where: { tenantId: session.tenantId, status: "enrolled" } }),
  ]);

  return ok({
    items: items.map((a) => ({
      id: a.id,
      applicantName: a.applicantName,
      applicantNameArabic: a.applicantNameArabic,
      fatherName: a.fatherName,
      motherName: a.motherName,
      dateOfBirth: a.dateOfBirth ? a.dateOfBirth.toISOString() : null,
      gender: a.gender,
      guardianPhone: a.guardianPhone,
      guardianEmail: a.guardianEmail,
      address: a.address,
      previousInstitution: a.previousInstitution,
      appliedLevel: a.appliedLevel,
      appliedClass: a.appliedClass,
      hifzBackground: a.hifzBackground,
      applicationDate: a.applicationDate.toISOString(),
      status: a.status,
      reviewedBy: a.reviewedBy,
      reviewNotes: a.reviewNotes,
      interviewDate: a.interviewDate ? a.interviewDate.toISOString() : null,
    })),
    kpis: { total, pending, approved, enrolled },
  });
});

// POST — create application (PUBLIC)
type CreateBody = {
  tenantId?: string;
  applicantName?: string;
  applicantNameArabic?: string;
  fatherName?: string;
  motherName?: string;
  dateOfBirth?: string;
  gender?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  address?: string;
  previousInstitution?: string;
  appliedLevel?: string;
  appliedClass?: string;
  hifzBackground?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as CreateBody;
    const tenantId = (body.tenantId || "").trim();
    if (!tenantId) return fail("Tenant is required");

    // Validate tenant exists
    const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { id: true } });
    if (!tenant) return fail("Invalid institution");

    const applicantName = (body.applicantName || "").trim();
    const fatherName = (body.fatherName || "").trim();
    const guardianPhone = (body.guardianPhone || "").trim();
    if (!applicantName) return fail("Applicant name is required");
    if (!fatherName) return fail("Father/guardian name is required");
    if (!guardianPhone) return fail("Guardian phone is required");

    let dob: Date | null = null;
    if (body.dateOfBirth) {
      const d = new Date(body.dateOfBirth);
      if (!isNaN(d.getTime())) dob = d;
    }

    const created = await db.admissionApplication.create({
      data: {
        tenantId,
        applicantName,
        applicantNameArabic: body.applicantNameArabic?.trim() || null,
        fatherName,
        motherName: body.motherName?.trim() || null,
        dateOfBirth: dob,
        gender: body.gender === "female" ? "female" : "male",
        guardianPhone,
        guardianEmail: body.guardianEmail?.trim() || null,
        address: body.address?.trim() || null,
        previousInstitution: body.previousInstitution?.trim() || null,
        appliedLevel: body.appliedLevel?.trim() || null,
        appliedClass: body.appliedClass?.trim() || null,
        hifzBackground: body.hifzBackground?.trim() || null,
        status: "pending",
      },
    });

    return ok({ id: created.id, status: created.status }, 201);
  } catch (e) {
    console.error("[admission POST]", e);
    return fail(e instanceof Error ? e.message : "Internal Server Error", 500);
  }
}

// PATCH — update application status / schedule interview (admin)
type PatchBody = {
  id?: string;
  status?: string;
  reviewNotes?: string;
  interviewDate?: string | null;
};

export const PATCH = withSession(async ({ session, req }) => {
  const body = (await req.json().catch(() => ({}))) as PatchBody;
  if (!body.id) return fail("Application id is required");

  const existing = await db.admissionApplication.findFirst({
    where: { id: body.id, tenantId: session.tenantId },
    select: { id: true, applicantName: true, status: true },
  });
  if (!existing) return notFound("Application not found");

  const data: Record<string, unknown> = {};
  if (body.status && STATUSES.has(body.status)) data.status = body.status;
  if (body.reviewNotes !== undefined) data.reviewNotes = body.reviewNotes?.trim() || null;
  if (body.interviewDate !== undefined) {
    if (body.interviewDate) {
      const d = new Date(body.interviewDate);
      if (!isNaN(d.getTime())) data.interviewDate = d;
    } else {
      data.interviewDate = null;
    }
  }
  data.reviewedBy = session.userId;

  const updated = await db.admissionApplication.update({ where: { id: body.id }, data });

  await auditAfter(session, {
    action: "update", module: "admission", entityId: body.id,
    entityName: existing.applicantName,
    details: { from: existing.status, to: body.status, interviewDate: body.interviewDate ?? null },
  });

  return ok(updated);
});
