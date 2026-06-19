"use client";
// Dashboard stat cards + quick actions
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GraduationCap, Users, Wallet, BookOpen, UserPlus,
  BadgeDollarSign, CalendarCheck, type LucideIcon,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import type { ViewKey } from "@/store/app-store";

type StatProps = {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  gradient: string;
};

function StatCard({ label, value, sub, icon: Icon, gradient }: StatProps) {
  return (
    <Card className="relative overflow-hidden border-0 p-5 shadow-md shadow-black/5">
      <div className={`absolute inset-0 ${gradient}`} aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/80">{label}</p>
          <p className="mt-1 text-3xl font-bold text-white tabular-nums">{value}</p>
          {sub ? <p className="mt-1 text-xs text-white/70">{sub}</p> : null}
        </div>
        <div className="grid size-12 place-items-center rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
          <Icon className="size-6 text-white" />
        </div>
      </div>
    </Card>
  );
}

type QuickAction = { label: string; icon: LucideIcon; view: ViewKey; tint: string };

const QUICK_ACTIONS: QuickAction[] = [
  { label: "addStudent", icon: UserPlus, view: "students", tint: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
  { label: "recordHifz", icon: BookOpen, view: "hifz", tint: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" },
  { label: "collectFee", icon: BadgeDollarSign, view: "finance", tint: "text-rose-600 bg-rose-50 dark:bg-rose-950/40" },
  { label: "markAttendance", icon: CalendarCheck, view: "attendance", tint: "text-violet-600 bg-violet-50 dark:bg-violet-950/40" },
];

export function DashboardStats({
  loading,
  data,
}: {
  loading: boolean;
  data?: {
    students: { total: number; active: number; hafiz: number };
    teachers: number;
    funds: { total: number };
    hifz30d: number;
  };
}) {
  const { t, setView } = useApp();

  if (loading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const currencyFmt = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("dashboard.stats.students")}
          value={data.students.total}
          sub={`${data.students.active} ${t("common.active")} · ${data.students.hafiz} ḥāfiẓ`}
          icon={GraduationCap}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <StatCard
          label={t("dashboard.stats.teachers")}
          value={data.teachers}
          sub={t("common.active")}
          icon={Users}
          gradient="bg-gradient-to-br from-violet-500 to-purple-600"
        />
        <StatCard
          label={t("dashboard.stats.funds")}
          value={`৳${currencyFmt.format(data.funds.total)}`}
          sub={t("dashboard.funds.distribution")}
          icon={Wallet}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <StatCard
          label={t("dashboard.stats.hifz")}
          value={data.hifz30d}
          sub={t("dashboard.hifz.recent")}
          icon={BookOpen}
          gradient="bg-gradient-to-br from-rose-500 to-pink-600"
        />
      </div>

      <Card className="gap-0 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">{t("dashboard.quickActions")}</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map((a) => (
            <Button
              key={a.label}
              variant="outline"
              onClick={() => setView(a.view)}
              className="h-auto justify-start gap-3 rounded-xl py-3 text-start hover:shadow-md"
            >
              <span className={`grid size-9 place-items-center rounded-lg ${a.tint}`}>
                <a.icon className="size-4" />
              </span>
              <span className="text-sm font-medium">{t(`dashboard.${a.label}`)}</span>
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
