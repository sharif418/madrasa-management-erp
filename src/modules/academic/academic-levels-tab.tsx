"use client";
// AcademicLevelsTab — vertical progression track of Qawmi/Alia stages.
// Renders suggested Qawmi levels (when empty), the saved timeline, and add/edit dialog.
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Loader2, Layers, Sparkles, BookOpen, Clock, Hash,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useT } from "./i18n";
import { LevelForm } from "./level-form";

export type LevelDTO = {
  id: string;
  name: string;
  nameArabic: string | null;
  order: number;
  durationYears: number;
  description: string | null;
  createdAt: string;
  _count: { classes: number };
};

// 5 default Qawmi stages (used as suggestions to seed)
const SUGGESTED_QAWMI: { name: string; nameArabic: string; order: number; durationYears: number }[] = [
  { name: "Ibtedayi", nameArabic: "ابتدائية", order: 1, durationYears: 2 },
  { name: "Mutawassitah", nameArabic: "متوسطة", order: 2, durationYears: 3 },
  { name: "Sanawiyyah", nameArabic: "ثانوية", order: 3, durationYears: 2 },
  { name: "Fazilat", nameArabic: "فضيلة", order: 4, durationYears: 2 },
  { name: "Dawra-e-Hadith", nameArabic: "دورة الحديث", order: 5, durationYears: 1 },
];

// Heuristic: Alia levels end at "Kamil"; everything else treated as Qawmi for color
function isAlia(name: string) {
  return /kamil/i.test(name);
}
function stageColor(name: string) {
  return isAlia(name)
    ? { ring: "from-violet-500 to-purple-600", badge: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" }
    : { ring: "from-emerald-500 to-teal-600", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" };
}

export function AcademicLevelsTab() {
  const t = useT();
  const [levels, setLevels] = useState<LevelDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editLevel, setEditLevel] = useState<LevelDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LevelDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/academic/levels", { cache: "no-store" });
      const json = await res.json();
      if (json?.ok) setLevels((json.data.items as LevelDTO[]) ?? []);
      else setLevels([]);
    } catch {
      setLevels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const seedSuggested = async () => {
    let ok = 0;
    for (const s of SUGGESTED_QAWMI) {
      try {
        const res = await fetch("/api/academic/levels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(s),
        });
        if ((await res.json())?.ok) ok++;
      } catch { /* ignore */ }
    }
    if (ok > 0) toast.success(t("academic.levelSaved"));
    void load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/academic/levels/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
      toast.success(t("academic.levelDeleted"));
      setDeleteTarget(null);
      void load();
    } catch (err) {
      toast.error(t("academic.levelDeleteFailed"), {
        description: err instanceof Error ? err.message : "Failed",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span className="text-sm">{t("common.loading")}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Layers className="size-4 text-emerald-600" />
            {t("academic.progressionTrack")}
          </h3>
          <p className="text-xs text-muted-foreground">{t("academic.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          {levels.length === 0 && (
            <Button variant="outline" onClick={seedSuggested}>
              <Sparkles className="size-4" />
              {t("academic.useSuggested")}
            </Button>
          )}
          <Button
            onClick={() => { setEditLevel(null); setFormOpen(true); }}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700"
          >
            <Plus className="size-4" />
            {t("academic.addLevel")}
          </Button>
        </div>
      </div>

      {/* Suggestions hint when empty */}
      {levels.length === 0 && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {SUGGESTED_QAWMI.map((s) => (
            <div
              key={s.name}
              className="rounded-xl border border-dashed border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 text-center"
            >
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">{s.name}</p>
              <p className="mt-0.5 text-base font-bold text-emerald-700/80 dark:text-emerald-300/80" dir="rtl">{s.nameArabic}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{s.durationYears} {t("academic.years")}</p>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {levels.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40">
              <Layers className="size-8" />
            </div>
            <h3 className="text-base font-semibold">{t("academic.noLevels")}</h3>
            <p className="max-w-md text-sm text-muted-foreground">{t("academic.noLevelsDesc")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Vertical track line */}
          <div
            className="absolute top-2 bottom-2 w-0.5 start-6 bg-gradient-to-b from-emerald-400 via-teal-400 to-emerald-500 dark:from-emerald-700 dark:via-teal-700 dark:to-emerald-800"
            aria-hidden="true"
          />

          <ol className="space-y-4">
            {levels.map((lvl, idx) => {
              const c = stageColor(lvl.name);
              return (
                <motion.li
                  key={lvl.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="relative ps-16"
                >
                  {/* Node */}
                  <div
                    className={`absolute start-3 top-3 grid size-7 place-items-center rounded-full bg-gradient-to-br ${c.ring} text-white shadow-md ring-4 ring-white dark:ring-background`}
                  >
                    <span className="text-[10px] font-bold">{lvl.order}</span>
                  </div>

                  <Card className="overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-bold">{lvl.name}</h4>
                          {lvl.nameArabic && (
                            <span className="text-base font-bold text-emerald-700/80 dark:text-emerald-300/80" dir="rtl">
                              {lvl.nameArabic}
                            </span>
                          )}
                          <Badge className={c.badge}>
                            {isAlia(lvl.name) ? t("academic.aliaLevels") : t("academic.qawmiLevels")}
                          </Badge>
                        </div>

                        {lvl.description && (
                          <p className="mt-1 text-sm text-muted-foreground">{lvl.description}</p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Hash className="size-3" />
                            {t("academic.order")}: <b className="text-foreground">{lvl.order}</b>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3" />
                            {lvl.durationYears} {t("academic.years")}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <BookOpen className="size-3" />
                            {t("academic.classCount", { count: lvl._count.classes })}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => { setEditLevel(lvl); setFormOpen(true); }}
                          className="size-8 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40"
                          title={t("common.edit")}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteTarget(lvl)}
                          className="size-8 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                          title={t("common.delete")}
                          disabled={lvl._count.classes > 0}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.li>
              );
            })}
          </ol>
        </div>
      )}

      <LevelForm
        open={formOpen}
        onOpenChange={setFormOpen}
        level={editLevel}
        onSaved={() => void load()}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("academic.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("academic.confirmDeleteLevel", { name: deleteTarget?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
