// Billing Overview Tab — current plan card + usage stats + quick actions
"use client";
import {
  Sparkles, Users, GraduationCap, Boxes, HardDrive, CalendarClock, Crown, TrendingUp,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { BillingData, Plan } from "./types";

type Props = {
  data: BillingData;
  onUpgrade: () => void; // switch to Plans tab
};

const PLAN_GRADIENTS: Record<Plan, string> = {
  trial: "from-slate-600 to-slate-800",
  basic: "from-sky-500 to-cyan-600",
  pro: "from-emerald-500 to-teal-600",
  enterprise: "from-amber-500 to-orange-600",
};

function usagePct(current: number, limit: number): number {
  if (limit <= 0) return 0; // unlimited
  return Math.min(100, Math.round((current / limit) * 100));
}

function fmtDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function BillingOverviewTab({ data, onUpgrade }: Props) {
  const { t, locale, dir } = useApp();
  const plan = data.plan;
  const isTrial = plan === "trial";
  const gradient = PLAN_GRADIENTS[plan];

  const studentsPct = usagePct(data.usage.students, data.limits.students);
  const teachersPct = usagePct(data.usage.teachers, data.limits.teachers);
  const studentsLimit = data.limits.students === -1 ? "∞" : data.limits.students;
  const teachersLimit = data.limits.teachers === -1 ? "∞" : data.limits.teachers;

  const statusBadge = data.status === "active" ? (
    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300">
      {t("billing.activeStatus")}
    </Badge>
  ) : data.status === "suspended" ? (
    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300">
      {t("billing.suspendedStatus")}
    </Badge>
  ) : (
    <Badge variant="destructive">{t("billing.cancelledStatus")}</Badge>
  );

  return (
    <div className="space-y-6">
      {/* Current Plan Card — large gradient */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className={`relative bg-gradient-to-br ${gradient} p-6 text-white sm:p-8`} dir={dir()}>
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            aria-hidden="true"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='white' stroke-width='1'><polygon points='20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14'/></g></svg>\")",
              backgroundSize: "40px 40px",
              backgroundRepeat: "repeat",
            }}
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="size-5" />
                <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  {t("billing.currentPlan")}
                </span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight">
                {t(`billing.${plan}`)}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                {statusBadge}
                <span className="text-xs opacity-80">
                  {t("billing.since", { date: fmtDate(data.memberSince, locale) })}
                </span>
              </div>
            </div>
            {isTrial && data.daysRemaining !== null ? (
              <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm ring-1 ring-white/30">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider opacity-90">
                  <CalendarClock className="size-3.5" />
                  {t("billing.trialEndsIn", { days: data.daysRemaining })}
                </div>
                <div className="mt-1 text-2xl font-bold">
                  {data.daysRemaining} <span className="text-sm font-medium opacity-80">days</span>
                </div>
              </div>
            ) : (
              <Button
                onClick={onUpgrade}
                className="bg-white/95 text-emerald-900 hover:bg-white"
              >
                <TrendingUp className="size-4" /> {t("billing.upgradePlan")}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Usage Stats */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-emerald-600" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("billing.usage")}
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UsageCard
            icon={Users}
            label={t("billing.students")}
            current={data.usage.students}
            limit={studentsLimit}
            pct={studentsPct}
            color="from-emerald-500 to-teal-600"
          />
          <UsageCard
            icon={GraduationCap}
            label={t("billing.teachers")}
            current={data.usage.teachers}
            limit={teachersLimit}
            pct={teachersPct}
            color="from-sky-500 to-cyan-600"
          />
          <UsageCard
            icon={Boxes}
            label={t("billing.modules")}
            current={data.usage.modules}
            color="from-violet-500 to-purple-600"
            showBar={false}
          />
          <UsageCard
            icon={HardDrive}
            label={t("billing.storage")}
            current={data.usage.storage}
            limit={data.limits.storage}
            color="from-amber-500 to-orange-600"
            showBar={false}
            isText
          />
        </div>
      </div>

      {/* Quick action CTA */}
      {plan !== "enterprise" && (
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 dark:border-emerald-900/50 dark:from-emerald-950/20 dark:to-teal-950/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="font-semibold">{t("billing.upgradePlan")}</p>
              <p className="text-sm text-muted-foreground">{t("billing.subtitle")}</p>
            </div>
            <Button
              onClick={onUpgrade}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
            >
              <TrendingUp className="size-4" /> {t("billing.upgrade")}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function UsageCard({
  icon: Icon, label, current, limit, pct, color, showBar = true, isText = false,
}: {
  icon: typeof Users;
  label: string;
  current: number | string;
  limit?: number | string;
  pct?: number;
  color: string;
  showBar?: boolean;
  isText?: boolean;
}) {
  const { t } = useApp();
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className={`grid size-7 place-items-center rounded-md bg-gradient-to-br ${color} text-white`}>
            <Icon className="size-3.5" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight">{current}</span>
          {!isText && limit !== undefined && (
            <>
              <span className="text-sm text-muted-foreground">{t("billing.of")}</span>
              <span className="text-sm font-medium text-muted-foreground">{limit}</span>
            </>
          )}
          {isText && limit !== undefined && (
            <span className="text-sm text-muted-foreground">/ {limit}</span>
          )}
        </div>
        {showBar && pct !== undefined && (
          <Progress value={pct} className="mt-3 h-1.5" />
        )}
      </CardContent>
    </Card>
  );
}
