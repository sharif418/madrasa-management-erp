// CustomReportsView — 3-step builder: entity → columns → filters + preview + export.
"use client";
import { useCallback, useState } from "react";
import { useApp } from "@/store/app-store";
import { LayoutList, Loader2, FileBarChart, FileJson, Eye } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EntitySelector } from "./entity-selector";
import { ColumnSelector } from "./column-selector";
import { FilterBuilder } from "./filter-builder";
import { ReportPreview } from "./report-preview";
import type { EntityType, Filter } from "./types";

const ISLAMIC_PATTERN: React.CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='white' stroke-width='1'><polygon points='20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14'/></g></svg>\")",
  backgroundSize: "40px 40px",
  backgroundRepeat: "repeat",
};

export function CustomReportsView() {
  const { t, dir } = useApp();
  const [entity, setEntity] = useState<EntityType | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([]);
  const [generating, setGenerating] = useState(false);

  const onEntityChange = useCallback((e: EntityType) => {
    setEntity(e);
    setColumns([]);
    setFilters([]);
    setPreviewRows([]);
  }, []);

  const handlePreview = useCallback(async () => {
    if (!entity) return toast.error(t("customreports.selectEntityFirst"));
    if (columns.length === 0) return toast.error(t("customreports.selectColumnsFirst"));
    setPreviewing(true);
    try {
      const r = await fetch("/api/custom-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, columns, filters, format: "json" }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setPreviewRows((j.data.rows as Record<string, unknown>[]).slice(0, 10));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setPreviewing(false);
    }
  }, [entity, columns, filters, t]);

  const handlePdf = useCallback(async () => {
    if (!entity) return toast.error(t("customreports.selectEntityFirst"));
    if (columns.length === 0) return toast.error(t("customreports.selectColumnsFirst"));
    setGenerating(true);
    try {
      const r = await fetch("/api/custom-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, columns, filters, format: "pdf" }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => null);
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast.success(t("customreports.generated"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setGenerating(false);
    }
  }, [entity, columns, filters, t]);

  const handleJson = useCallback(async () => {
    if (!entity) return toast.error(t("customreports.selectEntityFirst"));
    if (columns.length === 0) return toast.error(t("customreports.selectColumnsFirst"));
    setGenerating(true);
    try {
      const r = await fetch("/api/custom-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, columns, filters, format: "json" }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      const blob = new Blob([JSON.stringify(j.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${entity}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success(t("customreports.generated"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setGenerating(false);
    }
  }, [entity, columns, filters, t]);

  return (
    <div dir={dir()} className="space-y-6 p-4 sm:p-6">
      {/* Header — violet→purple */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-600/20 ring-1 ring-white/30">
            <div className="pointer-events-none absolute inset-0 opacity-[0.15]" aria-hidden="true" style={ISLAMIC_PATTERN} />
            <LayoutList className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("customreports.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("customreports.subtitle")}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Builder column */}
        <div className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t("customreports.selectEntity")}</CardTitle>
            </CardHeader>
            <CardContent>
              <EntitySelector selected={entity} onSelect={onEntityChange} />
            </CardContent>
          </Card>

          {entity && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t("customreports.selectColumns")}</CardTitle>
                <CardDescription className="text-xs">{t(`customreports.${entity}`)}</CardDescription>
              </CardHeader>
              <CardContent>
                <ColumnSelector entity={entity} selected={columns} onChange={setColumns} />
              </CardContent>
            </Card>
          )}

          {entity && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t("customreports.applyFilters")}</CardTitle>
              </CardHeader>
              <CardContent>
                <FilterBuilder entity={entity} filters={filters} onChange={setFilters} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action + preview column */}
        <div className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t("customreports.preview")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Actions */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Button
                  onClick={handlePreview}
                  disabled={!entity || columns.length === 0 || previewing}
                  variant="outline" className="gap-1.5"
                >
                  {previewing ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
                  {t("customreports.preview")}
                </Button>
                <Button
                  onClick={handlePdf}
                  disabled={!entity || columns.length === 0 || generating}
                  className="gap-1.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600"
                >
                  {generating ? <Loader2 className="size-4 animate-spin" /> : <FileBarChart className="size-4" />}
                  {t("customreports.generatePdf")}
                </Button>
                <Button
                  onClick={handleJson}
                  disabled={!entity || columns.length === 0 || generating}
                  variant="outline" className="gap-1.5"
                >
                  <FileJson className="size-4" />
                  {t("customreports.exportJson")}
                </Button>
              </div>

              <ReportPreview
                loading={previewing}
                columns={columns}
                rows={previewRows}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
