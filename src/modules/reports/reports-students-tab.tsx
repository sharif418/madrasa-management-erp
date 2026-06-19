"use client";
// Reports > Students tab: KPI cards + gender pie + class distribution bar.
import {
  ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Users, UserCheck, BookMarked, HeartHandshake } from "lucide-react";
import { useApp } from "@/store/app-store";
import { KpiCard, ChartCard, EmptyChart } from "./reports-shared";
import {
  PALETTE, fmtNum, CHART_TOOLTIP_STYLE, type StudentSummary,
} from "./reports-types";

export function ReportsStudentsTab({ data }: { data: StudentSummary }) {
  const { t } = useApp();

  const genderData = [
    { name: t("reports.male"), value: data.byGender.male, color: PALETTE.teal },
    { name: t("reports.female"), value: data.byGender.female, color: PALETTE.rose },
  ].filter((d) => d.value > 0);

  const classData = data.byClass.map((c) => ({
    name: c.className, count: c.count,
  }));

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("reports.totalStudents")}
          value={fmtNum(data.total)}
          sub={`${data.active} ${t("common.active")} · ${data.inactive} ${t("common.inactive")}`}
          icon={Users}
          tint="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
        />
        <KpiCard
          label={t("reports.activeStudents")}
          value={fmtNum(data.active)}
          sub={`${data.total > 0 ? Math.round((data.active / data.total) * 100) : 0}%`}
          icon={UserCheck}
          tint="bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400"
        />
        <KpiCard
          label={t("reports.hafizStudents")}
          value={fmtNum(data.hafiz)}
          icon={BookMarked}
          tint="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
        />
        <KpiCard
          label={t("reports.zakatEligible")}
          value={fmtNum(data.zakatEligible)}
          icon={HeartHandshake}
          tint="bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("reports.genderDist")}>
          {genderData.length === 0 ? (
            <EmptyChart message={t("reports.noData")} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  stroke="none"
                >
                  {genderData.map((g) => (
                    <Cell key={g.name} fill={g.color} />
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

        <ChartCard title={t("reports.classDist")}>
          {classData.length === 0 ? (
            <EmptyChart message={t("reports.noData")} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" interval={0} />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(v: number) => [fmtNum(v), ""]}
                  cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                />
                <Bar dataKey="count" fill={PALETTE.emerald} radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
