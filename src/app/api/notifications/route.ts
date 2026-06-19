// GET /api/notifications — recent notifications + upcoming calendar events for the bell dropdown.
// Per-user read state isn't tracked in the DB, so every notification is returned with isRead=false
// to drive the bell badge. Last 10 notifications + next 3 calendar events.
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const [notifications, events] = await Promise.all([
      db.notification.findMany({
        where: { tenantId: session.tenantId },
        orderBy: { sentAt: "desc" },
        take: 10,
      }),
      db.calendarEvent.findMany({
        where: {
          tenantId: session.tenantId,
          startDate: { gte: new Date() },
        },
        orderBy: { startDate: "asc" },
        take: 3,
      }),
    ]);

    const now = Date.now();
    const items = notifications.map((n) => ({
      id: n.id,
      kind: "notification" as const,
      title: n.title,
      body: n.body,
      channel: n.channel,
      audience: n.audience,
      timestamp: n.sentAt.toISOString(),
      isRead: false,
    }));
    const upcoming = events.map((e) => ({
      id: e.id,
      kind: "event" as const,
      title: e.title,
      body: e.description ?? "",
      eventType: e.type,
      location: e.location,
      timestamp: e.startDate.toISOString(),
      isRead: false,
      msUntil: Math.max(0, e.startDate.getTime() - now),
    }));

    return ok({
      items,
      upcoming,
      unreadCount: items.length + upcoming.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load notifications";
    return fail(msg, 500);
  }
}
