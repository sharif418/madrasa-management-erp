// Communications Center API — multi-channel messaging
// GET: recent notifications + 7-day activity + audience breakdown
// POST: send a message (creates a Notification row, mock send)
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter } from "@/lib/api";

export const dynamic = "force-dynamic";

const CHANNELS = ["app", "sms", "whatsapp", "email"] as const;
const AUDIENCES = ["all", "parents", "staff", "students"] as const;
type Channel = (typeof CHANNELS)[number];
type Audience = (typeof AUDIENCES)[number];

function isChannel(v: unknown): v is Channel {
  return typeof v === "string" && (CHANNELS as readonly string[]).includes(v);
}
function isAudience(v: unknown): v is Audience {
  return typeof v === "string" && (AUDIENCES as readonly string[]).includes(v);
}

// Count reachable recipients for a given audience (mock — based on contact info).
async function countReach(tenantId: string, audience: Audience): Promise<number> {
  if (audience === "staff") {
    return db.teacher.count({
      where: { tenantId, isActive: true, NOT: { phone: null } },
    });
  }
  if (audience === "parents") {
    return db.student.count({
      where: { tenantId, isActive: true, NOT: { guardianPhone: null } },
    });
  }
  if (audience === "students") {
    return db.student.count({
      where: { tenantId, isActive: true, NOT: { phone: null } },
    });
  }
  // "all" — total active community
  const [students, teachers] = await Promise.all([
    db.student.count({ where: { tenantId, isActive: true } }),
    db.teacher.count({ where: { tenantId, isActive: true } }),
  ]);
  return students + teachers;
}

// GET /api/communications — recent notifications + 7-day activity + audience breakdown
export const GET = withSession(async ({ session }) => {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const [recent, sinceRows, audienceCounts] = await Promise.all([
    db.notification.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { sentAt: "desc" },
      take: 20,
    }),
    db.notification.findMany({
      where: { tenantId: session.tenantId, sentAt: { gte: since } },
      select: { channel: true, audience: true, sentAt: true },
    }),
    Promise.all([
      countReach(session.tenantId, "all"),
      countReach(session.tenantId, "parents"),
      countReach(session.tenantId, "staff"),
      countReach(session.tenantId, "students"),
    ]),
  ]);

  // 7-day activity series (count per day per channel)
  const days: { date: string; label: string; app: number; sms: number; whatsapp: number; email: number }[] = [];
  const fmt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const dayRows = sinceRows.filter((r) => r.sentAt >= d && r.sentAt < next);
    days.push({
      date: d.toISOString(),
      label: fmt.format(d),
      app: dayRows.filter((r) => r.channel === "app").length,
      sms: dayRows.filter((r) => r.channel === "sms").length,
      whatsapp: dayRows.filter((r) => r.channel === "whatsapp").length,
      email: dayRows.filter((r) => r.channel === "email").length,
    });
  }

  // Audience breakdown of recent notifications
  const audienceBreakdown = AUDIENCES.map((a) => ({
    audience: a,
    count: recent.filter((r) => r.audience === a).length,
  }));

  return ok({
    recent: recent.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      channel: n.channel,
      audience: n.audience,
      sentAt: n.sentAt.toISOString(),
    })),
    activity: days,
    audienceBreakdown,
    reach: {
      all: audienceCounts[0],
      parents: audienceCounts[1],
      staff: audienceCounts[2],
      students: audienceCounts[3],
    },
  });
});

// POST /api/communications — send a message (mock; just creates a Notification row)
export const POST = withSession(async ({ session, req }) => {
  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const message = typeof body.body === "string" ? body.body.trim() : "";
  const channel = isChannel(body.channel) ? body.channel : "app";
  const audience = isAudience(body.audience) ? body.audience : "all";

  if (!title || !message) return fail("Title and message are required", 400);
  if (title.length > 200) return fail("Title is too long", 400);

  const recipientCount = await countReach(session.tenantId, audience);

  const created = await db.notification.create({
    data: {
      tenantId: session.tenantId,
      title,
      body: message,
      channel,
      audience,
      sentByUserId: session.userId,
      sentAt: new Date(),
    },
  });

  await auditAfter(session, {
    action: "create",
    module: "communications",
    entityId: created.id,
    entityName: title,
    details: { channel, audience, recipientCount, source: "communication-center" },
  });

  return ok({ sent: recipientCount, channel, id: created.id }, 201);
});
