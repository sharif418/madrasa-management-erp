"use client";
// AttendanceStats — weekly attendance trend chart (recharts area)
// Fetches /api/attendance/stats and renders a 7-day area chart with KPI.
import * as React from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, CheckCircle2 } from "lucide-react";
import { useApp } from "@/store/app-store";

export type StatsPoint = {
  date: string;
  present: number;
  absent: number;
  late: number;
  leave: number;
  rate: number;
};

function dayLabel(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(iso));
  } catch {
    return "";
  }
}

function fullDayLabel(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, { weekday: "long", month: "short", day: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AttendanceStats({ refreshKey }: { refreshKey: number }) {
  const { t, locale } = useApp();
  const [loading, setLoading] = React.useState(true);
  const [series, setSeries] = React.useState<StatsPoint[]>([]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch("/api/attendance/stats", { cache: "no-store" });
        const j = await r.json();
        if (alive && j?.ok) setSeries(j.data.series as StatsPoint[]);
      } catch {
        /* ignore */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [refreshKey]);

  const chartData = series.map((s) => ({
    name: dayLabel(s.date, locale),
    fullName: fullDayLabel(s.date, locale),
    rate: s.rate,
    present: s.present,
    absent: s.absent,
    late: s.late,
    leave: s.leave,
  }));

  const avgRate = series.length
    ? Math.round(series.reduce((a, b) => a + b.rate, 0) / series.length)
    : 0;
  const trendUp = series.length >= 2
    ? series[series.length - 1].rate >= series[0].rate
    : true;
  const bestDay = series.length
    ? series.reduce((a, b) => (b.rate > a.rate ? b : a))
    : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="size-4 text-emerald-600" />
          {t("attendance.statsTitle")}
        </CardTitle>
        {bestDay && (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            ★ {fullDayLabel(bestDay.date, locale)} · {bestDay.rate}%
          </span>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <Skeleton className="h-56 rounded-xl" />
        ) : (
          <>
            {/* KPI strip */}
            <div className="mb-4 flex flex-wrap items-end gap-4">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold leading-none tabular-nums bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {avgRate}%
                </span>
                <div className="pb-0.5">
                  <div className="text-xs text-muted-foreground">{t("attendance.weeklyAvg")}</div>
                  <div className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${trendUp ? "text-emerald-600" : "text-rose-600"}`}>
                    <CheckCircle2 className="size-3" />
                    {trendUp ? "↑" : "↓"} {Math.abs(series.length >= 2 ? series[series.length - 1].rate - series[0].rate : 0)}%
                  </div>
                </div>
              </div>
              <div className="ms-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-block size-2 rounded-full bg-emerald-500" />
                {t("attendance.rate")}
              </div>
            </div>

            {/* Chart */}
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attRateGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    stroke="var(--muted-foreground)"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    stroke="var(--muted-foreground)"
                    unit="%"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12, border: "1px solid var(--border)", fontSize: 12,
                      background: "var(--popover)", color: "var(--popover-foreground)",
                      boxShadow: "0 8px 20px -8px rgba(0,0,0,0.2)",
                    }}
                    labelFormatter={(_, payload) => {
                      const p = payload?.[0]?.payload as { fullName?: string } | undefined;
                      return p?.fullName ?? "";
                    }}
                    formatter={(v: number, n: string) =>
                      n === "rate" ? [`${v}%`, t("attendance.rate")] : [v, n]
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#attRateGrad)"
                    dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: "white" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
