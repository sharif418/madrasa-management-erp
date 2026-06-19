"use client";
// Dashboard charts: weekly attendance area, fund distribution pie, fee collection bar
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

function dayLabel(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(iso));
  } catch {
    return "";
  }
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-64 w-full">{children}</div>
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

  const attData = data.attendance.days.map((d) => ({
    name: dayLabel(d.date, locale),
    rate: d.rate,
    present: d.present,
    total: d.total,
  }));

  const fundData = data.funds.breakdown
    .filter((f) => f.balance > 0)
    .map((f) => ({ name: f.type, value: f.balance }));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ChartCard title={t("dashboard.attendance.week")}>
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

      <ChartCard title={t("dashboard.funds.distribution")}>
        {fundData.length === 0 ? (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            {t("common.none")}
          </div>
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

      <ChartCard title={t("dashboard.fee.collection")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.feeMonthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
