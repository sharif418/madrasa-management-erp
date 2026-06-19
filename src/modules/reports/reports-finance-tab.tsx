"use client";
// Reports > Finance tab: income/expense KPI + fund type pie + top expenses bar.
import {
  ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, Scale } from "lucide-react";
import { useApp } from "@/store/app-store";
import { KpiCard, ChartCard, EmptyChart } from "./reports-shared";
import {
  PALETTE, FUND_COLORS, fmtCurrency, fmtNum, CHART_TOOLTIP_STYLE,
  type FinanceSummary,
} from "./reports-types";

export function ReportsFinanceTab({ data }: { data: FinanceSummary }) {
  const { t } = useApp();

  const fundData = data.byFundType.map((f) => ({
    name: f.type, value: f.amount, color: FUND_COLORS[f.type] ?? PALETTE.slate,
  }));

  const expenseData = data.topExpenses.map((e) => ({
    name: e.category, amount: e.amount,
  }));

  const isPositive = data.net >= 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("reports.totalIncome")}
          value={fmtCurrency(data.totalIncome, true)}
          icon={TrendingUp}
          tint="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
        />
        <KpiCard
          label={t("reports.totalExpense")}
          value={fmtCurrency(data.totalExpense, true)}
          icon={TrendingDown}
          tint="bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
        />
        <KpiCard
          label={t("reports.netIncome")}
          value={fmtCurrency(data.net, true)}
          sub={isPositive ? "▲" : "▼"}
          icon={Scale}
          tint={isPositive
            ? "bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400"
            : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"}
        />
        <KpiCard
          label={t("reports.fundDist")}
          value={fmtNum(data.byFundType.length)}
          icon={Wallet}
          tint="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("reports.fundDist")}>
          {fundData.length === 0 ? (
            <EmptyChart message={t("reports.noData")} />
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
                    <Cell key={f.name} fill={f.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(v: number) => [fmtCurrency(v), ""]}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(v) => (
                    <span className="capitalize text-muted-foreground">{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title={t("reports.topExpenses")}>
          {expenseData.length === 0 ? (
            <EmptyChart message={t("reports.noData")} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseData} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                  width={90}
                  formatter={(v: string) => v.length > 12 ? v.slice(0, 12) + "…" : v}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(v: number) => [fmtCurrency(v), ""]}
                  cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                />
                <Bar dataKey="amount" fill={PALETTE.rose} radius={[0, 6, 6, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
