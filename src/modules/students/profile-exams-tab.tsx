"use client";
// ProfileExamsTab — table of last 5 exam results with empty state
import { GraduationCap, Award, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/store/app-store";
import { useT } from "./i18n";
import { ProfileData } from "./profile-types";

type Props = { data: ProfileData; locale: string };

// Header labels localized inline (3 locales) — avoids polluting global dict
// with one-off exam-column strings.
const HEADERS = {
  exam: { en: "Exam", bn: "পরীক্ষা", ar: "الامتحان" },
  subject: { en: "Subject", bn: "বিষয়", ar: "المادة" },
  marks: { en: "Marks", bn: "নম্বর", ar: "الدرجات" },
  grade: { en: "Grade", bn: "গ্রেড", ar: "التقدير" },
  remarks: { en: "Remarks", bn: "মন্তব্য", ar: "ملاحظات" },
} as const;

export function ProfileExamsTab({ data, locale: _locale }: Props) {
  const t = useT();
  const locale = useApp((s) => s.locale);
  const { examResults } = data;
  const h = (k: keyof typeof HEADERS) => HEADERS[k][locale] ?? HEADERS[k].en;

  return (
    <Card className="py-4">
      <CardContent className="space-y-3">
        <h3 className="flex items-center gap-2 px-2 text-sm font-semibold text-muted-foreground">
          <GraduationCap className="size-4" />
          {t("studentProfile.examResults")}
        </h3>
        {examResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <FileText className="size-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{t("studentProfile.noResults")}</p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{h("exam")}</TableHead>
                  <TableHead className="text-xs">{h("subject")}</TableHead>
                  <TableHead className="text-xs">{h("marks")}</TableHead>
                  <TableHead className="text-xs">{h("grade")}</TableHead>
                  <TableHead className="hidden text-xs sm:table-cell">{h("remarks")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examResults.map((r) => {
                  const pct = r.total > 0 ? Math.round((r.marks / r.total) * 100) : 0;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{r.exam.name}</span>
                          {r.exam.term && (
                            <span className="text-xs text-muted-foreground capitalize">{r.exam.term}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{r.subject}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{r.marks}</span>
                          <span className="text-xs text-muted-foreground">/ {r.total}</span>
                          <Badge variant="outline" className={gradeTone(pct)}>{pct}%</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {r.grade ? (
                          <span className="inline-flex items-center gap-1.5 font-semibold">
                            <Award className="size-3.5 text-amber-500" />
                            {r.grade}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="hidden max-w-xs text-xs text-muted-foreground sm:table-cell">
                        {r.remarks ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function gradeTone(pct: number): string {
  if (pct >= 80) return "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300";
  if (pct >= 60) return "border-teal-300 text-teal-700 dark:border-teal-800 dark:text-teal-300";
  if (pct >= 40) return "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-300";
  return "border-rose-300 text-rose-700 dark:border-rose-800 dark:text-rose-300";
}

