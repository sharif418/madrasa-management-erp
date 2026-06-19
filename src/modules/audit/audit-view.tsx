"use client";
// Audit View — header, filters, timeline, pagination.
import { useEffect, useState, useCallback } from "react";
import { useApp } from "@/store/app-store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  History, ChevronLeft, ChevronRight, ScrollText,
} from "lucide-react";
import { AuditFiltersBar } from "./audit-filters";
import { AuditTimeline } from "./audit-timeline";
import type { AuditEntry, AuditFilters, AuditListResponse } from "./audit-types";

const EMPTY: AuditFilters = { action: "", module: "", actorId: "", from: "", to: "" };

export function AuditView() {
  const { t, dir } = useApp();
  const [filters, setFilters] = useState<AuditFilters>(EMPTY);
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [modules, setModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 50;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (filters.action) qs.set("action", filters.action);
      if (filters.module) qs.set("module", filters.module);
      if (filters.actorId) qs.set("actorId", filters.actorId);
      if (filters.from) qs.set("from", filters.from);
      if (filters.to) qs.set("to", filters.to);
      const res = await fetch(`/api/audit?${qs.toString()}`, { credentials: "include" });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error);
      const d = j.data as AuditListResponse;
      setItems(d.items);
      setTotal(d.total);
      setModules(d.modules);
    } catch {
      toast.error(t("audit.loadError"));
    } finally {
      setLoading(false);
    }
  }, [page, filters, t]);

  useEffect(() => {
    const id = setTimeout(load, 200);
    return () => clearTimeout(id);
  }, [load]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [filters]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasFilters = Boolean(filters.action || filters.module || filters.actorId || filters.from || filters.to);

  return (
    <div dir={dir()} className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-600/20 ring-1 ring-white/30">
            {/* Islamic 8-point star tessellation overlay */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.15]"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='white' stroke-width='1'><polygon points='20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14'/></g></svg>\")",
                backgroundSize: "40px 40px",
                backgroundRepeat: "repeat",
              }}
            />
            <History className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("audit.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("audit.subtitle")}</p>
          </div>
        </div>
      </header>

      {/* Filters */}
      <AuditFiltersBar
        filters={filters}
        onChange={setFilters}
        modules={modules}
      />

      {/* Summary line */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
          <ScrollText className="h-4 w-4" />
          {loading
            ? <Skeleton className="h-4 w-24" />
            : t("audit.entries", { count: total })}
        </div>
        <p className="text-sm text-muted-foreground">
          {t("audit.pageOf", { page, total: totalPages })}
        </p>
      </div>

      {/* Timeline */}
      <AuditTimeline items={items} loading={loading} hasFilters={hasFilters} />

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            {t("common.previous")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {t("common.next")}
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </div>
      )}
    </div>
  );
}
