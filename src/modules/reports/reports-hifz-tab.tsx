"use client";
// Reports > Hifz tab: 30d records + avg quality + type pie + top 5 + paras heatmap.
import {
  ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip,
} from "recharts";
import { BookOpen, Star, Layers, Trophy } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { KpiCard, ChartCard, EmptyChart } from "./reports-shared";
import {
  PALETTE, HIFZ_TYPE_COLORS, fmtNum, CHART_TOOLTIP_STYLE,
  type HifzSummary,
} from "./reports-types";

const HIFZ_TYPE_LABELS: Record<string, string> = {
  sabak: "Sabak",
  sabaq_para: "Sabaq Para",
  dhor: "Dhor",
};

export function ReportsHifzTab({ data }: { data: HifzSummary }) {
  const { t } = useApp();

  const typeData = data.byType.map((b) => ({
    name: HIFZ_TYPE_LABELS[b.type] || b.type,
    value: b.count,
    color: HIFZ_TYPE_COLORS[b.type] ?? PALETTE.slate,
  }));

  // Heatmap color scale based on count
  const maxCount = Math.max(1, ...data.parasDistribution.map((p) => p.count));
  function heatColor(count: number): string {
    if (count === 0) return "bg-muted text-muted-foreground";
    const ratio = count / maxCount;
    if (ratio > 0.75) return "bg-emerald-600 text-white";
    if (ratio > 0.5) return "bg-emerald-500 text-white";
    if (ratio > 0.25) return "bg-emerald-400 text-emerald-950";
    return "bg-emerald-200 text-emerald-900";
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("reports.hifzRecords")}
          value={fmtNum(data.totalRecords)}
          icon={BookOpen}
          tint="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
        />
        <KpiCard
          label={t("reports.avgQuality")}
          value={`${data.avgQuality.toFixed(1)} / 5`}
          icon={Star}
          tint="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
        />
        <KpiCard
          label={t("reports.parasCovered")}
          value={`${data.parasCovered} / 30`}
          icon={Layers}
          tint="bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400"
        />
        <KpiCard
          label={t("reports.hifzByType")}
          value={fmtNum(data.byType.length)}
          icon={Trophy}
          tint="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("reports.hifzByType")}>
          {typeData.length === 0 ? (
            <EmptyChart message={t("reports.noData")} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  stroke="none"
                >
                  {typeData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(v: number) => [fmtNum(v), ""]}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(v) => (
                    <span className="text-muted-foreground">{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Top 5 students */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("reports.topStudents")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {data.topStudents.length === 0 ? (
              <EmptyChart message={t("reports.noData")} />
            ) : (
              <ol className="space-y-2">
                {data.topStudents.map((s, i) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-3 rounded-lg border bg-card/50 p-3"
                  >
                    <span className={`grid size-7 place-items-center rounded-full text-xs font-bold ${
                      i === 0
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate text-sm font-medium">{s.name}</span>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {t("reports.records", { count: s.count })}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Paras covered heatmap — 30 cells (6 cols × 5 rows) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("reports.parasCovered")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-10 md:grid-cols-15">
            {data.parasDistribution.map((p) => (
              <div
                key={p.para}
                className={`flex aspect-square flex-col items-center justify-center rounded-md text-xs font-medium ${heatColor(p.count)}`}
                title={`Para ${p.para}: ${p.count} records`}
              >
                <span className="text-[10px] opacity-70">{p.para}</span>
                <span className="text-sm tabular-nums">{p.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
