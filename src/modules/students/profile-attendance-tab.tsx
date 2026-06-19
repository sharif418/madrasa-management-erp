"use client";
// ProfileAttendanceTab — 30-day summary cards + daily status bar chart
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell,
} from "recharts";
import { CalendarCheck, Check, X, Clock, CalendarOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/store/app-store";
import { useT } from "./i18n";
import { ProfileData, fmtDate } from "./profile-types";

type Props = { data: ProfileData; locale: string };

const STATUS_COLOR: Record<string, string> = {
  present: "#10b981",
  late: "#f59e0b",
  absent: "#ef4444",
  leave: "#6366f1",
  none: "#e5e7eb",
};

export function ProfileAttendanceTab({ data, locale }: Props) {
  const t = useT();
  const dir = useApp((s) => s.dir());
  const { attendance } = data;
  const { last30d, series } = attendance;

  // Build chart data: each day with a numeric value (1-4) and color
  const chartData = series.map((d) => ({
    date: d.date,
    label: shortDay(d.date, locale),
    value: statusValue(d.status),
    status: d.status,
  }));

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          icon={<Check className="size-4 text-emerald-600" />}
          label={t("studentProfile.present")}
          value={last30d.present}
          tone="emerald"
        />
        <SummaryCard
          icon={<X className="size-4 text-rose-600" />}
          label={t("studentProfile.absent")}
          value={last30d.absent}
          tone="rose"
        />
        <SummaryCard
          icon={<Clock className="size-4 text-amber-500" />}
          label={t("studentProfile.late")}
          value={last30d.late}
          tone="amber"
        />
        <SummaryCard
          icon={<CalendarOff className="size-4 text-violet-500" />}
          label={t("studentProfile.leave")}
          value={last30d.leave}
          tone="violet"
        />
      </div>

      {/* Rate highlight */}
      <Card className="py-4">
        <CardContent className="flex flex-col items-center gap-1 sm:flex-row sm:justify-between sm:gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarCheck className="size-4 text-emerald-600" />
            {t("studentProfile.last30days")} · {t("studentProfile.attendanceRate")}
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {last30d.total > 0 ? `${last30d.rate}%` : "—"}
            <span className="ms-2 text-xs font-normal text-muted-foreground">
              ({last30d.total} {t("attendance.total")})
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Bar chart */}
      <Card className="py-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("studentProfile.last30days")}</CardTitle>
          <CardDescription>{t("studentProfile.attendance")}</CardDescription>
        </CardHeader>
        <CardContent>
          {last30d.total === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{t("studentProfile.noData")}</p>
          ) : (
            <div className="h-64 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} stroke="var(--muted-foreground)" />
                  <YAxis domain={[0, 4]} ticks={[1, 2, 3, 4]} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickFormatter={(v) => statusName(v, t)} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
                    formatter={(_v: number, _n: string, p: { payload?: { status?: string; date?: string } }) => [
                      statusLabel(p?.payload?.status ?? "", t),
                      fmtDate(p?.payload?.date ?? "", locale),
                    ]}
                  />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={STATUS_COLOR[d.status] ?? STATUS_COLOR.none} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground" dir={dir}>
        <Legend color={STATUS_COLOR.present} label={t("studentProfile.present")} />
        <Legend color={STATUS_COLOR.late} label={t("studentProfile.late")} />
        <Legend color={STATUS_COLOR.absent} label={t("studentProfile.absent")} />
        <Legend color={STATUS_COLOR.leave} label={t("studentProfile.leave")} />
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "emerald" | "rose" | "amber" | "violet" }) {
  const toneClass: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    violet: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  };
  return (
    <Card className="py-4">
      <CardContent className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className={`inline-flex size-7 items-center justify-center rounded-full ${toneClass[tone]}`}>{icon}</span>
        </div>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block size-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function shortDay(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-GB", { weekday: "short" }).format(new Date(iso));
  } catch {
    return "";
  }
}

function statusValue(s: string): number {
  return s === "present" ? 4 : s === "late" ? 3 : s === "leave" ? 2 : s === "absent" ? 1 : 0;
}

function statusName(v: number, t: (k: string) => string): string {
  if (v === 4) return t("studentProfile.present").slice(0, 3);
  if (v === 3) return t("studentProfile.late").slice(0, 3);
  if (v === 2) return t("studentProfile.leave").slice(0, 3);
  if (v === 1) return t("studentProfile.absent").slice(0, 3);
  return "";
}

function statusLabel(s: string, t: (k: string) => string): string {
  if (s === "present") return t("studentProfile.present");
  if (s === "absent") return t("studentProfile.absent");
  if (s === "late") return t("studentProfile.late");
  if (s === "leave") return t("studentProfile.leave");
  return "—";
}
