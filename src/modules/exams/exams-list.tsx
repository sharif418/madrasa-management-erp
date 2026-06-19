"use client";
// ExamsList — card grid with class/term filters + per-card actions + delete confirm
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  GraduationCap, MoreVertical, Pencil, Trash2, ClipboardList, FileText, CalendarDays, ClipboardCheck,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { TERM_LIST, TERM_TINT, termLabelKey, type ExamListItem, type ClassOption } from "./exams-types";

export function ExamsList({
  exams, loading, classes, classFilter, termFilter,
  onClassChange, onTermChange, onAdd, onEdit, onManageMarks, onViewReport, onDeleted,
}: {
  exams: ExamListItem[];
  loading: boolean;
  classes: ClassOption[];
  classFilter: string;
  termFilter: string;
  onClassChange: (v: string) => void;
  onTermChange: (v: string) => void;
  onAdd: () => void;
  onEdit: (e: ExamListItem) => void;
  onManageMarks: (e: ExamListItem) => void;
  onViewReport: (e: ExamListItem) => void;
  onDeleted: () => void;
}) {
  const { t, locale, dir } = useApp();
  const { toast } = useToast();
  const [toDelete, setToDelete] = React.useState<ExamListItem | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const dateFmt = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" });
  const fmtRange = (e: ExamListItem) => {
    if (!e.startDate && !e.endDate) return null;
    const s = e.startDate ? dateFmt.format(new Date(e.startDate)) : "—";
    const en = e.endDate ? dateFmt.format(new Date(e.endDate)) : s;
    return s === en ? s : `${s} → ${en}`;
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/exams/${toDelete.id}`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Delete failed");
      toast({ title: t("exams.deleted") });
      setToDelete(null);
      onDeleted();
    } catch {
      toast({ title: t("exams.deleteFailed"), variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4" dir={dir()}>
      {/* Filter bar */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("exams.class")}</label>
              <Select value={classFilter} onValueChange={onClassChange}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("exams.term")}</label>
              <Select value={termFilter} onValueChange={onTermChange}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  {TERM_LIST.map((tm) => (
                    <SelectItem key={tm} value={tm}>{t(termLabelKey(tm))}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={onAdd} className="bg-emerald-600 hover:bg-emerald-700 self-start sm:self-auto">
            <GraduationCap className="size-4" /> {t("exams.add")}
          </Button>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : exams.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/40 p-12 text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white opacity-70 ring-1 ring-white/30">
            <GraduationCap className="size-6" />
          </div>
          <p className="font-medium">{t("exams.empty")}</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">{t("exams.emptyDesc")}</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[calc(100vh-18rem)] pe-3">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {exams.map((e) => {
              const range = fmtRange(e);
              return (
                <Card
                  key={e.id}
                  className="group flex flex-col overflow-hidden py-0 gap-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* Gradient header band with Islamic pattern */}
                  <div className="relative h-12 bg-gradient-to-r from-violet-500 to-purple-600">
                    <div
                      className="pointer-events-none absolute inset-0 opacity-[0.1]"
                      aria-hidden="true"
                      style={{
                        backgroundImage:
                          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'><g fill='none' stroke='white' stroke-width='0.9'><polygon points='15,2 18,10 26,10 20,15 22,23 15,19 8,23 10,15 4,10 12,10'/></g></svg>\")",
                        backgroundSize: "30px 30px",
                        backgroundRepeat: "repeat",
                      }}
                    />
                    <div
                      className="pointer-events-none absolute -end-3 -top-3 size-14 rounded-full bg-white/15 blur-md transition-transform group-hover:scale-125"
                      aria-hidden="true"
                    />
                  </div>
                  <CardContent className="flex flex-1 flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {e.className && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900">
                            {e.className}
                          </Badge>
                        )}
                        {e.term && (
                          <Badge variant="outline" className={cn("capitalize", TERM_TINT[e.term])}>
                            {t(termLabelKey(e.term))}
                          </Badge>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7" aria-label={t("exams.actions")}>
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onManageMarks(e)}>
                            <ClipboardList className="size-4" /> {t("exams.manageMarks")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onViewReport(e)}>
                            <FileText className="size-4" /> {t("exams.reportCard")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onEdit(e)}>
                            <Pencil className="size-4" /> {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setToDelete(e)} className="text-rose-600 focus:text-rose-700">
                            <Trash2 className="size-4" /> {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div>
                      <h3 className="line-clamp-2 font-semibold leading-tight">{e.name}</h3>
                      {range && (
                        <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="size-3" /> {range}
                        </p>
                      )}
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <ClipboardCheck className="size-3.5 text-violet-500 dark:text-violet-400" />
                        {t("exams.resultsCount", { count: e._count.results })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("exams.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("exams.deleteConfirmDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {deleting ? t("common.loading") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
