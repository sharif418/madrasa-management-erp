"use client";
// Parent dashboard — role-aware view for users with the "Parent" role.
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Users, TrendingUp, Wallet, Sparkles, Star, Heart, BookOpen,
  CalendarCheck, BadgeDollarSign, ChevronRight, Award, UserCircle2,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import type { ViewKey } from "@/store/app-store";
import {
  HijriDate, IslamicStarPattern, GradientStatCard, SectionCard,
  EmptyState, DashboardSkeleton, StarRow,
} from "./dashboard-shared";

type ExamResult = { subject: string; marks: number; total: number; grade: string | null; percentage: number };
type Child = {
  id: string; name: string; nameArabic: string | null; rollNo: string | null; photoUrl: string | null;
  isHafiz: boolean; className: string;
  hifzProgress: { totalRecords: number; avgQuality: number; parasCovered: number };
  attendanceRate: number;
  feeStatus: { totalDue: number; totalPaid: number; outstanding: number; pendingCount: number };
  recentResults: ExamResult[];
};
type ParentData = {
  children: Child[];
  stats: { totalChildren: number; avgPerformance: number; totalOutstandingFees: number };
};

const GRADE_TINT: Record<string, string> = {
  "A+": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  A: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  "A-": "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
  B: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  C: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  D: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  F: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
};

function gradeTint(g: string | null): string {
  return (g && GRADE_TINT[g.toUpperCase()]) || "bg-muted text-muted-foreground";
}

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";
}

function ChildCard({ child, locale, t, setView }: { child: Child; locale: string; t: (k: string) => string; setView: (v: ViewKey) => void }) {
  const paid = child.feeStatus.outstanding <= 0;
  const attendanceTint = child.attendanceRate >= 80 ? "text-emerald-600" : child.attendanceRate >= 50 ? "text-amber-600" : "text-rose-600";
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      {/* Header strip with avatar */}
      <div className="relative bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 p-5 text-white">
        <div className="absolute -end-6 -top-6 size-24 rounded-full bg-white/10 blur-xl" aria-hidden="true" />
        <div className="relative flex items-center gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-full bg-white/20 text-lg font-bold ring-2 ring-white/40 backdrop-blur-sm">
            {initials(child.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-lg font-bold">{child.name}</p>
              {child.isHafiz ? (
                <Badge className="shrink-0 border-0 bg-amber-300/90 text-amber-900">
                  <Star className="size-3 fill-amber-900" />{t("dashboard.hafizBadge")}
                </Badge>
              ) : null}
            </div>
            {child.nameArabic ? <p className="truncate text-sm text-white/80" dir="rtl">{child.nameArabic}</p> : null}
            <p className="mt-0.5 text-xs text-white/70">{child.className}{child.rollNo ? ` · #${child.rollNo}` : ""}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {/* Hifz progress */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 font-medium text-muted-foreground"><BookOpen className="size-3.5" />{t("dashboard.hifzProgress")}</span>
            <span className="font-semibold text-foreground">{t("dashboard.parasCovered", { count: child.hifzProgress.parasCovered })}</span>
          </div>
          <Progress value={(child.hifzProgress.parasCovered / 30) * 100} className="h-2 bg-rose-100 dark:bg-rose-950/40 [&>*]:bg-gradient-to-r [&>*]:from-rose-500 [&>*]:to-pink-500" />
          {child.hifzProgress.totalRecords > 0 ? (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <StarRow value={Math.round(child.hifzProgress.avgQuality)} />
              {child.hifzProgress.totalRecords} records
            </p>
          ) : null}
        </div>

        {/* Attendance + Fees row */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setView("attendance")} className="rounded-xl border bg-card/50 p-3 text-start transition-colors hover:bg-accent/50">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"><CalendarCheck className="size-3.5" />{t("dashboard.attendanceRate")}</span>
            </div>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${attendanceTint}`}>{child.attendanceRate}%</p>
            <p className="text-xs text-muted-foreground">last 30 days</p>
          </button>
          <button onClick={() => setView("finance")} className="rounded-xl border bg-card/50 p-3 text-start transition-colors hover:bg-accent/50">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"><Wallet className="size-3.5" />{t("dashboard.outstandingFees")}</span>
            </div>
            {paid ? (
              <Badge className="mt-1 border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{t("dashboard.paid")}</Badge>
            ) : (
              <>
                <p className="mt-1 text-2xl font-bold tabular-nums text-rose-600">৳{child.feeStatus.outstanding.toLocaleString(locale)}</p>
                <p className="text-xs text-muted-foreground">{child.feeStatus.pendingCount} pending</p>
              </>
            )}
          </button>
        </div>

        {/* Recent exam results */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">{t("dashboard.recentResults")}</p>
          {child.recentResults.length === 0 ? (
            <p className="rounded-lg border border-dashed bg-muted/30 py-3 text-center text-xs text-muted-foreground">{t("dashboard.noResults")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {child.recentResults.map((r, i) => (
                <div key={i} className="inline-flex items-center gap-2 rounded-lg border bg-card/50 px-3 py-1.5">
                  <span className="text-xs font-medium">{r.subject}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{r.marks}/{r.total}</span>
                  {r.grade ? <Badge variant="outline" className={`shrink-0 ${gradeTint(r.grade)}`}>{r.grade}</Badge> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ParentDashboard() {
  const { t, locale, user, setView } = useApp() as { t: (key: string, params?: Record<string, string | number>) => string; locale: string; user: { userId: string; tenantId: string; name: string; phone: string; roles: string[] } | null; setView: (v: ViewKey) => void };
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ParentData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/dashboard/parent", { cache: "no-store" });
        const json = await res.json();
        if (!alive) return;
        if (!res.ok || !json.ok) setErr(json.error || `HTTP ${res.status}`);
        else setData(json.data as ParentData);
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : "Network error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <DashboardSkeleton rows={2} />;
  const timeFmt = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" });
  const stats = data?.stats ?? { totalChildren: 0, avgPerformance: 0, totalOutstandingFees: 0 };
  const displayName = user?.name || "Wali";

  const quickActions: { label: string; icon: typeof Heart; view: ViewKey; tint: string }[] = [
    { label: "dashboard.viewChild", icon: UserCircle2, view: "students", tint: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" },
    { label: "dashboard.payFees", icon: BadgeDollarSign, view: "finance", tint: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
    { label: "dashboard.viewAttendance", icon: CalendarCheck, view: "attendance", tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero banner — rose→pink Islamic gradient (parents) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -end-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <IslamicStarPattern />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/25 backdrop-blur-sm">
              <Heart className="size-3.5" />{t("dashboard.banner.tag")} · {t("dashboard.parentTitle")}
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">{t("dashboard.welcome")}, {displayName.split(" ")[0]} 👋</h1>
            <p className="text-sm text-white/80 sm:text-base">Barakallahu feekum — may Allah bless your children.</p>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <HijriDate locale={locale} />
            <span className="text-xs text-white/60">{timeFmt.format(new Date())}</span>
          </div>
        </div>
      </div>

      {err ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">⚠️ {err}</div>
      ) : null}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <GradientStatCard label={t("dashboard.myChildren")} value={stats.totalChildren} icon={Users} gradient="bg-gradient-to-br from-rose-500 to-pink-600" />
        <GradientStatCard label={t("dashboard.avgPerformance")} value={`${stats.avgPerformance}%`} sub={t("dashboard.recentResults")} icon={TrendingUp} gradient="bg-gradient-to-br from-emerald-500 to-teal-600" />
        <GradientStatCard label={t("dashboard.outstandingFees")} value={`৳${stats.totalOutstandingFees.toLocaleString(locale)}`} icon={Wallet} gradient="bg-gradient-to-br from-amber-500 to-orange-600" />
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border bg-card p-4 md:p-5">
        <h3 className="mb-3 text-sm font-semibold">{t("dashboard.quickActions")}</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {quickActions.map((a) => (
            <Button key={a.label} variant="outline" onClick={() => setView(a.view)}
              className="group h-auto justify-start gap-3 rounded-xl py-3 text-start transition-all hover:shadow-md hover:-translate-y-0.5">
              <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${a.tint} transition-transform group-hover:scale-110`}>
                <a.icon className="size-4" />
              </span>
              <span className="flex flex-1 items-center justify-between gap-1 text-sm font-medium">
                {t(a.label)}
                <ChevronRight className="size-3.5 shrink-0 opacity-40 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Children cards */}
      <SectionCard title={t("dashboard.myChildren")} icon={Award} iconTint="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
        {!data || data.children.length === 0 ? (
          <EmptyState icon={Users} title={t("dashboard.noChildren")} desc={t("dashboard.noChildrenDesc")} />
        ) : (
          <ScrollArea className="max-h-[40rem] pe-3">
            <div className="grid gap-4 lg:grid-cols-2">
              {data.children.map((c) => <ChildCard key={c.id} child={c} locale={locale} t={t} setView={setView} />)}
            </div>
          </ScrollArea>
        )}
      </SectionCard>
    </div>
  );
}
