"use client";
// RevisionTodayCard — shows HifzRecords due for revision today, grouped by student.
// Color-coded: overdue (red), due today (amber), upcoming (green).
import * as React from "react";
import { CalendarClock, ChevronDown, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { typeLabelKey } from "./hifz-types";

type DueItem = {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string | null;
  type: string;
  paraNumber: number;
  surahName: string | null;
  ayahFrom: number | null;
  ayahTo: number | null;
  nextRevisionDate: string | null;
  revisionCount: number;
  strengthScore: number;
  status: "overdue" | "due" | "upcoming";
};

type Group = {
  studentId: string;
  studentName: string;
  rollNo: string | null;
  items: DueItem[];
};

type Response = {
  groups: Group[];
  counts: { overdue: number; due: number; upcoming: number; total: number };
};

type Props = { refreshKey: number };

export function RevisionTodayCard({ refreshKey }: Props) {
  const { t, dir, locale } = useApp();
  const { toast } = useToast();
  const [data, setData] = React.useState<Response | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [openStudents, setOpenStudents] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/hifz/revision-today", { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        if (!json.ok) throw new Error(json.error);
        setData(json.data as Response);
      } catch {
        if (!cancelled) {
          toast({ title: t("hifz.error"), variant: "destructive" });
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey, t, toast]);

  function toggleStudent(id: string) {
    setOpenStudents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const counts = data?.counts ?? { overdue: 0, due: 0, upcoming: 0, total: 0 };
  const dueNow = counts.overdue + counts.due;

  return (
    <Card className="border-emerald-600/20 bg-gradient-to-br from-emerald-50/80 to-teal-50/60 py-4 dark:from-emerald-950/30 dark:to-teal-950/20" dir={dir()}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4 text-emerald-600" />
          {t("hifz.revisionToday")}
        </CardTitle>
        <CardDescription>
          <span className="inline-flex flex-wrap items-center gap-3 pt-1">
            <Badge className={cn(dueNow > 0 ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300")}>
              {t("hifz.dueToday")}: {dueNow}
            </Badge>
            {counts.overdue > 0 && (
              <Badge variant="outline" className="border-rose-300 text-rose-700 dark:border-rose-800 dark:text-rose-300">
                <AlertCircle className="size-3 me-1" /> {t("hifz.overdue")}: {counts.overdue}
              </Badge>
            )}
            {counts.upcoming > 0 && (
              <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">
                <Clock className="size-3 me-1" /> {t("hifz.upcoming")}: {counts.upcoming}
              </Badge>
            )}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
          </div>
        ) : !data || data.groups.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-emerald-300/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="size-5" />
            <p className="text-sm">{t("hifz.noRevisionDue")}</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pe-1">
            {data.groups.map((g) => {
              const dueCount = g.items.filter((i) => i.status !== "upcoming").length;
              const isOpen = openStudents.has(g.studentId);
              return (
                <Collapsible key={g.studentId} open={isOpen} onOpenChange={() => toggleStudent(g.studentId)}>
                  <CollapsibleTrigger className="w-full">
                    <div className={cn(
                      "flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-start transition-colors hover:bg-accent/40",
                      dueCount > 0 ? "border-amber-300/60 dark:border-amber-800/60" : "border-emerald-300/60"
                    )}>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "grid size-7 place-items-center rounded-full text-xs font-bold",
                          dueCount > 0 ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                        )}>{dueCount}</span>
                        <div>
                          <p className="text-sm font-medium">{g.studentName}</p>
                          {g.rollNo && <p className="text-xs text-muted-foreground">#{g.rollNo}</p>}
                        </div>
                      </div>
                      <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ul className="mt-1 space-y-1 ps-3">
                      {g.items.map((it) => (
                        <li key={it.id} className={cn(
                          "flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs",
                          it.status === "overdue" && "border-rose-300/60 bg-rose-50/40 dark:bg-rose-950/20",
                          it.status === "due" && "border-amber-300/60 bg-amber-50/40 dark:bg-amber-950/20",
                          it.status === "upcoming" && "border-emerald-300/60 bg-emerald-50/30 dark:bg-emerald-950/10"
                        )}>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "size-1.5 rounded-full",
                              it.status === "overdue" && "bg-rose-500",
                              it.status === "due" && "bg-amber-500",
                              it.status === "upcoming" && "bg-emerald-500"
                            )} />
                            <span className="font-medium">{t(typeLabelKey(it.type as "sabak" | "sabaq_para" | "dhor"))}</span>
                            <span className="text-muted-foreground">· {t("hifz.para")} {it.paraNumber}</span>
                            {it.surahName && <span className="text-muted-foreground">· {it.surahName} {it.ayahFrom ?? ""}{it.ayahTo ? `-${it.ayahTo}` : ""}</span>}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span title={t("hifz.strengthScore")}>★{it.strengthScore}</span>
                            {it.nextRevisionDate && (
                              <span className="tabular-nums">{new Date(it.nextRevisionDate).toLocaleDateString(locale() === "ar" ? "ar-EG" : locale() === "bn" ? "bn-BD" : "en-GB", { month: "short", day: "numeric" })}</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
