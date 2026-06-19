"use client";
// Dashboard charts: weekly attendance area, fund distribution pie, fee collection bar
// Always renders a visible chart — falls back to a flat-zero series with a "No data"
// overlay when the API returns empty arrays, so users never see a blank canvas.
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/store/app-store";

export type DashboardChartData = {
  attendance: {
    days: { date: string; present: number; total: number; rate: number }[];
  };
  funds: { total: number; breakdown: { type: string; balance: number }[] };
  feeMonthly: { month: string; amount: number }[];
};

const FUND_COLORS: Record<string, string> = {
  general: "#10b981",
  lillah: "#f59e0b",
  waqf: "#8b5cf6",
  zakat: "#ef4444",
  sadaqah: "#06b6d4",
};

const WEEKDAY_SEED = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

function dayLabel(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(iso));
  } catch {
    return "";
  }
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

function ChartCard({
  title,
  children,
  isEmpty,
  emptyLabel,
}: {
  title: string;
  children: React.ReactNode;
  isEmpty?: boolean;
  emptyLabel?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative h-64 w-full">
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

  // Attendance: if no day data, fall back to a flat-zero 7-day series so the area
  // renders as a baseline along the bottom axis rather than an empty void.
  const attEmpty = !data.attendance.days || data.attendance.days.length === 0;
  const attData = attEmpty
    ? WEEKDAY_SEED.map((name) => ({ name, rate: 0, present: 0, total: 0 }))
    : data.attendance.days.map((d) => ({
        name: dayLabel(d.date, locale),
        rate: d.rate,
        present: d.present,
        total: d.total,
      }));

  const fundData = data.funds.breakdown
    .filter((f) => f.balance > 0)
    .map((f) => ({ name: f.type, value: f.balance }));
  const fundEmpty = fundData.length === 0;

  // Fee collection: if no monthly data, show flat-zero bars for 6 months.
  const feeEmpty = !data.feeMonthly || data.feeMonthly.length === 0;
  const feeData = feeEmpty
    ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month) => ({ month, amount: 0 }))
    : data.feeMonthly;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ChartCard title={t("dashboard.attendance.week")} isEmpty={attEmpty} emptyLabel={t("dashboard.noData")}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={attData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" unit="%" />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12, background: "var(--popover)", color: "var(--popover-foreground)" }}
              formatter={(v: number, n: string) => (n === "rate" ? [`${v}%`, t("dashboard.attendance.week")] : [v, n])}
            />
            <Area type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2.5} fill="url(#attGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t("dashboard.funds.distribution")} isEmpty={fundEmpty} emptyLabel={t("dashboard.noData")}>
        {fundEmpty ? (
          // Placeholder donut so the card isn't a blank canvas behind the overlay
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[{ name: t("dashboard.noData"), value: 1 }]}
                dataKey="value"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={0}
                stroke="none"
              >
                <Cell fill="var(--muted)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={fundData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                stroke="none"
              >
                {fundData.map((f) => (
                  <Cell key={f.name} fill={FUND_COLORS[f.name] ?? "#64748b"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12, background: "var(--popover)", color: "var(--popover-foreground)" }}
                formatter={(v: number) => [`৳${v.toLocaleString()}`, ""]}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 12 }}
                formatter={(v) => <span className="capitalize text-muted-foreground">{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title={t("dashboard.fee.collection")} isEmpty={feeEmpty} emptyLabel={t("dashboard.noData")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={feeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
            <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12, background: "var(--popover)", color: "var(--popover-foreground)" }}
              formatter={(v: number) => [`৳${v.toLocaleString()}`, ""]}
              cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            />
            <Bar dataKey="amount" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
