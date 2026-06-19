"use client";
// Teacher dashboard — role-aware view for users with the "Teacher" role.
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen, GraduationCap, CalendarClock, Sparkles, CalendarDays,
  Clock, DoorClosed, Users, ClipboardList, Star, ChevronRight,
  NotebookPen, FileBarChart, type LucideIcon,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import type { ViewKey } from "@/store/app-store";
import {
  HijriDate, IslamicStarPattern, GradientStatCard, SectionCard,
  EmptyState, DashboardSkeleton, StarRow,
} from "./dashboard-shared";

type Slot = {
  id: string; startTime: string; endTime: string; subject: string;
  room: string | null; className: string; startMinutes: number; endMinutes: number;
};
type MyClass = { id: string; name: string; code: string | null; level: number; capacity: number; curriculum: string; studentCount: number };
type HifzLog = { id: string; studentName: string; type: string; paraNumber: number; qualityRating: number | null; recordedAt: string };
type Exam = { id: string; name: string; term: string | null; startDate: string | null; endDate: string | null; className: string };

type TeacherData = {
  teacher: { name: string; nameArabic: string | null; designation: string | null; specialization: string | null; photoUrl: string | null } | null;
  myClasses: MyClass[];
  todaySchedule: Slot[];
  recentHifz: HifzLog[];
  myExams: Exam[];
  stats: { totalClasses: number; totalStudents: number; todayClasses: number; hifzStudents: number };
};

const HIFZ_TINT: Record<string, string> = {
  sabak: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  sabaq_para: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  dhor: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
};

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(t); }, []);
  return now;
}

function ScheduleTimeline({ slots, locale, t }: { slots: Slot[]; locale: string; t: (k: string) => string }) {
  const now = useNow();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const timeFmt = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" });
  if (slots.length === 0) {
    return <EmptyState icon={CalendarDays} title={t("dashboard.noSchedule")} desc={t("dashboard.noScheduleDesc")} />;
  }
  return (
    <ScrollArea className="max-h-96 pe-3">
      <ol className="relative space-y-3 ps-6">
        <span className="absolute inset-y-1 start-2 w-px bg-gradient-to-b from-emerald-500 via-teal-500 to-cyan-500" aria-hidden="true" />
        {slots.map((s) => {
          const isLive = nowMin >= s.startMinutes && nowMin < s.endMinutes;
          const isPast = nowMin >= s.endMinutes;
          return (
            <li key={s.id} className="relative">
              <span
                className={`absolute -start-[1.35rem] top-3.5 size-3 rounded-full ring-4 ring-background ${
                  isLive ? "bg-emerald-500 animate-pulse" : isPast ? "bg-muted-foreground/40" : "bg-teal-500"
                }`}
                aria-hidden="true"
              />
              <div
                className={`rounded-xl border p-3 transition-colors ${
                  isLive ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30" : "bg-card/50 hover:bg-accent/50"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{s.subject}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Clock className="size-3" />{s.startTime}–{s.endTime}</span>
                      <span className="mx-1.5">·</span>
                      <span className="inline-flex items-center gap-1"><BookOpen className="size-3" />{s.className}</span>
                      {s.room ? (
                        <>
                          <span className="mx-1.5">·</span>
                          <span className="inline-flex items-center gap-1"><DoorClosed className="size-3" />{s.room}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 ${
                      isLive ? "border-emerald-300 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : isPast ? "bg-muted text-muted-foreground"
                      : "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                    }`}
                  >
                    {isLive ? <><span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />{t("dashboard.live")}</>
                      : isPast ? t("dashboard.past") : t("dashboard.upcoming")}
                  </Badge>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </ScrollArea>
  );
}

function QuickActions({ t, setView }: { t: (k: string) => string; setView: (v: ViewKey) => void }) {
  const actions: { label: string; icon: LucideIcon; view: ViewKey; tint: string }[] = [
    { label: "dashboard.logHifz", icon: NotebookPen, view: "hifz", tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
    { label: "dashboard.enterResults", icon: FileBarChart, view: "exams", tint: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" },
    { label: "students.title", icon: GraduationCap, view: "students", tint: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
    { label: "nav.timetable", icon: CalendarClock, view: "timetable", tint: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {actions.map((a) => (
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
  );
}

export function TeacherDashboard() {
  const { t, locale, user, setView } = useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TeacherData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/dashboard/teacher", { cache: "no-store" });
        const json = await res.json();
        if (!alive) return;
        if (!res.ok || !json.ok) setErr(json.error || `HTTP ${res.status}`);
        else setData(json.data as TeacherData);
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
  const dateFmt = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });
  const stats = data?.stats ?? { totalClasses: 0, totalStudents: 0, todayClasses: 0, hifzStudents: 0 };
  const displayName = data?.teacher?.name || user?.name || "Ustadh";

  return (
    <div className="space-y-6">
      {/* Hero banner — emerald→teal Islamic gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -end-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <IslamicStarPattern />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/25 backdrop-blur-sm">
              <Sparkles className="size-3.5" />
              {t("dashboard.banner.tag")} · {t("dashboard.teacherTitle")}
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">{t("dashboard.welcome")}, {displayName.split(" ")[0]} 👋</h1>
            <p className="text-sm text-white/80 sm:text-base">
              {data?.teacher?.designation ? <span className="capitalize">{data.teacher.designation}</span> : null}
              {data?.teacher?.specialization ? <span> · {data.teacher.specialization}</span> : null}
            </p>
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <GradientStatCard label={t("dashboard.myClasses")} value={stats.totalClasses} icon={BookOpen} gradient="bg-gradient-to-br from-emerald-500 to-teal-600" />
        <GradientStatCard label={t("dashboard.myStudents")} value={stats.totalStudents} icon={GraduationCap} gradient="bg-gradient-to-br from-amber-500 to-orange-600" />
        <GradientStatCard label={t("dashboard.todayClasses")} value={stats.todayClasses} icon={CalendarClock} gradient="bg-gradient-to-br from-violet-500 to-purple-600" />
        <GradientStatCard label={t("dashboard.hifzStudents")} value={stats.hifzStudents} icon={Star} gradient="bg-gradient-to-br from-rose-500 to-pink-600" />
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border bg-card p-4 md:p-5">
        <h3 className="mb-3 text-sm font-semibold">{t("dashboard.quickActions")}</h3>
        <QuickActions t={t} setView={setView} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Today's schedule */}
        <SectionCard title={t("dashboard.todaySchedule")} icon={CalendarClock} iconTint="bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
          <ScheduleTimeline slots={data?.todaySchedule ?? []} locale={locale} t={t} />
        </SectionCard>

        {/* Recent hifz logs */}
        <SectionCard title={t("dashboard.recentHifz")} icon={Star} iconTint="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          {!data || data.recentHifz.length === 0 ? (
            <EmptyState icon={NotebookPen} title={t("dashboard.noHifz")} desc={t("dashboard.noHifzDesc")} />
          ) : (
            <ScrollArea className="max-h-96 pe-3">
              <ul className="space-y-2">
                {data.recentHifz.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card/50 p-3 transition-colors hover:bg-accent/50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.studentName}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{dateFmt.format(new Date(r.recordedAt))} · {timeFmt.format(new Date(r.recordedAt))} · Para {r.paraNumber}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline" className={HIFZ_TINT[r.type] ?? ""}>
                        <span className="capitalize">{r.type.replace("_", " ")}</span>
                      </Badge>
                      <StarRow value={r.qualityRating} />
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </SectionCard>

        {/* My classes */}
        <SectionCard title={t("dashboard.myClasses")} icon={BookOpen} iconTint="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          action={<Button variant="ghost" size="sm" onClick={() => setView("academic")} className="text-xs">{t("common.view")}<ChevronRight className="size-3.5 rtl:rotate-180" /></Button>}>
          {!data || data.myClasses.length === 0 ? (
            <EmptyState icon={BookOpen} title={t("dashboard.noClasses")} desc={t("dashboard.noClassesDesc")} />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {data.myClasses.map((c) => {
                const pct = c.capacity > 0 ? Math.min(100, Math.round((c.studentCount / c.capacity) * 100)) : 0;
                return (
                  <button key={c.id} onClick={() => setView("academic")} className="group rounded-xl border bg-card/50 p-3 text-start transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{c.name}</p>
                      <Badge variant="outline" className="shrink-0 capitalize">{c.curriculum}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Level {c.level} · {c.code ?? "—"}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Users className="size-3" />{c.studentCount}/{c.capacity}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Upcoming exams */}
        <SectionCard title={t("dashboard.upcomingExams")} icon={ClipboardList} iconTint="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
          action={<Button variant="ghost" size="sm" onClick={() => setView("exams")} className="text-xs">{t("common.view")}<ChevronRight className="size-3.5 rtl:rotate-180" /></Button>}>
          {!data || data.myExams.length === 0 ? (
            <EmptyState icon={ClipboardList} title={t("dashboard.noExams")} />
          ) : (
            <ul className="space-y-2">
              {data.myExams.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card/50 p-3 transition-colors hover:bg-accent/50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{e.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{e.className}{e.term ? <span className="capitalize"> · {e.term}</span> : null}</p>
                  </div>
                  {e.startDate ? (
                    <Badge variant="outline" className="shrink-0 bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                      <CalendarDays className="size-3" />{dateFmt.format(new Date(e.startDate))}
                    </Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
