// AnalyticsView — predictive analytics + trends dashboard
// Sections: KPI cards → Charts (2-col) → Top Performers / At-Risk / Fund Health
"use client";
import { useCallback, useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { AnalyticsKpis, type AnalyticsKpis as KpisT } from "./analytics-kpis";
import { AnalyticsCharts } from "./analytics-charts";
import { AnalyticsPerformers, type TopPerformer, type AtRiskStudent, type FundHealth } from "./analytics-performers";

type AnalyticsData = {
  kpis: KpisT;
  enrollmentTrend: { month: string; count: number }[];
  hifzPerformance: { month: string; quality: number }[];
  attendanceTrend: { date: string; label: string; rate: number }[];
  financeTrend: { month: string; income: number; expense: number }[];
  topPerformers: TopPerformer[];
  atRiskStudents: AtRiskStudent[];
  fundHealth: FundHealth[];
};

export function AnalyticsView() {
  const { t, dir } = useApp();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/analytics", { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) setData(j.data as AnalyticsData);
      else throw new Error(j?.error || "Failed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6" dir={dir()}>
      {/* Header — violet→purple gradient tile with Islamic 8-point star pattern */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-600/20 ring-1 ring-white/30">
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
            <TrendingUp className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("analytics.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("analytics.subtitle")}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        </div>
      ) : !data ? (
        <Card className="border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40">
          <CardContent className="p-4 text-sm text-rose-700 dark:text-rose-300">
            Failed to load analytics data
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <AnalyticsKpis kpis={data.kpis} />

          {/* Charts */}
          <AnalyticsCharts
            enrollmentTrend={data.enrollmentTrend}
            financeTrend={data.financeTrend}
            attendanceTrend={data.attendanceTrend}
            hifzPerformance={data.hifzPerformance}
          />

          {/* Performers / At-risk / Fund health */}
          <AnalyticsPerformers
            topPerformers={data.topPerformers}
            atRiskStudents={data.atRiskStudents}
            fundHealth={data.fundHealth}
          />
        </>
      )}
    </div>
  );
}
