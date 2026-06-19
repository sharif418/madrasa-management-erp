// History tab — 7-day activity bar chart + audience pie + recent messages list
"use client";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  MessageSquare, Smartphone, MessageCircle, Mail, Inbox, Clock,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Channel = "app" | "sms" | "whatsapp" | "email";
type Audience = "all" | "parents" | "staff" | "students";

export type ActivityDay = {
  date: string;
  label: string;
  app: number;
  sms: number;
  whatsapp: number;
  email: number;
};

export type RecentMessage = {
  id: string;
  title: string;
  body: string;
  channel: string;
  audience: string;
  sentAt: string;
};

export type AudienceBreakdownItem = { audience: string; count: number };

type Props = {
  activity: ActivityDay[];
  audienceBreakdown: AudienceBreakdownItem[];
  recent: RecentMessage[];
};

const CHANNEL_META: Record<Channel, { icon: typeof MessageSquare; color: string }> = {
  app: { icon: MessageSquare, color: "#0ea5e9" },
  sms: { icon: Smartphone, color: "#10b981" },
  whatsapp: { icon: MessageCircle, color: "#22c55e" },
  email: { icon: Mail, color: "#a855f7" },
};

const AUDIENCE_COLORS: Record<string, string> = {
  all: "#0d9488",
  parents: "#0ea5e9",
  staff: "#f59e0b",
  students: "#a855f7",
};

const AXIS_TICK = { fontSize: 12, fill: "var(--foreground)" };

function relativeTime(iso: string, locale: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  } catch {
    return "";
  }
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-xs shadow-md">
      {label ? <p className="mb-1 font-semibold">{label}</p> : null}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize">{p.name}</span>
          <span className="ms-auto tabular-nums font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function HistoryTab({ activity, audienceBreakdown, recent }: Props) {
  const { t, dir, locale } = useApp();

  const totalMessages = recent.length;
  const pieData = audienceBreakdown
    .filter((a) => a.count > 0)
    .map((a) => ({ name: a.audience, value: a.count }));
  const pieEmpty = pieData.length === 0;

  return (
    <div className="space-y-4" dir={dir()}>
      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("communications.activityChart")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full rounded-xl bg-muted/30 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activity} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.35} vertical={false} />
                  <XAxis dataKey="label" tick={AXIS_TICK} stroke="var(--foreground)" tickLine={false} axisLine={{ stroke: "var(--border)" }} />
                  <YAxis tick={AXIS_TICK} stroke="var(--foreground)" tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Bar dataKey="app" stackId="a" fill={CHANNEL_META.app.color} radius={[0, 0, 0, 0]} maxBarSize={48} />
                  <Bar dataKey="sms" stackId="a" fill={CHANNEL_META.sms.color} radius={[0, 0, 0, 0]} maxBarSize={48} />
                  <Bar dataKey="whatsapp" stackId="a" fill={CHANNEL_META.whatsapp.color} radius={[0, 0, 0, 0]} maxBarSize={48} />
                  <Bar dataKey="email" stackId="a" fill={CHANNEL_META.email.color} radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("communications.audienceBreakdown")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full rounded-xl bg-muted/30 p-2">
              {pieEmpty ? (
                <div className="grid h-full place-items-center">
                  <div className="rounded-full bg-muted/80 px-4 py-1.5 text-xs font-medium text-muted-foreground">
                    {t("analytics.noData")}
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      stroke="none"
                      label={(entry) => `${entry.value}`}
                      labelLine={false}
                    >
                      {pieData.map((p) => (
                        <Cell key={p.name} fill={AUDIENCE_COLORS[p.name] ?? "#64748b"} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent messages list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Inbox className="size-4 text-cyan-600" />
              {t("communications.recentMessages")}
            </span>
            <Badge variant="secondary">{totalMessages}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Inbox className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{t("communications.noMessages")}</p>
              <p className="text-xs text-muted-foreground/70 max-w-sm">{t("communications.noMessagesDesc")}</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto pe-1">
              <ul className="space-y-2">
                {recent.map((m) => {
                  const ch = (m.channel in CHANNEL_META ? m.channel : "app") as Channel;
                  const Icon = CHANNEL_META[ch].icon;
                  const color = CHANNEL_META[ch].color;
                  return (
                    <li
                      key={m.id}
                      className="flex items-start gap-3 rounded-xl border border-border bg-background px-3 py-2.5 transition-colors hover:bg-muted/40"
                    >
                      <div
                        className="grid size-9 shrink-0 place-items-center rounded-lg text-white shadow-sm"
                        style={{ background: color }}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold truncate">{m.title}</p>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {t(`communications.${m.audience === "all" ? "all" : (m.audience as Audience)}`)}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{m.body}</p>
                      </div>
                      <div className="flex flex-col items-end shrink-0 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {relativeTime(m.sentAt, locale)}
                        </span>
                        <span className="mt-1 capitalize">{t(`communications.${ch === "app" ? "inApp" : ch}`)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
