"use client";
// Reports > Attendance tab: 7d avg rate + status pie + by-class bar.
import {
  ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { CalendarCheck, UserCheck, UserX, Clock } from "lucide-react";
import { useApp } from "@/store/app-store";
import { KpiCard, ChartCard, EmptyChart } from "./reports-shared";
import {
  PALETTE, STATUS_COLORS, fmtNum, CHART_TOOLTIP_STYLE,
  type AttendanceSummary,
} from "./reports-types";

export function ReportsAttendanceTab({ data }: { data: AttendanceSummary }) {
  const { t } = useApp();

  const statusData = [
    { key: "present", name: t("attendance.present"), value: data.counts.present },
    { key: "late", name: t("attendance.late"), value: data.counts.late },
    { key: "absent", name: t("attendance.absent"), value: data.counts.absent },
    { key: "leave", name: t("attendance.leave"), value: data.counts.leave },
  ]
    .filter((d) => d.value > 0)
    .map((d) => ({
      ...d,
      color: STATUS_COLORS[d.key] ?? PALETTE.slate,
    }));

  const classData = data.byClass.map((c) => ({
    name: c.className,
    rate: c.rate,
    present: c.present,
    total: c.total,
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("reports.attendanceRate")}
          value={`${data.avgRate}%`}
          icon={CalendarCheck}
          tint="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
        />
        <KpiCard
          label={t("attendance.present")}
          value={fmtNum(data.counts.present)}
          icon={UserCheck}
          tint="bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400"
        />
        <KpiCard
          label={t("attendance.absent")}
          value={fmtNum(data.counts.absent)}
          icon={UserX}
          tint="bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
        />
        <KpiCard
          label={t("attendance.late")}
          value={fmtNum(data.counts.late)}
          icon={Clock}
          tint="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("reports.attendanceDist")}>
          {statusData.length === 0 ? (
            <EmptyChart message={t("reports.noData")} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  stroke="none"
                >
                  {statusData.map((s) => (
                    <Cell key={s.key} fill={s.color} />
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

        <ChartCard title={t("reports.attendanceByClass")}>
          {classData.length === 0 ? (
            <EmptyChart message={t("reports.noData")} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" interval={0} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" unit="%" />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(v: number) => [`${v}%`, t("attendance.rate")]}
                  cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                />
                <Bar dataKey="rate" fill={PALETTE.teal} radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
