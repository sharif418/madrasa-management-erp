// Student Documents — list + upload
// GET  /api/students/[id]/documents
// POST /api/students/[id]/documents  (multipart/form-data)
import { db } from "@/lib/db";
import { ok, fail, notFound, withSession, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

const VALID_TYPES = ["birth_certificate", "transfer_certificate", "medical", "photo", "other"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export const GET = withSession(async ({ session, params }) => {
  const id = params?.id;
  if (!id) return fail("Missing student id");
  const student = await db.student.findFirst({
    where: { id, tenantId: session.tenantId },
    select: { id: true },
  });
  if (!student) return notFound("Student not found");

  const docs = await db.studentDocument.findMany({
    where: { tenantId: session.tenantId, studentId: id },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true, title: true, type: true, fileName: true,
      fileSize: true, mimeType: true, uploadedAt: true,
    },
  });
  return ok({ items: docs });
});

export const POST = withSession(async ({ session, req, params }) => {
  const id = params?.id;
  if (!id) return fail("Missing student id");
  const allowed = await checkPermission(session, "students", "create");
  if (!allowed) return forbidden("You don't have permission to upload documents");

  const student = await db.student.findFirst({
    where: { id, tenantId: session.tenantId },
    select: { id: true, name: true },
  });
  if (!student) return notFound("Student not found");

  const form = await req.formData();
  const file = form.get("file");
  const title = String(form.get("title") || "").trim();
  const type = String(form.get("type") || "other");
  if (!(file instanceof File)) return fail("File is required");
  if (!title) return fail("Title is required");
  if (!VALID_TYPES.includes(type)) return fail("Invalid document type");
  if (file.size > MAX_BYTES) return fail("File too large (max 5 MB)");

  const buf = Buffer.from(await file.arrayBuffer());
  const base64 = buf.toString("base64");

  const doc = await db.studentDocument.create({
    data: {
      tenantId: session.tenantId,
      studentId: id,
      title,
      type,
      fileName: file.name || "document",
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      data: base64,
    },
    select: {
      id: true, title: true, type: true, fileName: true,
      fileSize: true, mimeType: true, uploadedAt: true,
    },
  });

  await auditAfter(session, {
    action: "create",
    module: "students",
    entityId: doc.id,
    entityName: `${student.name} — ${title}`,
    details: { document: { type, fileName: doc.fileName, fileSize: doc.fileSize } },
  });
  return ok(doc, 201);
});
