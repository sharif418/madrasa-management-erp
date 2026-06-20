"use client";
// TajweedStats — radar chart of avg rubric scores + total-score trend line
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { fmtDate } from "./hifz-types";
import { CATEGORY_COLORS, type TajweedStats, type TajweedItem } from "./tajweed-types";

type Props = {
  stats: TajweedStats;
  trend: { date: string; total: number; grade: string }[];
  items: TajweedItem[];
  locale: string;
};

export function TajweedStatsCard({ stats, trend, locale }: Props) {
  const { t, dir } = useApp();

  const radarData = CATEGORY_COLORS.map((c) => {
    const avg =
      c.key === "madd" ? stats.avgMadd :
      c.key === "waqf" ? stats.avgWaqf :
      c.key === "tizkeer" ? stats.avgTizkeer :
      c.key === "nun" ? stats.avgNun :
      stats.avgMakhraj;
    return { category: t(c.labelKey).split(" ")[0], avg, full: 10 };
  });

  return (
    <div className="grid lg:grid-cols-2 gap-4" dir={dir()}>
      {/* Radar */}
      <Card className="py-4">
        <CardHeader>
          <CardTitle className="text-base">{t("hifz.tajweedStats")}</CardTitle>
          <CardDescription>{stats.count} {t("hifz.assessmentDate").toLowerCase()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius={90}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Radar
                  name={t("hifz.avgScore")}
                  dataKey="avg"
                  stroke="#0d9488"
                  fill="#0d9488"
                  fillOpacity={0.45}
                />
                <Tooltip contentStyle={{ fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Trend */}
      <Card className="py-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4 text-emerald-600" />
            {t("hifz.tajweedTrend")}
          </CardTitle>
          <CardDescription>{t("hifz.avgTotal")}: <span className="font-semibold text-emerald-700 dark:text-emerald-400">{stats.avgTotal}/100</span></CardDescription>
        </CardHeader>
        <CardContent>
          {trend.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{t("hifz.tajweedEmpty")}</p>
          ) : (
            <div className="h-64 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 8, right: 16, left: -8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => fmtDate(d, locale)}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [`${v} / 100`, t("hifz.totalScore")]}
                    labelFormatter={(d) => fmtDate(String(d), locale)}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#0d9488" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
