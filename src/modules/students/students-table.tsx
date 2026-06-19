"use client";
// Students table with status, hafiz, and action buttons + selection column
import { useState } from "react";
import { Eye, Pencil, Trash2, Loader2, BookOpen } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  // Selection support
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: (ids: string[]) => void;
};

// Deterministic emerald/teal/cyan/amber gradient per student name (no purple/pink)
const STUDENT_AVATAR_GRADIENTS = [
  "from-emerald-500 to-teal-600",
  "from-teal-500 to-cyan-600",
  "from-cyan-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-lime-500 to-emerald-600",
  "from-green-500 to-teal-600",
  "from-emerald-600 to-cyan-700",
  "from-amber-400 to-amber-600",
];

function pickGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return STUDENT_AVATAR_GRADIENTS[hash % STUDENT_AVATAR_GRADIENTS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function StudentsTable({
  students, loading, onView, onEdit,
  selectedIds, onToggleSelect, onToggleSelectAll,
}: Props) {
  const t = useT();
  const { toast } = useToast();
  const deleteMut = useDeleteStudent();
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  const selectable = !!selectedIds && !!onToggleSelect;
  const visibleIds = students.map((s) => s.id);
  const allSelected =
    selectable && visibleIds.length > 0 && visibleIds.every((id) => selectedIds!.has(id));
  const someSelected =
    selectable && visibleIds.some((id) => selectedIds!.has(id)) && !allSelected;

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
              {selectable && <TableHead className="w-10" />}
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
                {Array.from({ length: selectable ? 7 : 6 }).map((__, j) => (
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
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {selectable && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={() => onToggleSelectAll?.(visibleIds)}
                    aria-label={t("students.selectAll")}
                  />
                </TableHead>
              )}
              <TableHead className="w-20">{t("students.rollNo")}</TableHead>
              <TableHead>{t("students.name")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("students.class")}</TableHead>
              <TableHead className="hidden lg:table-cell">{t("students.guardianPhone")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead className="w-16 text-end">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => {
              const gradient = pickGradient(s.name);
              const initials = getInitials(s.name);
              const isChecked = selectable ? selectedIds!.has(s.id) : false;
              return (
                <TableRow
                  key={s.id}
                  className="transition-colors hover:bg-muted/50"
                  data-selected={isChecked || undefined}
                >
                  {selectable && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => onToggleSelect?.(s.id)}
                        aria-label={`${t("students.select")} ${s.name}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {s.rollNo || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {/* Avatar circle with initials (gradient by name) */}
                      <Avatar className="size-9 ring-2 ring-background shadow-sm">
                        {s.photoUrl ? <AvatarImage src={s.photoUrl} alt={s.name} /> : null}
                        <AvatarFallback className={`bg-gradient-to-br ${gradient} text-xs font-bold text-white`}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">{s.name}</span>
                        {s.nameArabic && (
                          <span dir="rtl" className="text-sm text-muted-foreground" lang="ar">
                            {s.nameArabic}
                          </span>
                        )}
                        {s.isHafiz && (
                          <Badge className="mt-1 w-fit text-[10px] gap-1 px-1.5 py-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <BookOpen className="size-2.5" />
                            {t("students.hafiz")}
                          </Badge>
                        )}
                      </div>
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
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <span className="me-1 size-1.5 rounded-full bg-emerald-500" />
                        {t("students.active")}
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        <span className="me-1 size-1.5 rounded-full bg-rose-500" />
                        {t("students.inactive")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-end">
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
              );
            })}
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
