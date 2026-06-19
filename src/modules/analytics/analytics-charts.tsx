// Analytics charts — 2-column grid: enrollment, finance, attendance, hifz
"use client";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { useApp } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MonthPoint = { month: string };
type EnrollmentPoint = MonthPoint & { count: number };
type FinancePoint = MonthPoint & { income: number; expense: number };
type HifzPoint = MonthPoint & { quality: number };
type AttendancePoint = { date: string; label: string; rate: number };

type Props = {
  enrollmentTrend: EnrollmentPoint[];
  financeTrend: FinancePoint[];
  attendanceTrend: AttendancePoint[];
  hifzPerformance: HifzPoint[];
};

const AXIS_TICK = { fontSize: 12, fill: "var(--foreground)" };

function ChartTooltip({ active, payload, label, suffix = "" }: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-xs shadow-md">
      {label ? <p className="mb-1 font-semibold">{label}</p> : null}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize">{p.name}</span>
          <span className="ms-auto tabular-nums font-medium">
            {typeof p.value === "number" ? p.value.toLocaleString() : String(p.value ?? "")}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full rounded-xl bg-muted/30 p-2">{children}</div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsCharts({ enrollmentTrend, financeTrend, attendanceTrend, hifzPerformance }: Props) {
  const { t, dir } = useApp();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" dir={dir()}>
      {/* Enrollment trend — line chart */}
      <ChartCard title={t("analytics.enrollmentTrend")}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={enrollmentTrend} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.35} />
            <XAxis dataKey="month" tick={AXIS_TICK} stroke="var(--foreground)" tickLine={false} axisLine={{ stroke: "var(--border)" }} />
            <YAxis tick={AXIS_TICK} stroke="var(--foreground)" tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3}
              dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#8b5cf6", stroke: "var(--background)", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Finance trend — income vs expense bar chart */}
      <ChartCard title={t("analytics.financeTrend")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={financeTrend} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.35} vertical={false} />
            <XAxis dataKey="month" tick={AXIS_TICK} stroke="var(--foreground)" tickLine={false} axisLine={{ stroke: "var(--border)" }} />
            <YAxis tick={AXIS_TICK} stroke="var(--foreground)" tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
            <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={28} />
            <Bar dataKey="expense" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Attendance trend — 30-day area chart */}
      <ChartCard title={t("analytics.attendanceTrend")}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={attendanceTrend} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.35} />
            <XAxis dataKey="label" tick={AXIS_TICK} stroke="var(--foreground)" tickLine={false} axisLine={{ stroke: "var(--border)" }} minTickGap={20} />
            <YAxis domain={[0, 100]} tick={AXIS_TICK} stroke="var(--foreground)" tickLine={false} axisLine={false} unit="%" />
            <Tooltip content={<ChartTooltip suffix="%" />} />
            <Area type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} fill="url(#attGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Hifz performance — quality line chart */}
      <ChartCard title={t("analytics.hifzPerformance")}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={hifzPerformance} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.35} />
            <XAxis dataKey="month" tick={AXIS_TICK} stroke="var(--foreground)" tickLine={false} axisLine={{ stroke: "var(--border)" }} />
            <YAxis domain={[0, 5]} tick={AXIS_TICK} stroke="var(--foreground)" tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip suffix="/5" />} />
            <Line
              type="monotone" dataKey="quality" stroke="#f59e0b" strokeWidth={3}
              dot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#f59e0b", stroke: "var(--background)", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
