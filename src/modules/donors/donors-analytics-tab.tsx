"use client";
// DonorsAnalyticsTab — 6-month donation trend + fund breakdown pie + geographic dist.
import * as React from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, PieChart as PieIcon, MapPin } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { FUND_TINT, countryFlag, type Donation, type Donor } from "./types";

const FUND_COLORS: Record<string, string> = {
  zakat: "#10b981",
  lillah: "#14b8a6",
  waqf: "#8b5cf6",
  sadaqah: "#f59e0b",
  general: "#64748b",
};

const CHART_TIP = {
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--background)",
  color: "var(--foreground)",
  fontSize: 12,
};

export function DonorsAnalyticsTab({
  donations, donors, loading,
}: {
  donations: Donation[];
  donors: Donor[];
  loading: boolean;
}) {
  const { t, locale, dir } = useApp();
  const cur = (n: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US", {
      maximumFractionDigits: 0,
    }).format(n || 0);

  // 6-month donation trend
  const trend = React.useMemo(() => {
    const months: { key: string; label: string; total: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = new Intl.DateTimeFormat(locale, { month: "short" }).format(d);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label, total: 0 });
    }
    for (const dn of donations) {
      if (dn.status !== "confirmed") continue;
      const d = new Date(dn.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const m = months.find((x) => x.key === key);
      if (m) m.total += dn.amount;
    }
    return months;
  }, [donations, locale]);

  // Fund breakdown
  const fundData = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const dn of donations) {
      if (dn.status !== "confirmed") continue;
      map.set(dn.fund, (map.get(dn.fund) || 0) + dn.amount);
    }
    return Array.from(map.entries()).map(([name, value]) => ({
      name, value, color: FUND_COLORS[name] || "#64748b",
    }));
  }, [donations]);

  // Geographic distribution (by donor country)
  const geoData = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const d of donors) {
      const c = (d.country || "Unknown").trim();
      map.set(c, (map.get(c) || 0) + d.totalContributed);
    }
    return Array.from(map.entries())
      .map(([country, total]) => ({ country, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [donors]);

  const totalRaised = donations.filter((d) => d.status === "confirmed").reduce((s, d) => s + d.amount, 0);
  const hasData = donations.length > 0 || donors.length > 0;

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2" dir={dir()}>
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="rounded-2xl border border-dashed bg-card/40 p-12 text-center" dir={dir()}>
        <PieIcon className="mx-auto mb-3 size-12 opacity-30" />
        <p className="text-sm text-muted-foreground">{t("donors.noAnalytics")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir={dir()}>
      {/* Top KPI strip */}
      <Card className="border-0 text-white bg-gradient-to-br from-rose-500 via-pink-600 to-fuchsia-700 shadow-lg">
        <CardContent className="p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-90">{t("donors.totalRaised")}</p>
            <p className="text-3xl font-bold tabular-nums">৳{cur(totalRaised)}</p>
          </div>
          <TrendingUp className="size-10 opacity-70" />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Trend bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="size-4 text-rose-500" />
              <h3 className="font-semibold text-sm">{t("donors.donationTrend")}</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={50} tickFormatter={(v) => `৳${cur(v as number)}`} />
                  <Tooltip contentStyle={CHART_TIP} formatter={(v: number) => [`৳${cur(v)}`, ""]} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                  <Bar dataKey="total" fill="#ec4899" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Fund breakdown pie */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <PieIcon className="size-4 text-rose-500" />
              <h3 className="font-semibold text-sm">{t("donors.fundBreakdown")}</h3>
            </div>
            <div className="h-64">
              {fundData.length === 0 ? (
                <div className="grid h-full place-items-center text-sm text-muted-foreground">{t("donors.noAnalytics")}</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={fundData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none">
                      {fundData.map((f) => <Cell key={f.name} fill={f.color} />)}
                    </Pie>
                    <Tooltip contentStyle={CHART_TIP} formatter={(v: number) => [`৳${cur(v)}`, ""]} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} formatter={(v) => (
                      <span className="capitalize text-muted-foreground">{v}</span>
                    )} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geographic distribution */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="size-4 text-rose-500" />
            <h3 className="font-semibold text-sm">{t("donors.geoDist")}</h3>
          </div>
          {geoData.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">{t("donors.noAnalytics")}</div>
          ) : (
            <div className="space-y-2">
              {geoData.map((g) => {
                const max = geoData[0]?.total || 1;
                const pct = Math.max(2, (g.total / max) * 100);
                return (
                  <div key={g.country} className="flex items-center gap-3">
                    <span className="text-xl shrink-0">{countryFlag(g.country)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="truncate">{g.country}</span>
                        <span className="font-semibold tabular-nums">৳{cur(g.total)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-600")}
                          style={{ width: pct + "%" }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
