"use client";
// Dashboard stat cards + quick actions
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GraduationCap, Users, Wallet, BookOpen, UserPlus,
  BadgeDollarSign, CalendarCheck, ChevronRight, type LucideIcon,
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
    <Card className="group relative h-full overflow-hidden border-0 p-5 shadow-md shadow-black/5 transition-shadow hover:shadow-lg hover:-translate-y-0.5 transition-transform">
      <div className={`absolute inset-0 ${gradient}`} aria-hidden="true" />
      {/* Decorative diagonal sheen */}
      <div
        className="pointer-events-none absolute -end-8 -top-8 size-24 rounded-full bg-white/10 transition-transform group-hover:scale-125"
        aria-hidden="true"
      />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white/80">{label}</p>
            <p className="mt-1 text-3xl font-bold text-white tabular-nums">{value}</p>
          </div>
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30 transition-transform group-hover:scale-105">
            <Icon className="size-6 text-white" />
          </div>
        </div>
        {sub ? <p className="mt-auto pt-3 text-xs text-white/70">{sub}</p> : null}
      </div>
    </Card>
  );
}

type QuickAction = { label: string; icon: LucideIcon; view: ViewKey; tint: string };

const QUICK_ACTIONS: QuickAction[] = [
  { label: "addStudent", icon: UserPlus, view: "students", tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
  { label: "recordHifz", icon: BookOpen, view: "hifz", tint: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  { label: "collectFee", icon: BadgeDollarSign, view: "finance", tint: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" },
  { label: "markAttendance", icon: CalendarCheck, view: "attendance", tint: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" },
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
          <Skeleton key={i} className="h-32 rounded-xl" />
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

      <Card className="gap-0 p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("dashboard.quickActions")}</h3>
            <p className="text-xs text-muted-foreground">{t("dashboard.quickActions.desc")}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map((a) => (
            <Button
              key={a.label}
              variant="outline"
              onClick={() => setView(a.view)}
              className="group h-auto justify-start gap-3 rounded-xl py-3 text-start transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${a.tint} transition-transform group-hover:scale-110`}>
                <a.icon className="size-4" />
              </span>
              <span className="flex flex-1 items-center justify-between gap-1 text-sm font-medium">
                {t(`dashboard.${a.label}`)}
                <ChevronRight className="size-3.5 shrink-0 opacity-40 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
              </span>
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
