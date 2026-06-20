// Student Document — view/download + delete
// GET    /api/students/[id]/documents/[docId]  → returns raw file with proper Content-Type
// DELETE /api/students/[id]/documents/[docId]
import { db } from "@/lib/db";
import { ok, fail, notFound, withSession, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

export const GET = withSession(async ({ session, params }) => {
  const id = params?.id;
  const docId = params?.docId;
  if (!id || !docId) return fail("Missing id");

  const doc = await db.studentDocument.findFirst({
    where: { id: docId, tenantId: session.tenantId, studentId: id },
  });
  if (!doc) return notFound("Document not found");

  const buf = Buffer.from(doc.data, "base64");
  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Length": String(buf.length),
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.fileName)}"`,
      "Cache-Control": "private, no-cache",
    },
  });
});

export const DELETE = withSession(async ({ session, params }) => {
  const id = params?.id;
  const docId = params?.docId;
  if (!id || !docId) return fail("Missing id");
  const allowed = await checkPermission(session, "students", "delete");
  if (!allowed) return forbidden("You don't have permission to delete documents");

  const doc = await db.studentDocument.findFirst({
    where: { id: docId, tenantId: session.tenantId, studentId: id },
    select: { id: true, title: true, fileName: true, type: true, student: { select: { name: true } } },
  });
  if (!doc) return notFound("Document not found");

  await db.studentDocument.delete({ where: { id: docId } });

  await auditAfter(session, {
    action: "delete",
    module: "students",
    entityId: doc.id,
    entityName: `${doc.student.name} — ${doc.title}`,
    details: { document: { type: doc.type, fileName: doc.fileName } },
  });
  return ok({ id: docId, deleted: true });
});
