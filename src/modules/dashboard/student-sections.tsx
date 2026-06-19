"use client";
// Student dashboard sub-sections — extracted to keep main dashboard under 300 lines.
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Star, Clock, DoorClosed, User, CalendarDays, CalendarCheck,
  ClipboardList, ChevronRight, NotebookPen, Library, Wallet, BookOpen,
} from "lucide-react";
import type { useApp, ViewKey } from "@/store/app-store";
import { SectionCard, EmptyState, StarRow } from "./dashboard-shared";
import type { StudentData, Slot } from "./student-dashboard";

type T = ReturnType<typeof useApp>["t"];

const GRADE_TINT: Record<string, string> = {
  "A+": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  A: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  "A-": "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
  B: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  C: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  D: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  F: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
};
const HIFZ_TINT: Record<string, string> = {
  sabak: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  sabaq_para: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  dhor: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
};
const ATT_TINT: Record<string, string> = {
  present: "bg-emerald-500", absent: "bg-rose-500", late: "bg-amber-500", leave: "bg-sky-500",
};
const FEE_STATUS_TINT: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  overdue: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  partial: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
};

function gradeTint(g: string | null) {
  return (g && GRADE_TINT[g.toUpperCase()]) || "bg-muted text-muted-foreground";
}

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(t); }, []);
  return now;
}

function ScheduleTimeline({ slots, locale, t }: { slots: Slot[]; locale: string; t: T }) {
  const now = useNow();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (slots.length === 0) {
    return <EmptyState icon={CalendarDays} title={t("dashboard.noSchedule")} desc={t("dashboard.noScheduleDesc")} />;
  }
  return (
    <ScrollArea className="max-h-96 pe-3">
      <ol className="relative space-y-3 ps-6">
        <span className="absolute inset-y-1 start-2 w-px bg-gradient-to-b from-amber-500 via-orange-500 to-rose-500" aria-hidden="true" />
        {slots.map((s) => {
          const isLive = nowMin >= s.startMinutes && nowMin < s.endMinutes;
          const isPast = nowMin >= s.endMinutes;
          return (
            <li key={s.id} className="relative">
              <span className={`absolute -start-[1.35rem] top-3.5 size-3 rounded-full ring-4 ring-background ${
                isLive ? "bg-amber-500 animate-pulse" : isPast ? "bg-muted-foreground/40" : "bg-orange-500"
              }`} aria-hidden="true" />
              <div className={`rounded-xl border p-3 transition-colors ${
                isLive ? "border-amber-300 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/30" : "bg-card/50 hover:bg-accent/50"
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{s.subject}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Clock className="size-3" />{s.startTime}–{s.endTime}</span>
                      <span className="mx-1.5">·</span>
                      <span className="inline-flex items-center gap-1"><User className="size-3" />{s.teacherName}</span>
                      {s.room ? <><span className="mx-1.5">·</span><span className="inline-flex items-center gap-1"><DoorClosed className="size-3" />{s.room}</span></> : null}
                    </p>
                  </div>
                  <Badge variant="outline" className={`shrink-0 ${
                    isLive ? "border-amber-300 bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                    : isPast ? "bg-muted text-muted-foreground"
                    : "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
                  }`}>
                    {isLive ? <><span className="size-1.5 animate-pulse rounded-full bg-amber-500" />{t("dashboard.live")}</>
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

export function StudentSections({ data, locale, t, setView }: { data: StudentData; locale: string; t: T; setView: (v: ViewKey) => void }) {
  const dateFmt = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });
  const timeFmt = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" });
  const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
  const fees = data.fees;
  const paid = fees ? fees.outstanding <= 0 : false;
  const att = data.attendance;
  const hifz = data.hifzProgress;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Today's Classes */}
      <SectionCard title={t("dashboard.todaySchedule")} icon={CalendarDays} iconTint="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
        action={<Button variant="ghost" size="sm" onClick={() => setView("timetable")} className="text-xs">{t("common.view")}<ChevronRight className="size-3.5 rtl:rotate-180" /></Button>}>
        <ScheduleTimeline slots={data.todaySchedule} locale={locale} t={t} />
      </SectionCard>

      {/* Hifz Journey */}
      <SectionCard title={t("dashboard.hifzJourney")} icon={Star} iconTint="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
        {!hifz || hifz.totalRecords === 0 ? (
          <EmptyState icon={NotebookPen} title={t("dashboard.noHifz")} desc={t("dashboard.noHifzDesc")} />
        ) : (
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 font-medium text-muted-foreground"><BookOpen className="size-3.5" />{t("dashboard.hifzProgress")}</span>
                <span className="font-semibold text-foreground">{t("dashboard.parasCovered", { count: hifz.parasCovered })}</span>
              </div>
              <Progress value={(hifz.parasCovered / 30) * 100} className="h-2 bg-rose-100 dark:bg-rose-950/40 [&>*]:bg-gradient-to-r [&>*]:from-amber-500 [&>*]:to-rose-500" />
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <StarRow value={Math.round(hifz.avgQuality)} />{hifz.totalRecords} records · avg {hifz.avgQuality}/5
              </p>
            </div>
            <ScrollArea className="max-h-60 pe-3">
              <ul className="space-y-2">
                {hifz.recentRecords.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card/50 p-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium capitalize">{r.type.replace("_", " ")} · Para {r.paraNumber}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{dateFmt.format(new Date(r.recordedAt))} · {timeFmt.format(new Date(r.recordedAt))}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline" className={`capitalize ${HIFZ_TINT[r.type] ?? ""}`}>{r.status}</Badge>
                      <StarRow value={r.qualityRating} />
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        )}
      </SectionCard>

      {/* Exam Results */}
      <SectionCard title={t("dashboard.examResults")} icon={ClipboardList} iconTint="bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
        action={<Button variant="ghost" size="sm" onClick={() => setView("exams")} className="text-xs">{t("common.view")}<ChevronRight className="size-3.5 rtl:rotate-180" /></Button>}>
        {data.examResults.length === 0 ? (
          <EmptyState icon={ClipboardList} title={t("dashboard.noResults")} />
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-start font-medium">Subject</th>
                  <th className="px-3 py-2 text-end font-medium">Marks</th>
                  <th className="px-3 py-2 text-center font-medium">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.examResults.map((r) => (
                  <tr key={r.id} className="bg-card/50">
                    <td className="px-3 py-2 font-medium">{r.subject}</td>
                    <td className="px-3 py-2 text-end tabular-nums">{r.marks}/{r.total}</td>
                    <td className="px-3 py-2 text-center">
                      {r.grade ? <Badge variant="outline" className={gradeTint(r.grade)}>{r.grade}</Badge> : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* 7-Day Attendance */}
      <SectionCard title={t("dashboard.attendance7d")} icon={CalendarCheck} iconTint="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        {!att ? (
          <EmptyState icon={CalendarCheck} title={t("dashboard.noData")} />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="grid flex-1 grid-cols-7 gap-2">
                {att.last7days.map((d, i) => {
                  const dot = d.status ? ATT_TINT[d.status] ?? "bg-muted" : "bg-muted/30";
                  return (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">{weekdayFmt.format(new Date(d.date))}</span>
                      <span className={`size-7 rounded-full ${dot} ${d.status === "present" ? "ring-2 ring-emerald-200 dark:ring-emerald-900" : ""}`} title={d.status ?? "—"} />
                      <span className="text-[10px] tabular-nums text-muted-foreground">{new Date(d.date).getDate()}</span>
                    </div>
                  );
                })}
              </div>
              <div className="text-end">
                <p className="text-2xl font-bold tabular-nums text-emerald-600">{att.last30d.rate}%</p>
                <p className="text-[10px] text-muted-foreground">30-day rate</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {(["present", "late", "absent", "leave"] as const).map((k) => (
                <div key={k} className="rounded-lg border bg-card/50 p-2">
                  <div className={`mx-auto mb-1 size-2 rounded-full ${ATT_TINT[k]}`} />
                  <p className="font-semibold tabular-nums">{att.last30d[k]}</p>
                  <p className="capitalize text-muted-foreground">{k}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* Fee Status */}
      <SectionCard title={t("dashboard.feeStatus")} icon={Wallet} iconTint="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
        action={<Button variant="ghost" size="sm" onClick={() => setView("finance")} className="text-xs">{t("dashboard.payFees")}<ChevronRight className="size-3.5 rtl:rotate-180" /></Button>}>
        {!fees ? (
          <EmptyState icon={Wallet} title={t("dashboard.noData")} />
        ) : (
          <div className="space-y-3">
            <div className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
              paid ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30"
              : "border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/30"
            }`}>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t("dashboard.outstandingFees")}</p>
                {paid ? (
                  <Badge className="mt-1 border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{t("dashboard.paidUp")}</Badge>
                ) : (
                  <p className="mt-0.5 text-2xl font-bold tabular-nums text-amber-600">৳{fees.outstanding.toLocaleString(locale)}</p>
                )}
              </div>
              <div className="text-end">
                <p className="text-xs text-muted-foreground">Paid ৳{fees.totalPaid.toLocaleString(locale)}</p>
                <p className="text-xs text-muted-foreground">{fees.pendingCount} pending</p>
              </div>
            </div>
            {fees.recentCollections.length > 0 && (
              <ul className="space-y-1.5">
                {fees.recentCollections.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-2 rounded-lg border bg-card/50 p-2.5 text-xs">
                    <div>
                      <p className="font-medium">৳{f.amount.toLocaleString(locale)}</p>
                      <p className="text-muted-foreground">
                        {f.dueDate ? `Due ${dateFmt.format(new Date(f.dueDate))}` : "—"}{f.method ? ` · ${f.method}` : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className={`capitalize ${FEE_STATUS_TINT[f.status] ?? "bg-muted text-muted-foreground"}`}>{f.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </SectionCard>

      {/* Library Books */}
      <SectionCard title={t("dashboard.borrowedBooks")} icon={Library} iconTint="bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
        action={<Button variant="ghost" size="sm" onClick={() => setView("library")} className="text-xs">{t("common.view")}<ChevronRight className="size-3.5 rtl:rotate-180" /></Button>}>
        {data.libraryBooks.length === 0 ? (
          <EmptyState icon={Library} title={t("dashboard.noData")} />
        ) : (
          <ScrollArea className="max-h-60 pe-3">
            <ul className="space-y-2">
              {data.libraryBooks.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card/50 p-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <BookOpen className="size-4 shrink-0 text-violet-500" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{b.title}</p>
                      <p className="text-xs text-muted-foreground">Due {dateFmt.format(new Date(b.dueDate))}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`shrink-0 ${
                    b.overdue ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                    : "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                  }`}>
                    {b.overdue ? "Overdue" : "Borrowed"}
                  </Badge>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </SectionCard>
    </div>
  );
}
