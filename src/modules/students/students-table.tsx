"use client";
// Students table with status, hafiz, and action buttons
import { useState } from "react";
import { Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useT } from "./i18n";
import { useDeleteStudent } from "./use-students";
import type { Student } from "./types";

type Props = {
  students: Student[];
  loading?: boolean;
  onView?: (s: Student) => void;
  onEdit?: (s: Student) => void;
};

export function StudentsTable({ students, loading, onView, onEdit }: Props) {
  const t = useT();
  const { toast } = useToast();
  const deleteMut = useDeleteStudent();
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      toast({ title: t("students.deleteSuccess") });
      setDeleteTarget(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast({
        title: t("students.deleteError"),
        description: msg,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">{t("students.rollNo")}</TableHead>
              <TableHead>{t("students.name")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("students.class")}</TableHead>
              <TableHead className="hidden lg:table-cell">{t("students.guardianPhone")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead className="w-16 text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 6 }).map((__, j) => (
                  <TableCell key={j}>
                    <div className="h-4 w-full max-w-[120px] rounded bg-muted/60 animate-pulse" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-16 text-center">
        <p className="text-base font-medium">{t("students.noStudents")}</p>
        <p className="text-sm text-muted-foreground mt-1">{t("students.noStudentsDesc")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">{t("students.rollNo")}</TableHead>
              <TableHead>{t("students.name")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("students.class")}</TableHead>
              <TableHead className="hidden lg:table-cell">{t("students.guardianPhone")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead className="w-16 text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => (
              <TableRow key={s.id} className="hover:bg-muted/40">
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {s.rollNo || "—"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{s.name}</span>
                    {s.nameArabic && (
                      <span dir="rtl" className="text-sm text-muted-foreground" lang="ar">
                        {s.nameArabic}
                      </span>
                    )}
                    {s.isHafiz && (
                      <Badge variant="secondary" className="mt-1 w-fit text-[10px]">
                        {t("students.hafiz")}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {s.class ? (
                    <Badge variant="outline">{s.class.name}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell font-mono text-xs">
                  {s.guardianPhone || s.phone || "—"}
                </TableCell>
                <TableCell>
                  {s.isActive ? (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300">
                      {t("students.active")}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{t("students.inactive")}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <span className="sr-only">{t("common.actions")}</span>
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="5" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="12" cy="19" r="2" />
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(s)}>
                          <Eye className="mr-2 h-4 w-4" />
                          {t("students.view")}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onEdit?.(s)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t("students.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(s)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("students.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("students.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("students.confirmDeleteMsg", { name: deleteTarget?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleteMut.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
