"use client";
// AttendanceStats — weekly attendance trend chart (recharts line)
// Fetches /api/attendance/stats and renders a 7-day line chart.
import * as React from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
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
    rate: s.rate,
    present: s.present,
    absent: s.absent,
    late: s.late,
    leave: s.leave,
  }));

  const avgRate = series.length
    ? Math.round(series.reduce((a, b) => a + b.rate, 0) / series.length)
    : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="size-4 text-emerald-600" />
          {t("attendance.statsTitle")}
        </CardTitle>
        <div className="text-end">
          <div className="text-2xl font-bold text-emerald-600">{avgRate}%</div>
          <div className="text-xs text-muted-foreground">{t("attendance.rate")}</div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <Skeleton className="h-56 rounded-xl" />
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="attRateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" unit="%" />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12, border: "1px solid var(--border)", fontSize: 12,
                    background: "var(--popover)", color: "var(--popover-foreground)",
                  }}
                  formatter={(v: number, n: string) =>
                    n === "rate" ? [`${v}%`, t("attendance.rate")] : [v, n]
                  }
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
