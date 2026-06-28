"use client";
// Student dashboard — role-aware view for users with the "Student" role.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap, TrendingUp, Wallet, Sparkles, Star, Clock,
  DoorClosed, User, CalendarDays, CalendarCheck, ClipboardList,
  ChevronRight, NotebookPen, Library, BadgeDollarSign, BookOpen,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import type { ViewKey } from "@/store/app-store";
import {
  HijriDate, IslamicStarPattern, GradientStatCard, SectionCard,
  EmptyState, DashboardSkeleton, StarRow,
} from "./dashboard-shared";
import { StudentSections } from "./student-sections";

export type Slot = { id: string; startTime: string; endTime: string; subject: string; room: string | null; teacherName: string; startMinutes: number; endMinutes: number };
export type HifzRec = { id: string; type: string; paraNumber: number; qualityRating: number | null; status: string; recordedAt: string };
export type ExamR = { id: string; subject: string; marks: number; total: number; grade: string | null; remarks: string | null; percentage: number };
export type Fee = { id: string; amount: number; paidAmount: number; status: string; dueDate: string | null; paidDate: string | null; method: string | null };
export type Book = { id: string; title: string; dueDate: string; borrowedAt: string; overdue: boolean };
export type AttDay = { date: string; status: string | null };

export type StudentData = {
  student: { name: string; nameArabic: string | null; rollNo: string | null; className: string; photoUrl: string | null; isHafiz: boolean; admissionDate: string } | null;
  stats: { avgMarks: number; outstandingFees: number; libraryBooks: number; hifzProgressPercent: number } | null;
  todaySchedule: Slot[];
  hifzProgress: { totalRecords: number; avgQuality: number; parasCovered: number; recentRecords: HifzRec[] } | null;
  examResults: ExamR[];
  attendance: { last30d: { present: number; absent: number; late: number; leave: number; rate: number }; last7days: AttDay[] } | null;
  fees: { totalDue: number; totalPaid: number; outstanding: number; pendingCount: number; recentCollections: Fee[] } | null;
  libraryBooks: Book[];
  message?: string;
};

export function StudentDashboard() {
  const { t, locale, user } = useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StudentData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/dashboard/student", { cache: "no-store" });
        const json = await res.json();
        if (!alive) return;
        if (!res.ok || !json.ok) setErr(json.error || `HTTP ${res.status}`);
        else setData(json.data as StudentData);
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : "Network error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <DashboardSkeleton rows={3} />;

  const timeFmt = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" });
  const stats = data?.stats ?? { avgMarks: 0, outstandingFees: 0, libraryBooks: 0, hifzProgressPercent: 0 };
  const displayName = data?.student?.name || user?.name || "Student";

  const quickActions: { label: string; icon: LucideIcon; view: ViewKey; tint: string }[] = [
    { label: "dashboard.viewTimetable", icon: CalendarDays, view: "timetable", tint: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
    { label: "dashboard.payFees", icon: BadgeDollarSign, view: "finance", tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
    { label: "dashboard.viewResults", icon: ClipboardList, view: "exams", tint: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero banner — amber→orange Islamic gradient (students) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -end-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <IslamicStarPattern />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/25 backdrop-blur-sm">
              <Sparkles className="size-3.5" />{t("dashboard.banner.tag")} · {t("dashboard.studentTitle")}
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">{t("dashboard.welcome")}, {displayName.split(" ")[0]} 👋</h1>
            <p className="text-sm text-white/80 sm:text-base">
              {data?.student?.className ?? "—"}{data?.student?.rollNo ? ` · #${data.student.rollNo}` : ""}
              {data?.student?.isHafiz ? (
                <span className="ms-2 inline-flex items-center gap-1 rounded-full bg-amber-300/30 px-2 py-0.5 text-xs font-medium">
                  <Star className="size-3 fill-amber-200 text-amber-200" />{t("dashboard.hafizBadge")}
                </span>
              ) : null}
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

      {data?.message === "no_student_linked" || !data?.student ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
          <span className="grid size-20 place-items-center rounded-full bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-950/40 dark:to-orange-950/40">
            <GraduationCap className="size-10 text-amber-600 dark:text-amber-400" />
          </span>
          <div className="space-y-1">
            <p className="text-lg font-semibold">{t("dashboard.noStudentLinked")}</p>
            <p className="max-w-sm text-sm text-muted-foreground">{t("dashboard.noStudentLinkedDesc")}</p>
          </div>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <GradientStatCard label={t("dashboard.avgMarks")} value={`${stats.avgMarks}%`} icon={TrendingUp} gradient="bg-gradient-to-br from-amber-500 to-orange-600" />
            <GradientStatCard label={t("dashboard.outstandingFees")} value={`৳${stats.outstandingFees.toLocaleString(locale)}`} icon={Wallet} gradient="bg-gradient-to-br from-emerald-500 to-teal-600" />
            <GradientStatCard label={t("dashboard.libraryBooks")} value={stats.libraryBooks} icon={Library} gradient="bg-gradient-to-br from-violet-500 to-purple-600" />
            <GradientStatCard label={t("dashboard.hifzProgress")} value={`${stats.hifzProgressPercent}%`} icon={Star} gradient="bg-gradient-to-br from-rose-500 to-pink-600" />
          </div>

          {/* Quick actions */}
          <div className="rounded-xl border bg-card p-4 md:p-5">
            <h3 className="mb-3 text-sm font-semibold">{t("dashboard.quickActions")}</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {quickActions.map((a) => (
                <Button key={a.label} variant="outline" onClick={() => router.push(`/${a.view}`)}
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

          <StudentSections data={data} locale={locale} t={t} setView={(v) => router.push(`/${v}`)} />
        </>
      )}
    </div>
  );
}

export default StudentDashboard;
