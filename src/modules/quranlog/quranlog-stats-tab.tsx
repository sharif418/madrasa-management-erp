// QuranLogStatsTab — 30-day daily bar chart (recharts), top readers, class breakdown.
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Award, BookOpen, Users, TrendingUp, CheckCircle2 } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import type { QuranLogAggStats } from "./quranlog-types";

export function QuranLogStatsTab() {
  const { t, dir, locale } = useApp();
  const [stats, setStats] = useState<QuranLogAggStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quranlog/stats", { cache: "no-store" });
      const j = await res.json();
      if (j?.ok) setStats(j.data as QuranLogAggStats);
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

  const chartData = useMemo(() => {
    if (!stats) return [];
    return stats.daily.map((d) => {
      const dt = new Date(d.date);
      const label = new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "bn" ? "bn-BD" : "en", {
        month: "short", day: "numeric",
      }).format(dt);
      return { label, pages: d.pages, date: d.date };
    });
  }, [stats, locale]);

  // Class breakdown max for bar widths
  const classBars = useMemo(() => {
    if (!stats) return [];
    const max = Math.max(1, ...stats.classBreakdown.map((c) => c.pages));
    return stats.classBreakdown
      .slice(0, 8)
      .map((c) => ({ ...c, width: (c.pages / max) * 100 }));
  }, [stats]);

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
      </div>
    );
  }

  if (!stats || stats.totalPages === 0) {
    return (
      <div dir={dir()} className="flex flex-col items-center gap-2 py-16 text-center">
        <Award className="size-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{t("quranlog.empty")}</p>
      </div>
    );
  }

  const kpis = [
    { label: t("quranlog.totalPages"), value: cur(stats.totalPages), icon: BookOpen, tone: "from-emerald-500 to-teal-600" },
    { label: t("quranlog.activeReaders"), value: cur(stats.activeReaders), icon: Users, tone: "from-sky-500 to-cyan-600" },
    { label: t("quranlog.dailyAvg"), value: cur(stats.totalPages > 0 ? Math.round(stats.totalPages / 30) : 0), icon: TrendingUp, tone: "from-amber-500 to-orange-600" },
    { label: t("quranlog.khatmCompletions"), value: cur(stats.khatmCompletions), icon: CheckCircle2, tone: "from-violet-500 to-purple-600" },
  ];

  return (
    <div dir={dir()} className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="border-border/60 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`grid size-10 place-items-center rounded-xl bg-gradient-to-br ${k.tone} text-white shadow-sm shrink-0`}>
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground truncate">{k.label}</p>
                  <p className="text-xl font-bold tabular-nums truncate">{k.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Daily reading bar chart */}
        <Card className="border-border/60">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-semibold">{t("quranlog.dailyReading")}</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 8, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                  <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={3} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "var(--foreground)" }}
                    formatter={(v: number) => [cur(v), t("quranlog.pages")]}
                  />
                  <Bar dataKey="pages" radius={[4, 4, 0, 0]} fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top readers */}
        <Card className="border-border/60">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-semibold">{t("quranlog.topReaders")}</h3>
            {stats.topReaders.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">{t("quranlog.empty")}</p>
            ) : (
              <ScrollArea className="max-h-72">
                <div className="space-y-2">
                  {stats.topReaders.map((s, idx) => (
                    <div key={s.studentId} className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2">
                      <span className="grid size-7 place-items-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{s.studentName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{s.className || "—"}</p>
                      </div>
                      <span className="text-sm font-bold tabular-nums shrink-0">{cur(s.total)}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Class breakdown */}
        <Card className="border-border/60 lg:col-span-2">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-semibold">{t("quranlog.classBreakdown")}</h3>
            {classBars.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">{t("quranlog.empty")}</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {classBars.map((b) => (
                  <div key={b.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate font-medium">{b.name}</span>
                      <span className="text-muted-foreground tabular-nums">{cur(b.pages)}</span>
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
      </div>
    </div>
  );
}
