// GET /api/alerts — System alerts management
import { withSession, fail } from "@/lib/api";
import { db } from "@/lib/db";

export const GET = withSession(async ({ session, req }) => {
  const url = new URL(req.url);
  const resolved = url.searchParams.get("resolved") === "true";

  const alerts = await db.systemAlert.findMany({
    where: { tenantId: session.tenantId, isResolved: resolved },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return { alerts };
});

export const POST = withSession(async ({ session, req }) => {
  const body = await req.json();
  const { title, message, type, severity, module } = body;
  if (!title || !message || !type) return fail("title, message, type required");

  const alert = await db.systemAlert.create({
    data: { tenantId: session.tenantId, title, message, type, severity: severity || "medium", module },
  });
  return alert;
});

// PATCH — mark alerts as read/resolved
export const PATCH = withSession(async ({ session, req }) => {
  const body = await req.json();
  const { ids, action } = body; // action: "read" | "resolve" | "unresolve"
  if (!ids?.length || !action) return fail("ids and action required");

  const data: Record<string, boolean> = {};
  if (action === "read") data.isRead = true;
  if (action === "resolve") { data.isResolved = true; data.isRead = true; }
  if (action === "unresolve") data.isResolved = false;

  await db.systemAlert.updateMany({
    where: { id: { in: ids }, tenantId: session.tenantId },
    data,
  });
  return { updated: ids.length };
});
