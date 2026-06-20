"use client";
// Students main view: header, filters, table, pagination, bulk actions
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useFilterPersistence } from "@/hooks/use-filter-persistence";
import { SavedSearchesBar } from "@/components/shared/saved-searches-bar";
import { useT } from "./i18n";
import { useStudents, useClasses } from "./use-students";
import { StudentsTable } from "./students-table";
import { StudentForm } from "./student-form";
import { StudentProfileView } from "./student-profile-view";
import { BulkActionsBar } from "./bulk-actions-bar";
import type { Student } from "./types";

const ISLAMIC_PATTERN_STYLE: React.CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='white' stroke-width='1'><polygon points='20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14'/></g></svg>\")",
  backgroundSize: "40px 40px",
  backgroundRepeat: "repeat",
};

const LIMIT = 20;

export function StudentsView() {
  const t = useT();
  const dir = useApp((s) => s.dir());
  const tenantName = useApp((s) => s.tenantName);
  const { toast } = useToast();

  const [filters, setFilters, resetFilters] = useFilterPersistence("students", { search: "", classId: "", gender: "" });
  const search = (filters.search as string) ?? "", classId = (filters.classId as string) ?? "", gender = (filters.gender as string) ?? "";
  const setSearch = (v: string) => setFilters({ search: v });
  const setClassId = (v: string) => setFilters({ classId: v }), setGender = (v: string) => setFilters({ gender: v });
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);

  // 360° profile view: when set, replaces the list with the detail view
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);

  // Bulk selection state — set of student IDs (persists across pages by default)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allOnPage = ids.every((id) => next.has(id));
      if (allOnPage) {
        // Deselect only the visible-page ids
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

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
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/20 ring-1 ring-white/30">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.15]"
              aria-hidden="true"
              style={ISLAMIC_PATTERN_STYLE}
            />
            <Users className="relative h-5 w-5 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("students.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {data ? t("students.totalRows", { count: data.total }) : t("common.loading")}
              {tenantName ? ` · ${tenantName}` : ""}
            </p>
          </div>
        </div>
        <Button
          onClick={handleAdd}
          className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("students.add")}
        </Button>
      </div>

      <SavedSearchesBar module="students" currentFilters={filters} onApply={(f) => { setFilters(f as typeof filters); setPage(1); }} onReset={() => { resetFilters(); setPage(1); }} />

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

      {/* Bulk actions bar (renders only when 1+ students selected) */}
      <BulkActionsBar
        selectedIds={selectedIds}
        onClear={clearSelection}
        onActionComplete={() => {
          clearSelection();
          refetch();
        }}
      />

      {/* Table */}
      <StudentsTable
        students={data?.items ?? []}
        loading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
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
