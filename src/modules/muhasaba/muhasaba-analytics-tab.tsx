"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, TrendingUp, Sparkles, Star, Users } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/store/app-store";

import { fmtDateShort, type MuhasabaStats } from "./types";

export function MuhasabaAnalyticsTab() {
  const { t, dir } = useApp();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MuhasabaStats | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/muhasaba/stats", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
        setStats(json.data as MuhasabaStats);
      } catch (err) {
        toast.error(t("muhasaba.loadFailed"), { description: err instanceof Error ? err.message : "" });
        setStats(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64 w-full" />
        <div className="sr-only" aria-live="polite">
          <Loader2 className="size-4 animate-spin" />
          Loading analytics...
        </div>
      </div>
    );
  }

  if (!stats || (stats.dailyStacked.length === 0 && stats.topStudents.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 py-16 text-center">
        <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md ring-1 ring-white/30">
          <Sparkles className="size-8" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">{t("muhasaba.noAnalytics")}</h3>
      </div>
    );
  }

  const adhkarPie = [
    { name: t("muhasaba.adhkarRateLabel"), value: Math.round(stats.adhkarRate * 100), color: "#10b981" },
    { name: t("common.none"), value: Math.round((1 - stats.adhkarRate) * 100), color: "#e5e7eb" },
  ];

  return (
    <div className="space-y-4" dir={dir()}>
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard
          icon={<TrendingUp className="size-5" />}
          label={t("muhasaba.avgConsistency")}
          value={`${Math.round(stats.avgSalahConsistency * 100)}%`}
          tint="from-emerald-500 to-teal-600"
        />
        <KpiCard
          icon={<Sparkles className="size-5" />}
          label={t("muhasaba.adhkarRateLabel")}
          value={`${Math.round(stats.adhkarRate * 100)}%`}
          tint="from-teal-500 to-cyan-600"
        />
        <KpiCard
          icon={<Star className="size-5" />}
          label={t("muhasaba.avgAkhlaq")}
          value={`${stats.avgAkhlaq.toFixed(2)} / 5`}
          tint="from-amber-500 to-orange-600"
        />
      </div>

      {/* Salah stacked bar */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <p className="text-sm font-semibold mb-3">{t("muhasaba.consistency")}</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.dailyStacked}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickFormatter={fmtDateShort} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="jamaat" stackId="s" fill="#10b981" name={t("muhasaba.jamaat")} />
              <Bar dataKey="alone" stackId="s" fill="#2dd4bf" name={t("muhasaba.alone")} />
              <Bar dataKey="qadha" stackId="s" fill="#f59e0b" name={t("muhasaba.qadha")} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Adhkar donut */}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm font-semibold mb-3">{t("muhasaba.adhkarRate")}</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={adhkarPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {adhkarPie.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Akhlaq trend */}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm font-semibold mb-3">{t("muhasaba.akhlaqTrend")}</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.akhlaqTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={fmtDateShort} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="avg" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top students */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Users className="size-4 text-emerald-600" />
          <p className="text-sm font-semibold">{t("muhasaba.topStudents")}</p>
        </div>
        {stats.topStudents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{t("muhasaba.empty")}</p>
        ) : (
          <div className="space-y-2">
            {stats.topStudents.map((s, idx) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    {s.rollNo && <p className="text-xs text-muted-foreground">#{s.rollNo}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {Math.round(s.consistency * 100)}%
                  </Badge>
                  <div className="flex items-center gap-0.5">
                    <Star className="size-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-medium">{s.akhlaq.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  icon, label, value, tint,
}: { icon: React.ReactNode; label: string; value: string; tint: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`grid size-10 place-items-center rounded-lg bg-gradient-to-br ${tint} text-white shadow-sm`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}
