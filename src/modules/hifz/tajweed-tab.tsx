"use client";
// TajweedTab — 4th tab of Hifz module: list of assessments + stats + new dialog
import * as React from "react";
import { Sparkles, Plus, Trash2, CalendarClock } from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { StudentOption } from "./hifz-types";
import { fmtDate } from "./hifz-types";
import {
  GRADE_TINTS, gradeLabelKey, CATEGORY_COLORS,
  type TajweedItem, type TajweedListResponse,
} from "./tajweed-types";
import { TajweedForm } from "./tajweed-form";
import { TajweedStatsCard } from "./tajweed-stats";

type Props = {
  students: StudentOption[];
  refreshKey: number;
};

export function TajweedTab({ students, refreshKey }: Props) {
  const { t, dir, locale } = useApp();
  const { toast } = useToast();
  const [studentId, setStudentId] = React.useState<string>("");
  const [data, setData] = React.useState<TajweedListResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [innerRefresh, setInnerRefresh] = React.useState(0);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const qs = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
      const res = await fetch(`/api/hifz/tajweed${qs}`, { cache: "no-store" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setData(json.data as TajweedListResponse);
    } catch {
      toast({ title: t("hifz.error"), variant: "destructive" });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [studentId, t, toast]);

  React.useEffect(() => {
    void fetchData();
  }, [fetchData, refreshKey, innerRefresh]);

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/hifz/tajweed/${deleteId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast({ title: t("hifz.tajweedDeleted") });
      setInnerRefresh((k) => k + 1);
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Error", variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  }

  const items = data?.items ?? [];

  return (
    <div className="space-y-4" dir={dir()}>
      {/* Toolbar */}
      <Card className="py-4">
        <CardContent className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs text-muted-foreground">{t("hifz.selectStudent")}</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="w-full"><SelectValue placeholder={t("hifz.allStudents")} /></SelectTrigger>
              <SelectContent className="max-h-72">
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}{s.rollNo ? ` · ${s.rollNo}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => setFormOpen(true)}
            className="self-start sm:self-auto bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm transition-all hover:from-emerald-600 hover:to-emerald-800 hover:-translate-y-0.5"
          >
            <Plus className="size-4" /> {t("hifz.newAssessment")}
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid lg:grid-cols-2 gap-4">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-64 rounded-xl col-span-full" />
        </div>
      ) : items.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center text-muted-foreground">
            <Sparkles className="mx-auto mb-3 size-10 opacity-40" />
            <p>{t("hifz.tajweedEmpty")}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {data && <TajweedStatsCard stats={data.stats} trend={data.trend} items={items} locale={locale} />}

          {/* Assessments table */}
          <Card className="py-4">
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{t("hifz.tajweedAssessment")}</p>
                <Badge variant="outline">{items.length}</Badge>
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase">
                    <tr>
                      <th className="px-3 py-2 text-start">{t("hifz.student")}</th>
                      <th className="px-3 py-2 text-start">{t("hifz.assessmentDate")}</th>
                      <th className="px-3 py-2 text-start">{t("hifz.surahAyah")}</th>
                      {CATEGORY_COLORS.map((c) => (
                        <th key={c.key} className="px-3 py-2 text-center hidden md:table-cell">
                          <span className="inline-flex items-center gap-1">
                            <span className="size-2 rounded-full" style={{ background: c.color }} />
                            {t(c.labelKey).split(" ")[0]}
                          </span>
                        </th>
                      ))}
                      <th className="px-3 py-2 text-center">{t("hifz.totalScore")}</th>
                      <th className="px-3 py-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((r) => (
                      <tr key={r.id} className="border-t hover:bg-accent/30">
                        <td className="px-3 py-2 font-medium">{r.studentName}{r.rollNo ? <span className="text-xs text-muted-foreground ms-1">· {r.rollNo}</span> : ""}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                          <span className="inline-flex items-center gap-1"><CalendarClock className="size-3" />{fmtDate(r.date, locale)}</span>
                        </td>
                        <td className="px-3 py-2 text-xs">{r.surahName} <span className="text-muted-foreground">{r.ayahFrom}-{r.ayahTo}</span></td>
                        {CATEGORY_COLORS.map((c) => (
                          <td key={c.key} className="px-3 py-2 text-center hidden md:table-cell tabular-nums">
                            {(r as unknown as Record<string, number>)[`${c.key}Score`]}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center font-bold tabular-nums">{r.totalScore}</td>
                        <td className="px-3 py-2 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", GRADE_TINTS[r.grade])}>
                              {t(gradeLabelKey[r.grade])}
                            </span>
                            <button
                              onClick={() => setDeleteId(r.id)}
                              className="text-muted-foreground hover:text-rose-600 p-1 rounded"
                              aria-label={t("common.delete")}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <TajweedForm
        open={formOpen}
        onOpenChange={setFormOpen}
        students={students}
        defaultStudentId={studentId || undefined}
        onCreated={() => setInnerRefresh((k) => k + 1)}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent dir={dir()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.delete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("hifz.tajweedDeleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
