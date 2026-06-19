// Analytics KPI cards — Total Students, Avg Attendance, Hifz Quality, Collection Rate
"use client";
import { Users, CalendarCheck, BookMarked, Banknote } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/card";

export type AnalyticsKpis = {
  totalStudents: number;
  totalTeachers: number;
  avgAttendance: number;
  hifzQuality: number;
  hifzCompletionRate: number;
  collectionRate: number;
  pendingAmount: number;
};

export function AnalyticsKpis({ kpis }: { kpis: AnalyticsKpis }) {
  const { t, dir } = useApp();

  const cards = [
    {
      label: t("analytics.totalStudents"),
      value: kpis.totalStudents.toString(),
      sub: `${kpis.totalTeachers} ${t("communications.staff").toLowerCase()}`,
      icon: Users,
      gradient: "from-violet-500 to-purple-600",
      shadow: "shadow-violet-600/20",
    },
    {
      label: t("analytics.avgAttendance"),
      value: `${kpis.avgAttendance}%`,
      sub: t("analytics.attendanceTrend"),
      icon: CalendarCheck,
      gradient: "from-emerald-500 to-teal-600",
      shadow: "shadow-emerald-600/20",
    },
    {
      label: t("analytics.hifzQuality"),
      value: `${kpis.hifzQuality}/5`,
      sub: `${kpis.hifzCompletionRate}% ${t("analytics.completionRate").toLowerCase()}`,
      icon: BookMarked,
      gradient: "from-amber-500 to-orange-600",
      shadow: "shadow-amber-600/20",
    },
    {
      label: t("analytics.collectionRate"),
      value: `${kpis.collectionRate}%`,
      sub: `${t("analytics.pendingAmount")}: ৳${kpis.pendingAmount.toLocaleString()}`,
      icon: Banknote,
      gradient: "from-rose-500 to-pink-600",
      shadow: "shadow-rose-600/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" dir={dir()}>
      {cards.map((c) => (
        <Card key={c.label} className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">{c.value}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{c.sub}</p>
              </div>
              <div
                className={`grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${c.gradient} text-white shadow-lg ${c.shadow}`}
              >
                <c.icon className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
