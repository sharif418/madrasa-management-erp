// GET/PUT /api/website/settings — Website branding, hero, social, SEO
import { withSession, fail } from "@/lib/api";
import { db } from "@/lib/db";

export const GET = withSession(async ({ session }) => {
  let settings = await db.websiteSetting.findUnique({
    where: { tenantId: session.tenantId },
  });
  if (!settings) {
    settings = await db.websiteSetting.create({
      data: { tenantId: session.tenantId },
    });
  }
  return settings;
});

export const PUT = withSession(async ({ session, req }) => {
  const body = await req.json();
  const { tenantId: _, id: __, ...data } = body;
  const settings = await db.websiteSetting.upsert({
    where: { tenantId: session.tenantId },
    create: { tenantId: session.tenantId, ...data },
    update: data,
  });
  return settings;
});
