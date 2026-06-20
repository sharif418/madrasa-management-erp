"use client";
// TabulationTab — class-wide exam results matrix (students × subjects).
// Top 3 ranks highlighted, summary row with per-subject highest/lowest/average/pass-rate.
// Print button + Export PDF (window.print for now).
import * as React from "react";
import { useApp } from "@/store/app-store";
import { toast } from "sonner";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Printer, FileDown, Table2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExamListItem } from "./exams-types";

type Cell = { marks: number; total: number; pct: number } | null;

type StudentRow = {
  studentId: string; name: string; rollNo: string | null;
  marksBySubject: Record<string, Cell>;
  total: number; average: number; grade: string; rank: number | null;
};

type SubjectStat = { subject: string; highest: number; lowest: number; average: number; passRate: number; count: number };

type TabulationData = {
  exam: { id: string; name: string; className: string | null; term: string | null };
  subjects: string[];
  students: StudentRow[];
  subjectStats: SubjectStat[];
  totals: { studentCount: number; subjectCount: number; classAverage: number; overallPassRate: number };
};

const RANK_TINT: Record<number, string> = {
  1: "bg-gradient-to-r from-amber-50 to-yellow-100 dark:from-amber-950/40 dark:to-yellow-900/30 border-amber-300 dark:border-amber-800",
  2: "bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/30 border-slate-300 dark:border-slate-700",
  3: "bg-gradient-to-r from-orange-50 to-amber-100 dark:from-orange-950/40 dark:to-amber-900/30 border-orange-300 dark:border-orange-800",
};

function cellTint(cell: Cell): string {
  if (!cell) return "text-muted-foreground";
  const p = cell.pct;
  if (p >= 80) return "text-emerald-700 dark:text-emerald-300 font-semibold";
  if (p >= 60) return "text-teal-700 dark:text-teal-300 font-semibold";
  if (p >= 40) return "text-amber-700 dark:text-amber-300 font-medium";
  return "text-rose-700 dark:text-rose-300 font-semibold";
}

export function TabulationTab({ exams }: { exams: ExamListItem[] }) {
  const { t, dir, locale } = useApp();
  const [examId, setExamId] = React.useState<string>("");
  const [data, setData] = React.useState<TabulationData | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!examId) { setData(null); return; }
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/exams/${examId}/tabulation`, { credentials: "include" });
        const j = await r.json();
        if (!alive) return;
        if (j?.ok) setData(j.data as TabulationData);
        else throw new Error(j?.error);
      } catch (e) {
        if (alive) toast.error(e instanceof Error ? e.message : "Failed");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [examId]);

  void locale; // reserved for future locale-aware formatting

  return (
    <div className="space-y-4" dir={dir()}>
      {/* Toolbar */}
      <Card className="border border-border/60 print:hidden">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="flex items-center gap-2">
            <Table2 className="size-4 text-violet-600" />
            <span className="text-sm font-medium">{t("exams.tabulation")}</span>
          </div>
          <div className="ms-auto flex flex-wrap items-center gap-2">
            <Select value={examId} onValueChange={setExamId}>
              <SelectTrigger className="w-56"><SelectValue placeholder={t("exams.selectExam")} /></SelectTrigger>
              <SelectContent>
                {exams.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}{e.className ? ` · ${e.className}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => window.print()} disabled={!data}>
              <Printer className="size-4" /> {t("exams.printTabulation")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} disabled={!data}>
              <FileDown className="size-4" /> {t("exams.exportPdf")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {!examId ? (
        <Card className="border-dashed">
          <CardContent className="grid place-items-center p-10 text-center text-sm text-muted-foreground">
            <Table2 className="mb-2 size-8 opacity-40" />
            {t("exams.noTabulation")}
          </CardContent>
        </Card>
      ) : loading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : !data ? null : data.students.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {t("exams.noResults")}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Print-only header */}
          <div className="hidden print:block">
            <h1 className="text-center text-xl font-bold">{data.exam.name}</h1>
            <p className="text-center text-sm">{data.exam.className}</p>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 print:hidden">
            <StatBox label={t("exams.total")} value={String(data.totals.studentCount)} />
            <StatBox label={t("academic.subjects")} value={String(data.totals.subjectCount)} />
            <StatBox label={t("exams.average")} value={String(data.totals.classAverage)} />
            <StatBox label={t("exams.passRate")} value={`${data.totals.overallPassRate}%`} />
          </div>

          {/* Matrix table */}
          <Card className="border border-border/60 overflow-hidden">
            <CardHeader className="pb-2 print:hidden">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="size-4 text-amber-500" />
                {data.exam.name}
                {data.exam.className && <span className="text-sm font-normal text-muted-foreground">· {data.exam.className}</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[36rem] overflow-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
                    <tr>
                      <th className="px-2 py-2 text-start font-medium text-muted-foreground">#</th>
                      <th className="px-2 py-2 text-start font-medium text-muted-foreground">{t("students.title")}</th>
                      {data.subjects.map((s) => (
                        <th key={s} className="px-2 py-2 text-center font-medium text-muted-foreground whitespace-nowrap">{s}</th>
                      ))}
                      <th className="px-2 py-2 text-end font-semibold text-foreground">{t("exams.total")}</th>
                      <th className="px-2 py-2 text-end font-semibold text-foreground">{t("exams.average")}</th>
                      <th className="px-2 py-2 text-center font-semibold text-foreground">{t("exams.grade")}</th>
                      <th className="px-2 py-2 text-center font-semibold text-foreground">{t("exams.rank")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.students.map((s) => {
                      const tint = s.rank && s.rank <= 3 ? RANK_TINT[s.rank] : "";
                      return (
                        <tr key={s.studentId} className={cn("border-t border-border/40", tint)}>
                          <td className="px-2 py-1.5 text-muted-foreground">{s.rank ?? "—"}</td>
                          <td className="px-2 py-1.5">
                            <div className="font-medium">{s.name}</div>
                            {s.rollNo && <div className="text-[10px] text-muted-foreground">#{s.rollNo}</div>}
                          </td>
                          {data.subjects.map((subj) => {
                            const cell = s.marksBySubject[subj];
                            return (
                              <td key={subj} className={cn("px-2 py-1.5 text-center tabular-nums", cellTint(cell))}>
                                {cell ? cell.marks : "—"}
                              </td>
                            );
                          })}
                          <td className="px-2 py-1.5 text-end font-bold tabular-nums">{s.total}</td>
                          <td className="px-2 py-1.5 text-end tabular-nums">{s.average}</td>
                          <td className="px-2 py-1.5 text-center">
                            <Badge variant="secondary" className="text-[10px]">{s.grade}</Badge>
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            {s.rank && s.rank <= 3 ? (
                              <span className="inline-flex items-center justify-center size-6 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 text-[10px] font-bold text-white shadow">
                                {s.rank}
                              </span>
                            ) : s.rank ? <span className="text-xs tabular-nums">{s.rank}</span> : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="sticky bottom-0 bg-muted/80 backdrop-blur">
                    <tr className="border-t-2 border-border">
                      <td colSpan={2} className="px-2 py-2 text-end font-semibold text-muted-foreground">{t("exams.highest")}</td>
                      {data.subjectStats.map((st) => (
                        <td key={`${st.subject}-h`} className="px-2 py-2 text-center text-emerald-700 dark:text-emerald-300 font-semibold tabular-nums">{st.highest}</td>
                      ))}
                      <td colSpan={3} />
                    </tr>
                    <tr>
                      <td colSpan={2} className="px-2 py-2 text-end font-semibold text-muted-foreground">{t("exams.lowest")}</td>
                      {data.subjectStats.map((st) => (
                        <td key={`${st.subject}-l`} className="px-2 py-2 text-center text-rose-700 dark:text-rose-300 font-semibold tabular-nums">{st.lowest}</td>
                      ))}
                      <td colSpan={3} />
                    </tr>
                    <tr>
                      <td colSpan={2} className="px-2 py-2 text-end font-semibold text-muted-foreground">{t("exams.average")}</td>
                      {data.subjectStats.map((st) => (
                        <td key={`${st.subject}-a`} className="px-2 py-2 text-center text-amber-700 dark:text-amber-300 font-semibold tabular-nums">{st.average}</td>
                      ))}
                      <td colSpan={3} />
                    </tr>
                    <tr>
                      <td colSpan={2} className="px-2 py-2 text-end font-semibold text-muted-foreground">{t("exams.passRate")}</td>
                      {data.subjectStats.map((st) => (
                        <td key={`${st.subject}-p`} className="px-2 py-2 text-center text-teal-700 dark:text-teal-300 font-semibold tabular-nums">{st.passRate}%</td>
                      ))}
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border border-border/60">
      <CardContent className="p-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
