"use client";
// Students main view: header, filters, table, pagination
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Users, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Card, CardContent,
} from "@/components/ui/card";
import {
  Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { useT } from "./i18n";
import { useStudents, useClasses } from "./use-students";
import { StudentsTable } from "./students-table";
import { StudentForm } from "./student-form";
import { StudentProfileView } from "./student-profile-view";
import type { Student } from "./types";

const LIMIT = 20;

export function StudentsView() {
  const t = useT();
  const dir = useApp((s) => s.dir());
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);

  // 360° profile view: when set, replaces the list with the detail view
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);

  // Debounced search — also resets to page 1 when search term changes
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [search]);

  // Reset page when class/gender filters change — handled inline in the
  // change handlers below to avoid setState-in-effect.

  const handleClassChange = (v: string) => {
    setClassId(v);
    setPage(1);
  };
  const handleGenderChange = (v: string) => {
    setGender(v);
    setPage(1);
  };

  const queryParams = useMemo(
    () => ({ search: debouncedSearch, classId, gender, page, limit: LIMIT }),
    [debouncedSearch, classId, gender, page]
  );

  const { data, isLoading, isError, error, refetch } = useStudents(queryParams);
  const { data: classes = [] } = useClasses();

  useEffect(() => {
    if (isError) {
      toast({
        title: t("students.loadError"),
        description: error instanceof Error ? error.message : "",
        variant: "destructive",
      });
    }
  }, [isError, error, toast, t]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const handleAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (s: Student) => {
    setEditing(s);
    setFormOpen(true);
  };

  const handleView = (s: Student) => {
    setViewingStudentId(s.id);
  };

  // Render the 360° profile view in place of the list when one is selected.
  if (viewingStudentId) {
    return (
      <StudentProfileView
        studentId={viewingStudentId}
        onBack={() => setViewingStudentId(null)}
      />
    );
  }

  return (
    <div dir={dir} className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("students.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {data ? t("students.totalRows", { count: data.total }) : t("common.loading")}
            </p>
          </div>
        </div>
        <Button onClick={handleAdd} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t("students.add")}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative sm:col-span-2 lg:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("students.search")}
                className="pl-9"
              />
            </div>

            <Select
              value={classId || "__all__"}
              onValueChange={(v) => handleClassChange(v === "__all__" ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("students.filterClass")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t("students.allClasses")}</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={gender || "__all__"}
              onValueChange={(v) => handleGenderChange(v === "__all__" ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("students.filterGender")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t("students.allGenders")}</SelectItem>
                <SelectItem value="male">{t("students.male")}</SelectItem>
                <SelectItem value="female">{t("students.female")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error banner */}
      {isError && (
        <div className="flex items-center gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{t("students.loadError")}</span>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            {t("common.confirm")}
          </Button>
        </div>
      )}

      {/* Table */}
      <StudentsTable
        students={data?.items ?? []}
        loading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
      />

      {/* Pagination */}
      {data && data.total > 0 && (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {t("students.pageOf", { page, total: totalPages })}
          </p>
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => canPrev && setPage((p) => p - 1)}
                  aria-disabled={!canPrev}
                  className={!canPrev ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              <PaginationItem>
                <Badge variant="outline" className="px-3 py-1">
                  {page} / {totalPages}
                </Badge>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => canNext && setPage((p) => p + 1)}
                  aria-disabled={!canNext}
                  className={!canNext ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <StudentForm open={formOpen} onOpenChange={setFormOpen} student={editing} />
    </div>
  );
}
