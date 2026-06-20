"use client";
// Dashboard home view: welcome banner, stat cards, charts, recent activity
import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, Megaphone, Sparkles, CalendarDays, RefreshCw } from "lucide-react";
import { useApp } from "@/store/app-store";
import { DashboardStats } from "./dashboard-stats";
import { DashboardCharts, type DashboardChartData } from "./dashboard-charts";

type DashboardData = {
  students: { total: number; active: number; hafiz: number };
  teachers: number;
  funds: { total: number; breakdown: { type: string; balance: number }[] };
  hifz30d: number;
  attendance: DashboardChartData["attendance"];
  recentHifz: {
    id: string; studentName: string; type: string; paraNumber: number;
    qualityRating: number | null; recordedAt: string;
  }[];
  recentNotices: { id: string; title: string; type: string; publishedAt: string }[];
  feeMonthly: { month: string; amount: number }[];
};

const NOTICE_TINT: Record<string, string> = {
  urgent: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  holiday: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  exam: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  event: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  general: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
};

const HIFZ_TYPE_TINT: Record<string, string> = {
  sabak: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  sabaq_para: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  dhor: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
};

function HijriDate({ locale }: { locale: string }) {
  const text = useMemo(() => {
    try {
      const cal = new Intl.DateTimeFormat(`${locale}-u-ca-islamic`, {
        day: "numeric", month: "long", year: "numeric",
      });
      return cal.format(new Date());
    } catch {
      return new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(new Date());
    }
  }, [locale]);
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-white/80">
      <CalendarDays className="size-4" />
      {text}
    </span>
  );
}

export function DashboardView() {
  const { t, locale, user } = useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Re-fetch on mount and whenever the user clicks Refresh (refreshKey bumps).
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/dashboard", {
          cache: "no-store",
          signal: controller.signal,
        });
        const json = await res.json();
        if (controller.signal.aborted) return;
        if (!res.ok || !json.ok) {
          setErr(json.error || `HTTP ${res.status}`);
        } else {
          setData(json.data as DashboardData);
          setErr(null);
        }
      } catch (e) {
        if (controller.signal.aborted) return;
        setErr(e instanceof Error ? e.message : "Network error");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLastUpdated(new Date());
        }
      }
    })();
    return () => controller.abort();
  }, [refreshKey]);

  const timeFmt = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" });
  const dateFmt = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });
  const lastUpdatedFmt = new Intl.DateTimeFormat(locale, {
    hour: "numeric", minute: "2-digit", second: "2-digit",
  });

  return (
    <div className="space-y-6">
      {/* Toolbar: last-updated timestamp + Refresh */}
      <div className="flex flex-wrap items-center justify-end gap-3 text-xs text-muted-foreground">
        {lastUpdated ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            {t("dashboard.lastUpdated")}:{" "}
            <span className="font-medium text-foreground tabular-nums">
              {lastUpdatedFmt.format(lastUpdated)}
            </span>
          </span>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={loading}
          className="h-8 gap-1.5 px-2.5 text-xs"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          {t("dashboard.refresh")}
        </Button>
      </div>

      {/* Welcome banner with Islamic geometric pattern overlay */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-lg sm:p-8">
        {/* Soft glow accents */}
        <div className="absolute -end-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="absolute -bottom-12 end-1/3 size-40 rounded-full bg-amber-300/20 blur-3xl" aria-hidden="true" />
        {/* CSS-only Islamic 8-point star tessellation (opacity-low, pointer-events-none) */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><g fill='none' stroke='white' stroke-width='1.2'><polygon points='30,4 36,18 50,18 39,28 44,42 30,34 16,42 21,28 10,18 24,18'/><polygon points='30,18 36,24 30,30 24,24'/></g></svg>\")",
            backgroundSize: "60px 60px",
            backgroundRepeat: "repeat",
          }}
        />
        {/* Crescent moon glyph in the corner for Islamic ambiance */}
        <svg
          className="pointer-events-none absolute -end-6 -bottom-6 size-32 text-white/10"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M16.5 3.5A9.5 9.5 0 1 0 20.5 17 7.5 7.5 0 0 1 16.5 3.5z" />
        </svg>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/25 backdrop-blur-sm">
              <Sparkles className="size-3.5" />
              {t("dashboard.banner.tag")} · {t("dashboard.title")}
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              {t("dashboard.welcome")}, {user?.name?.split(" ")[0] ?? "Guest"} 👋
            </h1>
            <p className="text-sm text-white/80 sm:text-base">{t("dashboard.subtitle")}</p>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <HijriDate locale={locale} />
            <span className="text-xs text-white/60">{timeFmt.format(new Date())}</span>
          </div>
        </div>
      </div>

      {err ? (
        <Card className="border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          ⚠️ {err}
        </Card>
      ) : null}

      <DashboardStats loading={loading} data={data ?? undefined} />

      <DashboardCharts loading={loading} data={data ?? undefined} />

      {/* Recent activity: Hifz + Notices side by side */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="size-4 text-amber-500" />
              {t("dashboard.hifz.recent")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : data && data.recentHifz.length > 0 ? (
              <ScrollArea className="max-h-96 pe-3">
                <ul className="space-y-2">
                  {data.recentHifz.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card/50 p-3 transition-colors hover:bg-accent/50">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{r.studentName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {dateFmt.format(new Date(r.recordedAt))} · {timeFmt.format(new Date(r.recordedAt))}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant="outline" className={HIFZ_TYPE_TINT[r.type] ?? ""}>
                          <span className="capitalize">{r.type.replace("_", " ")}</span>
                        </Badge>
                        <span className="text-xs text-muted-foreground">Para {r.paraNumber}</span>
                        {r.qualityRating ? (
                          <span className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-600">
                            <Star className="size-3 fill-amber-500 text-amber-500" />
                            {r.qualityRating}
                          </span>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("common.none")}</p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="size-4 text-violet-500" />
              {t("dashboard.notices.recent")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : data && data.recentNotices.length > 0 ? (
              <ScrollArea className="max-h-96 pe-3">
                <ul className="space-y-2">
                  {data.recentNotices.map((n) => (
                    <li key={n.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card/50 p-3 transition-colors hover:bg-accent/50">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{n.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {dateFmt.format(new Date(n.publishedAt))}
                        </p>
                      </div>
                      <Badge variant="outline" className={`shrink-0 capitalize ${NOTICE_TINT[n.type] ?? NOTICE_TINT.general}`}>
                        {n.type}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("common.none")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
