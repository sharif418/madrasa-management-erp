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
import { Progress } from "@/components/ui/progress";
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
  const gradient = CURRICULUM_GRADIENT[cls.curriculum] || CURRICULUM_GRADIENT.qawmi;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Card className="group relative overflow-hidden py-0 gap-0 hover:shadow-md transition-shadow">
        {/* Gradient header */}
        <div className={`h-20 w-full bg-gradient-to-br ${gradient} relative`}>
          <div className="absolute inset-0 flex items-center justify-between px-4">
            <div className="text-white/95">
              <GraduationCap className="size-7 drop-shadow-sm" />
            </div>
            <Badge className={`text-[10px] px-2 py-0.5 bg-white/20 text-white border-white/30 backdrop-blur-sm`}>
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
              <Badge variant="outline" className="text-[10px] gap-1">
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

          {/* Capacity progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="size-3.5" />
                {t("academic.enrolled")}
              </span>
              <span className={`font-medium ${isFull ? "text-amber-600 dark:text-amber-400" : ""}`}>
                {enrolled} / {capacity}
              </span>
            </div>
            <Progress
              value={pct}
              className={isFull ? "[&>[data-slot=progress-indicator]]:bg-amber-500" : undefined}
            />
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
