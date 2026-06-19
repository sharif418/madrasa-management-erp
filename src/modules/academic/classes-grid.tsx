"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Pencil, Trash2, Loader2, Users, BookOpen, GraduationCap, Hash,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useT } from "./i18n";
import {
  CURRICULUM_BADGE, CURRICULUM_GRADIENT,
  type ClassDTO,
} from "./types";

type Props = {
  classes: ClassDTO[];
  onEdit: (cls: ClassDTO) => void;
  onChanged: () => void;
  onAdd: () => void;
  hasFilters?: boolean;
};

export function ClassesGrid({ classes, onEdit, onChanged, onAdd, hasFilters }: Props) {
  const t = useT();
  const [deleteTarget, setDeleteTarget] = useState<ClassDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/academic/classes/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
      toast.success(t("academic.deleteSuccess"));
      setDeleteTarget(null);
      onChanged();
    } catch (err) {
      toast.error(t("academic.deleteFailed"), {
        description: err instanceof Error ? err.message : "Failed",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (classes.length === 0) {
    return (
      <>
        <ClassesEmptyState filtered={!!hasFilters} onAdd={onAdd} />
        <DeleteDialog
          target={deleteTarget}
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
          onConfirm={confirmDelete}
          deleting={deleting}
        />
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {classes.map((cls, idx) => (
          <ClassCard
            key={cls.id}
            cls={cls}
            index={idx}
            onEdit={() => onEdit(cls)}
            onDelete={() => setDeleteTarget(cls)}
          />
        ))}
      </div>

      <DeleteDialog
        target={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        deleting={deleting}
      />
    </>
  );
}

function ClassCard({
  cls, index, onEdit, onDelete,
}: {
  cls: ClassDTO;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const enrolled = cls._count?.students ?? 0;
  const capacity = cls.capacity || 1;
  const pct = Math.min(100, Math.round((enrolled / capacity) * 100));
  const isFull = enrolled >= capacity;
  const isNearFull = !isFull && pct >= 80;
  const gradient = CURRICULUM_GRADIENT[cls.curriculum] || CURRICULUM_GRADIENT.qawmi;

  // Capacity progress bar color
  const barColor = isFull
    ? "from-rose-500 to-rose-600"
    : isNearFull
      ? "from-amber-400 to-amber-500"
      : "from-emerald-500 to-teal-500";
  const countColor = isFull
    ? "text-rose-600 dark:text-rose-400"
    : isNearFull
      ? "text-amber-600 dark:text-amber-400"
      : "text-emerald-700 dark:text-emerald-300";
  const statusLabel = isFull ? t("academic.capacityFull") : isNearFull ? t("academic.nearFull") : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Card className="group relative overflow-hidden py-0 gap-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        {/* Gradient header with Islamic geometric pattern */}
        <div className={`relative h-20 w-full bg-gradient-to-br ${gradient}`}>
          {/* CSS-only Islamic 8-point star tessellation overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.18]"
            aria-hidden="true"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'><g fill='none' stroke='white' stroke-width='0.9'><polygon points='15,2 18,10 26,10 20,15 22,23 15,19 8,23 10,15 4,10 12,10'/></g></svg>\")",
              backgroundSize: "30px 30px",
              backgroundRepeat: "repeat",
            }}
          />
          {/* Soft glow accent */}
          <div
            className="pointer-events-none absolute -end-4 -top-4 size-20 rounded-full bg-white/15 blur-xl transition-transform group-hover:scale-125"
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex items-center justify-between px-4">
            <div className="grid size-9 place-items-center rounded-lg bg-white/20 text-white ring-1 ring-white/30 backdrop-blur-sm">
              <GraduationCap className="size-5 drop-shadow-sm" />
            </div>
            <Badge className="text-[10px] px-2 py-0.5 bg-white/20 text-white border-white/30 backdrop-blur-sm">
              {t(`academic.${cls.curriculum}`)}
            </Badge>
          </div>
        </div>

        <div className="px-4 pb-4 pt-3 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-base leading-tight truncate">{cls.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("academic.levelLabel", { n: cls.level })}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="icon" variant="ghost" className="size-8" onClick={onEdit} aria-label={t("common.edit")}>
                <Pencil className="size-4" />
              </Button>
              <Button size="icon" variant="ghost" className="size-8 text-destructive hover:text-destructive" onClick={onDelete} aria-label={t("common.delete")}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {cls.code && (
              <Badge variant="outline" className="text-[10px] gap-1 font-mono">
                <Hash className="size-3" />
                {cls.code}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={`text-[10px] gap-1 ${CURRICULUM_BADGE[cls.curriculum] || ""}`}
            >
              <BookOpen className="size-3" />
              {t(`academic.${cls.curriculum}`)}
            </Badge>
          </div>

          {/* Capacity progress with gradient fill + percentage label */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="size-3.5" />
                {t("academic.enrolled")}
                {statusLabel && (
                  <span className={`ms-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${isFull ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"}`}>
                    {statusLabel}
                  </span>
                )}
              </span>
              <span className={`font-semibold tabular-nums ${countColor}`}>
                {enrolled} / {capacity}
                <span className="ms-1 text-[10px] opacity-70">({pct}%)</span>
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`absolute inset-y-0 start-0 rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
                style={{ width: `${Math.max(pct, isFull ? 100 : 4)}%` }}
              />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function ClassesEmptyState({
  filtered, onAdd,
}: { filtered: boolean; onAdd: () => void }) {
  const t = useT();
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <GraduationCap className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{t("academic.emptyClasses")}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        {t("academic.emptyClassesDesc")}
      </p>
      {!filtered && (
        <Button className="mt-4" onClick={onAdd}>
          {t("academic.addClassShort")}
        </Button>
      )}
    </div>
  );
}

function DeleteDialog({
  target, open, onOpenChange, onConfirm, deleting,
}: {
  target: ClassDTO | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  const t = useT();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("academic.confirmDelete")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("academic.confirmDeleteClass", { name: target?.name ?? "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={deleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleting && <Loader2 className="size-4 animate-spin" />}
            {deleting ? t("academic.deleting") : t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
