"use client";
// Dashboard charts: weekly attendance area, fund distribution pie, fee collection bar.
// Always renders a visible chart — falls back to a flat-zero series with a "No data"
// overlay when the API returns empty arrays.
// Styling (Task 33): subtle grid, 13px foreground axis ticks, custom shadowed tooltips
// with colored dots, capitalized fund legend, data-range subtitle, thicker area stroke
// with hover dots, bar value labels, pie % labels + center total.
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, BarChart, Bar, LabelList,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/store/app-store";

export type DashboardChartData = {
  attendance: { days: { date: string; present: number; total: number; rate: number }[] };
  funds: { total: number; breakdown: { type: string; balance: number }[] };
  feeMonthly: { month: string; amount: number }[];
};

const FUND_COLORS: Record<string, string> = {
  general: "#10b981", lillah: "#f59e0b", waqf: "#8b5cf6", zakat: "#ef4444", sadaqah: "#06b6d4",
};
const FUND_LABELS: Record<string, string> = {
  general: "General", lillah: "Lillah", waqf: "Waqf", zakat: "Zakat", sadaqah: "Sadaqah",
};
const WEEKDAY_SEED = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const AXIS_TICK = { fontSize: 13, fill: "var(--foreground)" };
const TOOLTIP_STYLE: React.CSSProperties = {
  borderRadius: 12, border: "1px solid var(--border)", fontSize: 13,
  background: "var(--popover)", color: "var(--popover-foreground)",
  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)",
  padding: "10px 12px",
};

function dayLabel(iso: string, locale: string) {
  try { return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(iso)); }
  catch { return ""; }
}

function capLabel(key: string) {
  return FUND_LABELS[key] ?? (key ? key.charAt(0).toUpperCase() + key.slice(1) : key);
}

function NoDataOverlay({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
      <div className="rounded-full bg-muted/80 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
        {label}
      </div>
    </div>
  );
}

// Custom tooltip — colored dot + capitalized name + value per entry.
function ChartTooltip({ active, payload, label, suffix = "" }: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string }>;
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={TOOLTIP_STYLE} className="space-y-1.5">
      {label ? <p className="text-xs font-semibold opacity-80">{label}</p> : null}
      {payload.map((p, i) => {
        const key = p.dataKey ?? p.name ?? "";
        const val = typeof p.value === "number" ? p.value.toLocaleString() : String(p.value ?? "");
        return (
          <div key={i} className="flex items-center gap-2 text-[13px]">
            <span aria-hidden className="inline-block size-2.5 shrink-0 rounded-full"
              style={{ background: p.color ?? "var(--muted-foreground)" }} />
            <span className="font-medium">{capLabel(key)}</span>
            <span className="ms-auto tabular-nums opacity-90">{val}{suffix}</span>
          </div>
        );
      })}
    </div>
  );
}

function ChartCard({ title, subtitle, children, isEmpty, emptyLabel }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isEmpty?: boolean;
  emptyLabel?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {subtitle ? <p className="text-xs font-medium text-muted-foreground">{subtitle}</p> : null}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative h-64 w-full rounded-xl bg-muted/30 p-2">
          {children}
          {isEmpty && emptyLabel ? <NoDataOverlay label={emptyLabel} /> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardCharts({ loading, data }: { loading: boolean; data?: DashboardChartData }) {
  const { t, locale } = useApp();

  if (loading || !data) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-80 rounded-xl" />
        ))}
      </div>
    );
  }

  const attEmpty = !data.attendance.days || data.attendance.days.length === 0;
  const attData = attEmpty
    ? WEEKDAY_SEED.map((name) => ({ name, rate: 0, present: 0, total: 0 }))
    : data.attendance.days.map((d) => ({
        name: dayLabel(d.date, locale), rate: d.rate, present: d.present, total: d.total,
      }));

  const fundData = data.funds.breakdown.filter((f) => f.balance > 0).map((f) => ({ name: f.type, value: f.balance }));
  const fundEmpty = fundData.length === 0;
  // For the subtitle, show the API's reported total (matches the stat card).
  const fundTotalDisplay = data.funds.total;
  // For the per-slice percentage calc, use the sum of displayed slices so they
  // add up to ~100% (avoids >100% when some funds have a negative balance).
  const fundSliceSum = fundData.reduce((s, f) => s + f.value, 0);

  const feeEmpty = !data.feeMonthly || data.feeMonthly.length === 0;
  const feeData = feeEmpty
    ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month) => ({ month, amount: 0 }))
    : data.feeMonthly;

  const renderFundLegend = (value: string) => {
    const color = FUND_COLORS[value] ?? "var(--muted-foreground)";
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground">
        <span aria-hidden className="inline-block size-2.5 rounded-full" style={{ background: color }} />
        {capLabel(value)}
      </span>
    );
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ChartCard title={t("dashboard.attendance.week")} subtitle={t("dashboard.last7days")}
        isEmpty={attEmpty} emptyLabel={t("dashboard.noData")}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={attData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.35} />
            <XAxis dataKey="name" tick={AXIS_TICK} stroke="var(--foreground)" tickLine={false} axisLine={{ stroke: "var(--border)" }} />
            <YAxis domain={[0, 100]} tick={AXIS_TICK} stroke="var(--foreground)" unit="%" tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip suffix="%" />} cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "3 3" }} />
            <Area type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={3} fill="url(#attGrad)"
              dot={{ r: 3, fill: "#10b981", strokeWidth: 0, opacity: 0 }}
              activeDot={{ r: 5, fill: "#10b981", stroke: "var(--background)", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t("dashboard.funds.distribution")} subtitle={`${t("dashboard.total")}: ৳${fundTotalDisplay.toLocaleString()}`}
        isEmpty={fundEmpty} emptyLabel={t("dashboard.noData")}>
        {fundEmpty ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={[{ name: t("dashboard.noData"), value: 1 }]} dataKey="value"
                innerRadius={55} outerRadius={85} paddingAngle={0} stroke="none">
                <Cell fill="var(--muted)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={fundData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}
                paddingAngle={2} stroke="none"
                label={(entry) => `${fundSliceSum > 0 ? Math.round((entry.value / fundSliceSum) * 100) : 0}%`}
                labelLine={false}>
                {fundData.map((f) => (
                  <Cell key={f.name} fill={FUND_COLORS[f.name] ?? "#64748b"} />
                ))}
              </Pie>
              <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle"
                className="fill-foreground" style={{ fontSize: 11, fontWeight: 600, opacity: 0.7 }}>
                {t("dashboard.total")}
              </text>
              <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle"
                className="fill-foreground" style={{ fontSize: 16, fontWeight: 700 }}>
                ৳{fundTotalDisplay.toLocaleString()}
              </text>
              <Tooltip content={<ChartTooltip suffix="" />} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 13, paddingTop: 8 }}
                formatter={renderFundLegend} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title={t("dashboard.fee.collection")} subtitle={t("dashboard.last6months")}
        isEmpty={feeEmpty} emptyLabel={t("dashboard.noData")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={feeData} margin={{ top: 18, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.35} vertical={false} />
            <XAxis dataKey="month" tick={AXIS_TICK} stroke="var(--foreground)" tickLine={false} axisLine={{ stroke: "var(--border)" }} />
            <YAxis tick={AXIS_TICK} stroke="var(--foreground)" tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip suffix="" />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
            <Bar dataKey="amount" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={48}>
              <LabelList dataKey="amount" position="top"
                formatter={(v: number) => (v > 0 ? `৳${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}` : "")}
                style={{ fontSize: 11, fontWeight: 600, fill: "var(--foreground)" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
