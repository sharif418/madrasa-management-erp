// GET /api/activity — Activity log timeline
import { withSession } from "@/lib/api";
import { db } from "@/lib/db";

export const GET = withSession(async ({ session, req }) => {
  const url = new URL(req.url);
  const module = url.searchParams.get("module");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);

  const where: any = { tenantId: session.tenantId };
  if (module) where.module = module;

  const logs = await db.activityLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return { logs };
});
