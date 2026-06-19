"use client";
// Reports > Fees tab: 30d collected + total due + pending/paid + by-class bar.
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Banknote, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { useApp } from "@/store/app-store";
import { KpiCard, ChartCard, EmptyChart } from "./reports-shared";
import {
  PALETTE, fmtCurrency, fmtNum, CHART_TOOLTIP_STYLE,
  type FeeSummary,
} from "./reports-types";

export function ReportsFeesTab({ data }: { data: FeeSummary }) {
  const { t } = useApp();

  const classData = data.byClass.map((c) => ({
    name: c.className,
    collected: c.collected,
    due: c.due,
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("reports.feeCollected")}
          value={fmtCurrency(data.feeCollected, true)}
          icon={Banknote}
          tint="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
        />
        <KpiCard
          label={t("reports.feeDue")}
          value={fmtCurrency(data.feeDue, true)}
          icon={AlertCircle}
          tint="bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
        />
        <KpiCard
          label={t("reports.feePending")}
          value={fmtNum(data.pendingCount)}
          icon={Clock}
          tint="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
        />
        <KpiCard
          label={t("reports.feePaid")}
          value={fmtNum(data.paidCount)}
          icon={CheckCircle2}
          tint="bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400"
        />
      </div>

      <ChartCard title={t("reports.feeByClass")}>
        {classData.length === 0 ? (
          <EmptyChart message={t("reports.noData")} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" interval={0} />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(v: number, n: string) => [fmtCurrency(v), n === "collected" ? t("reports.feePaid") : t("reports.feeDue")]}
                cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 12 }}
                formatter={(v) => (
                  <span className="text-muted-foreground">
                    {v === "collected" ? t("reports.feeCollected") : t("reports.feeDue")}
                  </span>
                )}
              />
              <Bar dataKey="collected" stackId="a" fill={PALETTE.emerald} radius={[0, 0, 0, 0]} maxBarSize={48} />
              <Bar dataKey="due" stackId="a" fill={PALETTE.amber} radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
