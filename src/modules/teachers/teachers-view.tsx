"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Users, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/store/app-store";

import { TeacherForm } from "./teacher-form";
import { TeachersGrid, TeachersEmptyState } from "./teachers-grid";
import { SPECIALIZATIONS, type TeacherDTO, type TeacherListResponse } from "./types";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const PAGE_SIZE = 20;

export function TeachersView() {
  const { t, tenantName, dir } = useApp();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [specialization, setSpecialization] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TeacherListResponse | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TeacherDTO | null>(null);
  const [currency] = useState("৳"); // tenant currency; default BDT symbol

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (specialization !== "all") params.set("specialization", specialization);

      const res = await fetch(`/api/teachers?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
      setData(json.data as TeacherListResponse);
    } catch (err) {
      toast.error(t("teachers.loadFailed"), {
        description: err instanceof Error ? err.message : "Failed",
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, specialization, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleEdit = (teacher: TeacherDTO) => {
    setEditTarget(teacher);
    setFormOpen(true);
  };

  const teachers = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasFilters = !!debouncedSearch || specialization !== "all";

  const summary = useMemo(() => {
    const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const to = Math.min(page * PAGE_SIZE, total);
    return { from, to };
  }, [page, total]);

  return (
    <div className="flex flex-col gap-6" dir={dir()}>
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Users className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("teachers.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("teachers.total")}: {total} {tenantName ? `· ${tenantName}` : ""}
            </p>
          </div>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="size-4" />
          {t("teachers.add")}
        </Button>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("teachers.search")}
            className="ps-9"
          />
        </div>
        <Select value={specialization} onValueChange={(v) => { setSpecialization(v); setPage(1); }}>
          <SelectTrigger className="sm:w-56 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("teachers.filterAll")}</SelectItem>
            {SPECIALIZATIONS.map((s) => (
              <SelectItem key={s} value={s}>{t(`teachers.spec${cap(s)}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <TeachersSkeleton />
      ) : teachers.length === 0 ? (
        <TeachersEmptyState filtered={hasFilters} onAdd={handleAdd} />
      ) : (
        <>
          <TeachersGrid
            teachers={teachers}
            currency={currency}
            onEdit={handleEdit}
            onChanged={load}
          />

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-sm text-muted-foreground">
              {t("teachers.showing")} {summary.from}–{summary.to} / {total} {t("teachers.results")}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
                {t("teachers.prev")}
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {t("teachers.page")} {page} {t("teachers.of")} {totalPages}
              </span>
              <Button
                variant="outline" size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                {t("teachers.next")}
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      <TeacherForm
        open={formOpen}
        onOpenChange={setFormOpen}
        teacher={editTarget}
        onSaved={load}
      />
    </div>
  );
}

function TeachersSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl border overflow-hidden">
          <Skeleton className="h-16 w-full rounded-none" />
          <div className="px-4 pb-4 -mt-8 space-y-3">
            <Skeleton className="size-16 rounded-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-14" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-8 w-full mt-2" />
          </div>
        </div>
      ))}
      <div className="sr-only" aria-live="polite">
        <Loader2 className="size-4 animate-spin" />
        Loading teachers...
      </div>
    </div>
  );
}
