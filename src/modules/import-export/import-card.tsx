"use client";
// Shared import card component used by both Import Students and Import Teachers cards.
// Renders: download-template button, drag-and-drop file area, Import button, results table.
import * as React from "react";
import { toast } from "sonner";
import {
  Upload, FileText, Download, Loader2, CheckCircle2, XCircle, FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { downloadTextFile } from "./csv-templates";

export type ImportResult = {
  success: number;
  total: number;
  errors: { row: number; message: string }[];
};

type Props = {
  title: string;
  hint: string;
  icon: React.ReactNode;
  endpoint: string;            // e.g. "/api/import/students"
  templateFilename: string;    // e.g. "students-template.csv"
  templateContent: string;     // CSV string with header + sample rows
  columns: string[];           // Header columns to display in the format hint
  accent?: "emerald" | "teal";
};

export function ImportCard({
  title, hint, icon, endpoint,
  templateFilename, templateContent, columns,
  accent = "emerald",
}: Props) {
  const { t, dir } = useApp();
  const [file, setFile] = React.useState<File | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const accentBg = accent === "teal"
    ? "from-teal-500 to-emerald-600"
    : "from-emerald-500 to-teal-600";

  const onDownloadTemplate = () => {
    downloadTextFile(templateFilename, templateContent);
    toast.success(t("importExport.templateDownloaded"));
  };

  const onPickFile = (f: File | null) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv") && f.type !== "text/csv") {
      toast.error(t("importExport.invalidFile"));
      return;
    }
    setFile(f);
    setResult(null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onPickFile(f);
  };

  const onImport = async () => {
    if (!file) {
      toast.error(t("importExport.noFileSelected"));
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(endpoint, { method: "POST", body: fd, credentials: "include" });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || t("importExport.importFailed"));
      const data = j.data as ImportResult;
      setResult(data);
      toast.success(t("importExport.importSuccess", { success: data.success, total: data.total }));
      if (data.errors.length > 0) {
        toast.warning(`${data.errors.length} row(s) skipped — see details`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("importExport.importFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      <CardHeader className="gap-2 border-b bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-900/10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn("grid size-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md", accentBg)}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs">{hint}</CardDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDownloadTemplate}
            className="gap-1.5"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">{t("importExport.downloadTemplate")}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-5">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-all",
            dragging
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
              : "border-slate-300 hover:border-emerald-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900/30"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <>
              <FileSpreadsheet className="size-8 text-emerald-600" />
              <p className="text-sm font-medium truncate max-w-full" dir="ltr">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            </>
          ) : (
            <>
              <Upload className="size-8 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">{t("importExport.uploadCsv")}</p>
            </>
          )}
        </div>

        {/* Import button */}
        <Button
          onClick={onImport}
          disabled={!file || loading}
          className={cn("w-full gap-2 bg-gradient-to-r text-white shadow-md", accentBg)}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {loading ? t("importExport.importing") : t("importExport.import")}
        </Button>

        {/* CSV format hint */}
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <FileText className="size-3.5" />
            {t("importExport.csvFormat")}
          </p>
          <p className="mb-2 text-xs text-muted-foreground">{t("importExport.csvFormatDesc")}</p>
          <div className="flex flex-wrap gap-1" dir="ltr">
            {columns.map((c) => (
              <span key={c} className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-mono text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-3 rounded-lg border bg-card p-4">
            <p className="text-sm font-semibold">{t("importExport.results")}</p>
            <div className="grid grid-cols-3 gap-3">
              <ResultStat
                label={t("importExport.success")}
                value={result.success}
                icon={<CheckCircle2 className="size-4" />}
                tone="emerald"
              />
              <ResultStat
                label={t("importExport.errors")}
                value={result.errors.length}
                icon={<XCircle className="size-4" />}
                tone="rose"
              />
              <ResultStat
                label={t("importExport.total")}
                value={result.total}
                icon={<FileSpreadsheet className="size-4" />}
                tone="slate"
              />
            </div>
            {result.errors.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-rose-200 dark:border-rose-900/50">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                    <tr>
                      <th className="px-3 py-2 text-start font-medium">{t("importExport.errorRow")}</th>
                      <th className="px-3 py-2 text-start font-medium">{t("importExport.errorMessage")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((e, i) => (
                      <tr key={i} className="border-t border-rose-100 dark:border-rose-900/30">
                        <td className="px-3 py-1.5 tabular-nums">{e.row}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ResultStat({
  label, value, icon, tone,
}: {
  label: string; value: number; icon: React.ReactNode;
  tone: "emerald" | "rose" | "slate";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    slate: "bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
  };
  return (
    <div className={cn("rounded-lg p-2.5 text-center", tones[tone])}>
      <div className="mb-1 flex items-center justify-center">{icon}</div>
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
    </div>
  );
}
