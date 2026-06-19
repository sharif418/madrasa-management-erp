"use client";
// ReportCardView — Report Cards tab: select exam → ranked table with medals + print.
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import { Printer, FileText, Trophy, Medal, Award, GraduationCap } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { GRADE_TINT, MEDAL_TINT, gradeLabelKey, termLabelKey, type ExamListItem } from "./exams-types";

type SubjectMark = { subject: string; marks: number; total: number; pct: number; grade: string };
type RankedStudent = {
  studentId: string;
  studentName: string;
  rollNo: string | null;
  subjects: SubjectMark[];
  totalMarks: number;
  maxMarks: number;
  average: number;
  grade: string;
  gpa: number;
  rank: number;
};
type ReportData = {
  exam: {
    id: string; name: string; term: string | null; className: string | null;
    startDate: string | null; endDate: string | null;
  };
  students: RankedStudent[];
  totalStudents: number;
  subjects: string[];
};

export function ReportCardView({ exams }: { exams: ExamListItem[] }) {
  const { t, locale, dir, tenantName } = useApp();
  const [examId, setExamId] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [report, setReport] = React.useState<ReportData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!examId) { setReport(null); return; }
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`/api/exams/${examId}/report-card`, { cache: "no-store" });
        const j = await r.json();
        if (!alive) return;
        if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        setReport(j.data as ReportData);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : t("exams.saveFailed"));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [examId, t]);

  const dateFmt = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-4" dir={dir()}>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .printable, .printable * { visibility: visible !important; }
          .printable { position: absolute; inset: 0; padding: 16px; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Controls (hidden in print) */}
      <Card className="no-print">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("exams.selectExam")}</label>
              <Select value={examId} onValueChange={setExamId}>
                <SelectTrigger className="w-full"><SelectValue placeholder={t("exams.selectExam")} /></SelectTrigger>
                <SelectContent>
                  {exams.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {report && (
              <div className="text-xs text-muted-foreground sm:self-end sm:pb-2">
                {t("exams.students")}: {report.totalStudents} · {report.subjects.length} {t("exams.subject")}
              </div>
            )}
          </div>
          {report && report.students.length > 0 && (
            <Button onClick={() => window.print()} variant="outline" className="self-start sm:self-auto">
              <Printer className="size-4" /> {t("exams.print")}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <Card className="border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40">
          <CardContent className="py-4 text-sm text-rose-700 dark:text-rose-300">{error}</CardContent>
        </Card>
      )}

      {/* Empty states */}
      {!loading && !error && !examId && (
        <div className="rounded-2xl border border-dashed bg-card/40 p-12 text-center">
          <FileText className="mx-auto mb-3 size-12 opacity-30" />
          <p className="font-medium">{t("exams.reportCards")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("exams.selectExam")}</p>
        </div>
      )}
      {!loading && !error && examId && report && report.students.length === 0 && (
        <div className="rounded-2xl border border-dashed bg-card/40 p-12 text-center">
          <FileText className="mx-auto mb-3 size-12 opacity-30" />
          <p className="font-medium">{t("exams.noResults")}</p>
        </div>
      )}

      {/* Printable area — report card */}
      {!loading && !error && report && report.students.length > 0 && (
        <div className="printable space-y-4">
          {/* Print-only header */}
          <div className="hidden print:block">
            <h1 className="text-xl font-bold">{tenantName} — {report.exam.name}</h1>
            <p className="text-xs text-muted-foreground">
              {t("exams.printSubtitle")} · {new Date().toLocaleString()}
            </p>
            <hr className="my-3" />
          </div>

          {/* Header card */}
          <Card className="overflow-hidden border-emerald-200/50 dark:border-emerald-900/40">
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                <GraduationCap className="size-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold leading-tight">{report.exam.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {report.exam.className ?? "—"}
                  {report.exam.term && <> · {t(termLabelKey(report.exam.term))}</>}
                  {report.exam.startDate && <> · {dateFmt.format(new Date(report.exam.startDate))}</>}
                </p>
              </div>
              <TopPerformers students={report.students} />
            </CardContent>
          </Card>

          {/* Ranked table */}
          <Card>
            <ScrollArea className="max-h-[60vh] no-print">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">{t("exams.rank")}</TableHead>
                    <TableHead>{t("exams.students")}</TableHead>
                    {report.subjects.map((sub) => (
                      <TableHead key={sub} className="text-center min-w-20">{sub}</TableHead>
                    ))}
                    <TableHead className="text-center">{t("exams.total")}</TableHead>
                    <TableHead className="text-center">{t("exams.average")}</TableHead>
                    <TableHead className="text-center">{t("exams.grade")}</TableHead>
                    <TableHead className="text-center">{t("exams.gpa")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.students.map((s) => {
                    const isTop3 = s.rank <= 3;
                    return (
                      <TableRow
                        key={s.studentId}
                        className={cn(
                          "transition-colors hover:bg-muted/40",
                          isTop3 && s.rank === 1 && "bg-amber-50/60 dark:bg-amber-950/20",
                          isTop3 && s.rank === 2 && "bg-slate-50/60 dark:bg-slate-900/20",
                          isTop3 && s.rank === 3 && "bg-orange-50/60 dark:bg-orange-950/20",
                        )}
                      >
                        <TableCell className="text-center">
                          <RankBadge rank={s.rank} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium leading-tight">{s.studentName}</span>
                            {s.rollNo && <span className="text-xs text-muted-foreground">{s.rollNo}</span>}
                          </div>
                        </TableCell>
                        {report.subjects.map((sub) => {
                          const sm = s.subjects.find((x) => x.subject === sub);
                          return (
                            <TableCell key={sub} className="text-center text-sm">
                              {sm ? (
                                <span className="inline-flex flex-col items-center">
                                  <span className="font-medium">{formatMark(sm.marks)}</span>
                                  <span className="text-[10px] text-muted-foreground">/ {formatMark(sm.total)}</span>
                                </span>
                              ) : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center font-semibold">{formatMark(s.totalMarks)}</TableCell>
                        <TableCell className="text-center text-sm">{s.average}%</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={cn("px-2", GRADE_TINT[s.grade])}>
                            {t(gradeLabelKey(s.grade))}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-semibold">{s.gpa.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </div>
      )}
    </div>
  );
}

function formatMark(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function RankBadge({ rank }: { rank: number }) {
  const { t } = useApp();
  if (rank <= 3) {
    const Icon = rank === 1 ? Trophy : rank === 2 ? Medal : Award;
    return (
      <span className={cn("inline-flex size-7 items-center justify-center rounded-full bg-gradient-to-br shadow", MEDAL_TINT[rank])}>
        <Icon className="size-3.5" />
      </span>
    );
  }
  return <span className="inline-flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">{rank}</span>;
}

function TopPerformers({ students }: { students: RankedStudent[] }) {
  const { t } = useApp();
  const top3 = students.filter((s) => s.rank <= 3).sort((a, b) => a.rank - b.rank);
  if (top3.length === 0) return null;
  return (
    <div className="no-print flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{t("exams.topPerformers")}:</span>
      {top3.map((s) => (
        <span key={s.studentId} className={cn("inline-flex items-center gap-1 rounded-full bg-gradient-to-br px-2 py-0.5 text-xs font-medium", MEDAL_TINT[s.rank])}>
          {s.rank === 1 && <Trophy className="size-3" />}
          {s.rank === 2 && <Medal className="size-3" />}
          {s.rank === 3 && <Award className="size-3" />}
          {s.studentName}
        </span>
      ))}
    </div>
  );
}
