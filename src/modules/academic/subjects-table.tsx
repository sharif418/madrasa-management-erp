"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Pencil, Trash2, Loader2, BookOpen, Hash, FolderTree,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useT } from "./i18n";
import {
  SUBJECT_TYPES, SUBJECT_TYPE_BADGE,
  type ClassOption, type SubjectDTO, type SubjectType,
} from "./types";

type Props = {
  subjects: SubjectDTO[];
  classes: ClassOption[];
  onEdit: (subject: SubjectDTO) => void;
  onChanged: () => void;
  onAdd: () => void;
  hasFilters?: boolean;
};

export function SubjectsTable({
  subjects, classes, onEdit, onChanged, onAdd, hasFilters,
}: Props) {
  const t = useT();
  const [deleteTarget, setDeleteTarget] = useState<SubjectDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/academic/subjects/${deleteTarget.id}`, {
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

  if (subjects.length === 0) {
    return (
      <>
        <SubjectsEmptyState filtered={!!hasFilters} onAdd={onAdd} />
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
      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="ps-4">{t("academic.subjectName")}</TableHead>
              <TableHead className="w-24">{t("academic.code")}</TableHead>
              <TableHead className="w-32">{t("academic.subjectType")}</TableHead>
              <TableHead className="w-40">{t("academic.filterClass")}</TableHead>
              <TableHead className="w-24 text-end pe-4">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.map((s) => (
              <SubjectRow
                key={s.id}
                subject={s}
                onEdit={() => onEdit(s)}
                onDelete={() => setDeleteTarget(s)}
              />
            ))}
          </TableBody>
        </Table>
      </Card>

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

function SubjectRow({
  subject, onEdit, onDelete,
}: {
  subject: SubjectDTO;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const type = (SUBJECT_TYPES.includes(subject.type as SubjectType)
    ? subject.type
    : "general") as SubjectType;
  const badgeClass = SUBJECT_TYPE_BADGE[type] || SUBJECT_TYPE_BADGE.general;

  return (
    <TableRow>
      <TableCell className="ps-4">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <BookOpen className="size-4" />
          </div>
          <span className="font-medium">{subject.name}</span>
        </div>
      </TableCell>
      <TableCell>
        {subject.code ? (
          <Badge variant="outline" className="text-[10px] gap-1 font-mono">
            <Hash className="size-3" />
            {subject.code}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={`text-[10px] ${badgeClass}`}>
          {t(`academic.${type}`)}
        </Badge>
      </TableCell>
      <TableCell>
        {subject.class ? (
          <span className="text-sm">{subject.class.name}</span>
        ) : (
          <span className="text-xs text-muted-foreground">{t("academic.noClass")}</span>
        )}
      </TableCell>
      <TableCell className="pe-4">
        <div className="flex items-center justify-end gap-1">
          <Button size="icon" variant="ghost" className="size-8" onClick={onEdit} aria-label={t("common.edit")}>
            <Pencil className="size-4" />
          </Button>
          <Button size="icon" variant="ghost" className="size-8 text-destructive hover:text-destructive" onClick={onDelete} aria-label={t("common.delete")}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function SubjectsEmptyState({
  filtered, onAdd,
}: { filtered: boolean; onAdd: () => void }) {
  const t = useT();
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <FolderTree className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">
        {filtered ? t("academic.emptySubjectsFiltered") : t("academic.emptySubjects")}
      </h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        {t("academic.emptySubjectsDesc")}
      </p>
      {!filtered && (
        <Button className="mt-4" onClick={onAdd}>
          {t("academic.addSubjectShort")}
        </Button>
      )}
    </div>
  );
}

function DeleteDialog({
  target, open, onOpenChange, onConfirm, deleting,
}: {
  target: SubjectDTO | null;
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
            {t("academic.confirmDeleteSubject", { name: target?.name ?? "" })}
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
