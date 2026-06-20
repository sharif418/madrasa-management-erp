// WaiversStatsTab — by-type pie (CSS conic gradient), by-class bar chart,
// total discount value card, top 5 students by discount.
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { TrendingDown, Award } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WAIVER_TYPES, WAIVER_TYPE_KEYS, type WaiverStats, type WaiverType } from "./waivers-types";

// Pie chart slice colors (must match WAIVER_TYPES tile gradients visually)
const SLICE_COLORS: Record<WaiverType, string> = {
  scholarship: "#10b981",   // emerald-500
  sibling: "#0ea5e9",       // sky-500
  orphan: "#f43f5e",        // rose-500
  staff_child: "#8b5cf6",   // violet-500
  zakat_eligible: "#f59e0b", // amber-500
};

export function WaiversStatsTab() {
  const { t, dir, locale } = useApp();
  const [stats, setStats] = useState<WaiverStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/waivers/stats", { cache: "no-store" });
      const j = await res.json();
      if (j?.ok) setStats(j.data as WaiverStats);
    } catch {
      toast.error("Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const cur = useMemo(
    () => (n: number) =>
      new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US", {
        maximumFractionDigits: 0,
      }).format(n || 0),
    [locale]
  );

  // Build pie chart slices
  const slices = useMemo(() => {
    if (!stats) return [];
    const total = WAIVER_TYPE_KEYS.reduce(
      (acc, k) => acc + (stats.byType[k]?.count || 0), 0
    );
    if (total === 0) return [];
    let acc = 0;
    return WAIVER_TYPE_KEYS.map((k) => {
      const count = stats.byType[k]?.count || 0;
      const pct = total > 0 ? (count / total) * 100 : 0;
      const start = acc;
      acc += pct;
      return { key: k, count, pct, start, end: acc };
    }).filter((s) => s.count > 0);
  }, [stats]);

  // Conic-gradient string for the pie chart
  const pieGradient = useMemo(() => {
    if (slices.length === 0) return "";
    const stops = slices.map((s) => {
      const color = SLICE_COLORS[s.key];
      return `${color} ${s.start}% ${s.end}%`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  }, [slices]);

  // Bar chart data: by class
  const classBars = useMemo(() => {
    if (!stats) return [];
    const entries = Object.entries(stats.byClass).map(([name, v]) => ({
      name, count: v.count, fixed: v.totalFixed, pct: v.totalPct,
    }));
    const maxCount = Math.max(1, ...entries.map((e) => e.count));
    return entries
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((e) => ({ ...e, width: (e.count / maxCount) * 100 }));
  }, [stats]);

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
      </div>
    );
  }

  if (!stats || stats.totalAll === 0) {
    return (
      <div dir={dir()} className="flex flex-col items-center gap-2 py-16 text-center">
        <Award className="size-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{t("waivers.empty")}</p>
      </div>
    );
  }

  return (
    <div dir={dir()} className="grid gap-4 lg:grid-cols-2">
      {/* By Type pie chart */}
      <Card className="border-border/60">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold">{t("waivers.byType")}</h3>
          <div className="flex items-center gap-6 flex-wrap">
            <div
              className="size-32 rounded-full shrink-0 ring-4 ring-background shadow-md"
              style={{ background: pieGradient || "var(--muted)" }}
              aria-label={t("waivers.byType")}
              role="img"
            />
            <div className="space-y-2 min-w-[140px]">
              {slices.map((s) => {
                const meta = WAIVER_TYPES[s.key];
                const Icon = meta.icon;
                return (
                  <div key={s.key} className="flex items-center gap-2 text-xs">
                    <span
                      className="size-3 rounded-sm shrink-0"
                      style={{ backgroundColor: SLICE_COLORS[s.key] }}
                    />
                    <Icon className="size-3 text-muted-foreground" />
                    <span className="truncate flex-1">{t(meta.labelKey)}</span>
                    <span className="font-semibold tabular-nums">{s.count}</span>
                    <span className="text-muted-foreground tabular-nums w-10 text-end">
                      {cur(s.pct)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* By Class bar chart */}
      <Card className="border-border/60">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold">{t("waivers.byClass")}</h3>
          {classBars.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">{t("waivers.empty")}</p>
          ) : (
            <div className="space-y-2.5">
              {classBars.map((b) => (
                <div key={b.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate font-medium">{b.name}</span>
                    <span className="text-muted-foreground tabular-nums">{b.count}</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                      style={{ width: `${b.width}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total discount value card */}
      <Card className="overflow-hidden border-0 text-white bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
        <CardContent className="p-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider opacity-90">{t("waivers.totalValue")}</p>
            <p className="text-3xl font-bold mt-1 tabular-nums">৳{cur(stats.totalFixed)}</p>
            <p className="text-xs opacity-90 mt-2">
              {stats.totalActive} {t("waivers.totalActive")} · {cur(stats.avgPct)}% {t("waivers.avgDiscount")}
            </p>
          </div>
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <TrendingDown className="size-7" />
          </div>
        </CardContent>
      </Card>

      {/* Top 5 students */}
      <Card className="border-border/60">
        <CardContent className="p-5 space-y-3">
          <h3 className="text-sm font-semibold">{t("waivers.topStudents")}</h3>
          {stats.topStudents.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">{t("waivers.empty")}</p>
          ) : (
            <ScrollArea className="max-h-72">
              <div className="space-y-2">
                {stats.topStudents.map((s, idx) => {
                  const meta = WAIVER_TYPES[s.type as WaiverType] || WAIVER_TYPES.scholarship;
                  const Icon = meta.icon;
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2"
                    >
                      <span className="grid size-7 place-items-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{s.studentName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {s.className || "—"}
                        </p>
                      </div>
                      <Icon className={`size-4 shrink-0 ${meta.tone.split(" ").filter((c) => c.startsWith("text-")).join(" ")}`} />
                      <div className="text-end shrink-0">
                        <p className="text-sm font-bold tabular-nums">
                          {s.discountType === "percentage"
                            ? `${cur(s.percentage)}%`
                            : `৳${cur(s.fixedAmount)}`}
                        </p>
                        <Badge variant="outline" className="text-[9px] mt-0.5">
                          {t(meta.labelKey)}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
