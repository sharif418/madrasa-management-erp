"use client";
// ProfileHifzTab — 30-para grid, quality trend line chart, recent records table
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, BookOpenCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/store/app-store";
import { useT } from "./i18n";
import { ProfileData, type ParaStatus, paraCellClass, fmtDate, starString } from "./profile-types";

type Props = { data: ProfileData; locale: string };

export function ProfileHifzTab({ data, locale }: Props) {
  const t = useT();
  const dir = useApp((s) => s.dir());
  const { hifz } = data;
  const memorized = hifz.parasCovered.filter((p) => p.status === "memorized").length;
  const inProgress = hifz.parasCovered.filter((p) => p.status === "in-progress").length;

  // Trend: last 20 rated records oldest→newest (reverse of recentRecords)
  const trend = [...hifz.recentRecords]
    .filter((r) => r.qualityRating != null)
    .slice(0, 20)
    .reverse()
    .map((r, i) => ({ idx: i + 1, quality: r.qualityRating ?? 0, para: r.paraNumber, type: r.type }));

  return (
    <div className="space-y-4">
      {/* Para grid */}
      <Card className="py-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <BookOpenCheck className="size-4 text-emerald-600" />
              {t("studentProfile.parasMemorized")}
            </span>
            <Badge variant="outline" className="font-semibold">
              {memorized} / 30
            </Badge>
          </CardTitle>
          <CardDescription className="flex flex-wrap gap-4 pt-1">
            <Legend color="bg-emerald-500" label={t("hifz.memorized")} count={memorized} />
            <Legend color="bg-amber-400" label={t("hifz.inProgress")} count={inProgress} />
            <Legend color="bg-muted-foreground/30" label={t("hifz.notStarted")} count={30 - memorized - inProgress} />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {hifz.parasCovered.map((p) => (
              <div
                key={p.para}
                title={`Para ${p.para} — ${paraLabel(p.status, t)}`}
                className={`flex aspect-square flex-col items-center justify-center rounded-md border text-xs font-medium transition-transform hover:scale-105 ${paraCellClass[p.status]}`}
              >
                <span className="text-[10px] leading-none opacity-70">{t("hifz.paraShort")}</span>
                <span className="text-sm font-semibold leading-tight">{p.para}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quality trend chart */}
      <Card className="py-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4 text-emerald-600" />
            {t("studentProfile.qualityTrend")}
          </CardTitle>
          <CardDescription>{hifz.totalRecords} records · last 20 rated</CardDescription>
        </CardHeader>
        <CardContent>
          {trend.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("studentProfile.noData")}</p>
          ) : (
            <div className="h-56 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 8, right: 16, left: -8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="idx" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                    formatter={(v: number) => [`${v} / 5`, t("hifz.quality")]}
                    labelFormatter={(l) => `#${l}`}
                  />
                  <Line type="monotone" dataKey="quality" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 3, fill: "#0d9488" }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent records table */}
      <Card className="py-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("studentProfile.recentRecords")}</CardTitle>
        </CardHeader>
        <CardContent>
          {hifz.recentRecords.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("studentProfile.noData")}</p>
          ) : (
            <ScrollArea className="max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t("hifz.date")}</TableHead>
                    <TableHead className="text-xs">{t("hifz.type")}</TableHead>
                    <TableHead className="text-xs">{t("hifz.para")}</TableHead>
                    <TableHead className="hidden text-xs sm:table-cell">{t("hifz.surah")}</TableHead>
                    <TableHead className="text-xs">{t("hifz.quality")}</TableHead>
                    <TableHead className="hidden text-xs sm:table-cell">{t("hifz.mistakes")}</TableHead>
                    <TableHead className="text-xs">{t("common.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hifz.recentRecords.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs">{fmtDate(r.recordedAt, locale)}</TableCell>
                      <TableCell className="text-xs">{hifzTypeLabel(r.type, t)}</TableCell>
                      <TableCell className="text-xs font-mono">{r.paraNumber}</TableCell>
                      <TableCell className="hidden text-xs sm:table-cell">{r.surahName ?? "—"}</TableCell>
                      <TableCell className="text-xs text-amber-600 dark:text-amber-400">{starString(r.qualityRating)}</TableCell>
                      <TableCell className="hidden text-xs sm:table-cell">{r.mistakesCount}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusBadge(r.status)}>{hifzStatusLabel(r.status, t)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Legend({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`inline-block size-2.5 rounded-full ${color}`} />
      {label} <span className="font-medium">({count})</span>
    </span>
  );
}

function paraLabel(s: ParaStatus, t: (k: string) => string): string {
  return s === "memorized" ? t("hifz.memorized") : s === "in-progress" ? t("hifz.inProgress") : t("hifz.notStarted");
}

function hifzTypeLabel(ty: string, t: (k: string) => string): string {
  return ty === "sabak" ? t("hifz.sabak") : ty === "sabaq_para" ? t("hifz.sabaqPara") : t("hifz.dhor");
}

function hifzStatusLabel(s: string, t: (k: string) => string): string {
  return s === "completed" ? t("hifz.completed") : s === "revision" ? t("hifz.revision") : t("hifz.weak");
}

function statusBadge(s: string): string {
  return s === "completed"
    ? "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
    : s === "revision"
    ? "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-300"
    : "border-rose-300 text-rose-700 dark:border-rose-800 dark:text-rose-300";
}
