// BackupView — export/import tenant data as JSON.
// Emerald→teal gradient header tile + Islamic pattern. 2 cards.
"use client";
import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/store/app-store";
import { DatabaseBackup, Download, Loader2, FileJson, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImportCard } from "./import-card";

const ISLAMIC_PATTERN: React.CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='white' stroke-width='1'><polygon points='20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14'/></g></svg>\")",
  backgroundSize: "40px 40px",
  backgroundRepeat: "repeat",
};

const LAST_BACKUP_KEY = "mm-last-backup";

type Stats = { students: number; teachers: number; transactions: number };

export function BackupView() {
  const { t, dir } = useApp();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/dashboard", { cache: "no-store" });
        const j = await r.json();
        if (j?.ok) {
          setStats({
            students: j.data.students.total ?? 0,
            teachers: j.data.teachers ?? 0,
            transactions: (j.data.feeMonthly ?? []).reduce(
              (s: number, m: { amount: number }) => s + (m.amount || 0), 0,
            ) > 0 ? j.data.feeMonthly.length : 0,
          });
        }
      } catch {
        /* non-critical */
      } finally {
        setLoading(false);
      }
    })();
    const stored = typeof window !== "undefined" ? localStorage.getItem(LAST_BACKUP_KEY) : null;
    if (stored) setLastBackup(stored);
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const r = await fetch("/api/backup/export", { cache: "no-store" });
      if (!r.ok) {
        const j = await r.json().catch(() => null);
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disp = r.headers.get("Content-Disposition") || "";
      const m = disp.match(/filename="?([^"]+)"?/);
      a.download = m?.[1] || `backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      const now = new Date().toISOString();
      localStorage.setItem(LAST_BACKUP_KEY, now);
      setLastBackup(now);
      toast.success(t("backup.exported"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }, [t]);

  const formatDate = useCallback((iso: string) => {
    try {
      return new Intl.DateTimeFormat(dir() === "rtl" ? "ar" : "en-GB", {
        dateStyle: "medium", timeStyle: "short",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }, [dir]);

  return (
    <div dir={dir()} className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/20 ring-1 ring-white/30">
            <div className="pointer-events-none absolute inset-0 opacity-[0.15]" aria-hidden="true" style={ISLAMIC_PATTERN} />
            <DatabaseBackup className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("backup.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("backup.subtitle")}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Export Card */}
        <Card className="border-border/60 transition-all hover:shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Download className="size-4 text-emerald-600" />
                {t("backup.exportCardTitle")}
              </CardTitle>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <FileJson className="me-1 size-3" /> JSON
              </Badge>
            </div>
            <CardDescription>{t("backup.exportDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <StatTile label={t("backup.students")} value={loading ? "—" : String(stats?.students ?? 0)} />
              <StatTile label={t("backup.teachers")} value={loading ? "—" : String(stats?.teachers ?? 0)} />
              <StatTile label={t("backup.transactions")} value={loading ? "—" : String(stats?.transactions ?? 0)} />
            </div>
            {/* Last backup */}
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
              <span className="text-muted-foreground">{t("backup.lastBackup")}</span>
              <span className="font-medium">
                {lastBackup ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    {formatDate(lastBackup)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">{t("backup.never")}</span>
                )}
              </span>
            </div>
            <Button
              onClick={handleExport}
              disabled={exporting}
              className="w-full gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
            >
              {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              {exporting ? t("backup.exporting") : t("backup.export")}
            </Button>
          </CardContent>
        </Card>

        {/* Import Card */}
        <ImportCard />
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-center">
      <div className="text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
