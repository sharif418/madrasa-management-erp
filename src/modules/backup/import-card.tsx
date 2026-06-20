// ImportCard — file upload + restore button for backup JSON.
// Drag-and-drop + click-to-browse. Posts to /api/backup/import.
"use client";
import { useCallback, useRef, useState } from "react";
import { useApp } from "@/store/app-store";
import { Upload, Loader2, FileJson, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ImportResult = {
  message: string;
  total: number;
  counts: Record<string, number>;
  tenantName: string | null;
  exportedAt: string | null;
};

export function ImportCard() {
  const { t, dir } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = useCallback((f: File | null) => {
    if (!f) return;
    if (!f.name.endsWith(".json") && f.type !== "application/json") {
      toast.error(t("backup.invalidFile"));
      return;
    }
    setFile(f);
    setResult(null);
  }, [t]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  }, [pickFile]);

  const handleImport = useCallback(async () => {
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/backup/import", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setResult(j.data as ImportResult);
      toast.success(t("backup.imported", { count: (j.data as ImportResult).total }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }, [file, t]);

  return (
    <Card className="border-border/60 transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="size-4 text-emerald-600" />
          {t("backup.importCardTitle")}
        </CardTitle>
        <CardDescription>{t("backup.importDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        <div
          dir={dir()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
            dragOver
              ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20"
              : "border-border/60 hover:border-emerald-300 hover:bg-muted/30"
          }`}
        >
          <div className="grid size-10 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Upload className="size-5" />
          </div>
          <p className="text-sm text-muted-foreground">{t("backup.dragDrop")}</p>
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Selected file chip */}
        {file && (
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
            <FileJson className="size-4 shrink-0 text-emerald-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <Button
              variant="ghost" size="icon" className="size-7"
              onClick={() => { setFile(null); setResult(null); }}
              aria-label="Remove file"
            >
              <X className="size-4" />
            </Button>
          </div>
        )}

        {/* Warning */}
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <span>{t("backup.warning")}</span>
        </div>

        {/* Result */}
        {result && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-950/30">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{result.message}</p>
            <div className="mt-2 grid max-h-32 grid-cols-2 gap-1 overflow-y-auto text-xs text-emerald-700 dark:text-emerald-300">
              {Object.entries(result.counts).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-1">
                  <span className="truncate">{k}</span>
                  <span className="font-mono tabular-nums">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleImport}
          disabled={!file || importing}
          variant="outline"
          className="w-full gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
        >
          {importing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {importing ? t("backup.importing") : t("backup.import")}
        </Button>
      </CardContent>
    </Card>
  );
}
