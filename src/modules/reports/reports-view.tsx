"use client";
// Reports View — header with PDF export + tabbed insights across 5 domains.
import { useEffect, useState } from "react";
import { useApp } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileBarChart, Printer, AlertTriangle } from "lucide-react";
import { ReportsStudentsTab } from "./reports-students-tab";
import { ReportsFinanceTab } from "./reports-finance-tab";
import { ReportsHifzTab } from "./reports-hifz-tab";
import { ReportsAttendanceTab } from "./reports-attendance-tab";
import { ReportsFeesTab } from "./reports-fees-tab";
import type { ReportsData } from "./reports-types";

const TABS = ["students", "finance", "hifz", "attendance", "fees"] as const;
type TabKey = (typeof TABS)[number];

export function ReportsView() {
  const { t, dir, tenantName } = useApp();
  const [tab, setTab] = useState<TabKey>("students");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReportsData | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/reports", { cache: "no-store", credentials: "include" });
        const j = await res.json();
        if (!alive) return;
        if (!res.ok || !j?.ok) throw new Error(j?.error || `HTTP ${res.status}`);
        setData(j.data as ReportsData);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : t("reports.error"));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [t]);

  return (
    <div dir={dir()} className="space-y-6">
      {/* Print styles: only the .printable area is visible; nav/sidebar hidden */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .printable, .printable * { visibility: visible !important; }
          .printable { position: absolute; inset: 0; padding: 16px; }
          .no-print { display: none !important; }
          .printable .chart-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* Header — part of printable area */}
      <div className="printable space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
              <FileBarChart className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{t("reports.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("reports.subtitle")}</p>
            </div>
          </div>
          <Button onClick={() => window.print()} variant="outline" className="gap-2">
            <Printer className="size-4" />
            {t("reports.export")}
          </Button>
        </div>

        {/* Print-only header — visible only when printing */}
        <div className="hidden print:block">
          <h1 className="text-xl font-bold">{tenantName} — {t("reports.title")}</h1>
          <p className="text-xs text-muted-foreground">
            {t("reports.subtitle")} · {new Date().toLocaleString()}
          </p>
          <hr className="my-3" />
        </div>

        {error ? (
          <Card className="border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40">
            <CardContent className="flex items-center gap-3 py-4 text-sm text-rose-700 dark:text-rose-300">
              <AlertTriangle className="size-5 shrink-0" />
              {error}
            </CardContent>
          </Card>
        ) : null}

        {loading ? (
          <ReportSkeletons />
        ) : data ? (
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
            <TabsList className="no-print flex w-fit flex-wrap h-auto">
              {TABS.map((k) => (
                <TabsTrigger key={k} value={k}>{t(`reports.${k}`)}</TabsTrigger>
              ))}
            </TabsList>

            <div className="chart-grid mt-4">
              <TabsContent value="students" className="focus-visible:outline-none">
                <ReportsStudentsTab data={data.studentSummary} />
              </TabsContent>
              <TabsContent value="finance" className="focus-visible:outline-none">
                <ReportsFinanceTab data={data.financeSummary} />
              </TabsContent>
              <TabsContent value="hifz" className="focus-visible:outline-none">
                <ReportsHifzTab data={data.hifzSummary} />
              </TabsContent>
              <TabsContent value="attendance" className="focus-visible:outline-none">
                <ReportsAttendanceTab data={data.attendanceSummary} />
              </TabsContent>
              <TabsContent value="fees" className="focus-visible:outline-none">
                <ReportsFeesTab data={data.feeSummary} />
              </TabsContent>
            </div>
          </Tabs>
        ) : null}
      </div>
    </div>
  );
}

function ReportSkeletons() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}
