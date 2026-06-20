// Attendance stats — last 7 days summary + per-session breakdown for current tenant
// GET /api/attendance/stats → { series: [{date, present, absent, late, leave, rate}], bySession: {morning, afternoon, full} }
import { db } from "@/lib/db";
import { ok, withSession } from "@/lib/api";

export const GET = withSession(async ({ session }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build 7-day window [today-6 .. today]
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  const from = days[0];
  const to = new Date(days[days.length - 1]);
  to.setDate(to.getDate() + 1); // exclusive upper bound

  const rows = await db.attendance.findMany({
    where: { tenantId: session.tenantId, date: { gte: from, lt: to } },
    select: { date: true, status: true, session: true },
  });

  // Bucket by yyyy-mm-dd
  const buckets = new Map<string, { present: number; absent: number; late: number; leave: number }>();
  // Session breakdown across the whole 7-day window
  const bySession: Record<string, { present: number; absent: number; late: number; leave: number; total: number }> = {
    morning: { present: 0, absent: 0, late: 0, leave: 0, total: 0 },
    afternoon: { present: 0, absent: 0, late: 0, leave: 0, total: 0 },
    full: { present: 0, absent: 0, late: 0, leave: 0, total: 0 },
  };
  for (const r of rows) {
    const d = new Date(r.date);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    const b = buckets.get(key) ?? { present: 0, absent: 0, late: 0, leave: 0 };
    if (r.status === "present") b.present += 1;
    else if (r.status === "absent") b.absent += 1;
    else if (r.status === "late") b.late += 1;
    else if (r.status === "leave") b.leave += 1;
    buckets.set(key, b);

    // Tally per-session counts (default to "full" if missing for legacy rows)
    const sess = r.session && bySession[r.session] ? r.session : "full";
    const sb = bySession[sess];
    if (sb) {
      sb.total += 1;
      if (r.status === "present") sb.present += 1;
      else if (r.status === "absent") sb.absent += 1;
      else if (r.status === "late") sb.late += 1;
      else if (r.status === "leave") sb.leave += 1;
    }
  }

  const series = days.map((d) => {
    const key = d.toISOString().slice(0, 10);
    const b = buckets.get(key) ?? { present: 0, absent: 0, late: 0, leave: 0 };
    const total = b.present + b.absent + b.late + b.leave;
    const rate = total === 0 ? 0 : Math.round(((b.present + b.late) / total) * 100);
    return { date: d.toISOString(), present: b.present, absent: b.absent, late: b.late, leave: b.leave, rate };
  });

  // Compute per-session attendance rate (present+late) / total
  const sessionStats = Object.fromEntries(
    Object.entries(bySession).map(([k, v]) => {
      const rate = v.total === 0 ? 0 : Math.round(((v.present + v.late) / v.total) * 100);
      return [k, { ...v, rate }];
    })
  );

  return ok({ series, bySession: sessionStats });
});
