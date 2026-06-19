"use client";
// Guardian detail card primitives + shared helpers.
// Exports: STATUS_COLOR, PARA_CELL, fmtDate, fmtMoney, MiniStat, Legend,
// AttendanceCard, HifzCard.
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell,
} from "recharts";
import {
  CalendarCheck, Check, X, Clock, CalendarOff, BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ParaStatus = "memorized" | "in-progress" | "not-started";

export const STATUS_COLOR: Record<string, string> = {
  present: "#10b981", late: "#f59e0b", absent: "#ef4444", leave: "#6366f1", none: "#e5e7eb",
};
export const PARA_CELL: Record<ParaStatus, string> = {
  memorized: "bg-emerald-500 text-white border-emerald-600",
  "in-progress": "bg-amber-400 text-amber-950 border-amber-500",
  "not-started": "bg-muted text-muted-foreground border-border",
};

export function fmtDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat(
      locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-GB",
      { year: "numeric", month: "short", day: "numeric" }
    ).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}
export function fmtMoney(n: number, locale: string): string {
  try {
    return new Intl.NumberFormat(
      locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-GB",
      { maximumFractionDigits: 0 }
    ).format(n);
  } catch {
    return String(n);
  }
}
function shortDay(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(
      locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-GB",
      { weekday: "short" }
    ).format(new Date(iso));
  } catch {
    return "";
  }
}
function statusValue(s: string): number {
  return s === "present" ? 4 : s === "late" ? 3 : s === "leave" ? 2 : s === "absent" ? 1 : 0;
}

export function MiniStat({ label, value, tone }: { label: string; value: number | string; tone: "emerald" | "rose" | "amber" | "violet" }) {
  const toneClass: Record<string, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    rose: "text-rose-600 dark:text-rose-400",
    amber: "text-amber-600 dark:text-amber-400",
    violet: "text-violet-600 dark:text-violet-400",
  };
  return (
    <div className="rounded-lg border p-2 text-center">
      <div className={`text-base font-bold sm:text-lg ${toneClass[tone]}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
export function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block size-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

// ---- Attendance card ----
export function AttendanceCard({
  last30d, series, t, locale,
}: {
  last30d: { present: number; absent: number; late: number; leave: number; rate: number; total: number };
  series: { date: string; status: string }[];
  t: (k: string) => string;
  locale: string;
}) {
  const chartData = series.map((d) => ({
    date: d.date, label: shortDay(d.date, locale),
    value: statusValue(d.status), status: d.status,
  }));
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarCheck className="size-4 text-emerald-600" />
          {t("guardian.attendance")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3 dark:bg-emerald-950/30">
          <span className="text-sm text-muted-foreground">{t("guardian.attendanceRate")}</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {last30d.total > 0 ? `${last30d.rate}%` : "—"}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {([
            { k: "present", v: last30d.present, c: "text-emerald-600", i: Check },
            { k: "absent", v: last30d.absent, c: "text-rose-600", i: X },
            { k: "late", v: last30d.late, c: "text-amber-500", i: Clock },
            { k: "leave", v: last30d.leave, c: "text-violet-500", i: CalendarOff },
          ] as const).map((x) => (
            <div key={x.k} className="rounded-lg border p-2 text-center">
              <x.i className={`mx-auto size-4 ${x.c}`} />
              <div className="mt-1 text-lg font-semibold">{x.v}</div>
              <div className="text-[10px] text-muted-foreground">{t(`guardian.${x.k}`)}</div>
            </div>
          ))}
        </div>
        {last30d.total > 0 && (
          <div className="h-32 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={4} stroke="var(--muted-foreground)" />
                <YAxis domain={[0, 4]} hide />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
                  formatter={(_v: number, _n: string, p: { payload?: { status?: string; date?: string } }) => [
                    fmtDate(p?.payload?.date ?? "", locale),
                    t(`guardian.${p?.payload?.status === "none" ? "noData" : p?.payload?.status ?? "noData"}`),
                  ]}
                />
                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={STATUS_COLOR[d.status] ?? STATUS_COLOR.none} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Hifz card ----
export function HifzCard({
  hifz, t, locale,
}: {
  hifz: {
    totalRecords: number; avgQuality: number;
    memorizedCount: number; inProgressCount: number;
    parasCovered: { para: number; status: ParaStatus }[];
    recentRecords: { type: string; paraNumber: number; surahName: string | null; qualityRating: number | null; status: string; recordedAt: string }[];
  };
  t: (k: string) => string;
  locale: string;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="size-4 text-amber-600" />
          {t("guardian.hifzProgress")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <MiniStat label={t("guardian.memorized")} value={hifz.memorizedCount} tone="emerald" />
          <MiniStat label={t("guardian.inProgress")} value={hifz.inProgressCount} tone="amber" />
          <MiniStat label={t("guardian.avgQuality")} value={hifz.avgQuality || "—"} tone="violet" />
        </div>
        <div className="grid grid-cols-10 gap-1">
          {hifz.parasCovered.map((p) => (
            <div
              key={p.para}
              title={`Para ${p.para}`}
              className={`flex aspect-square items-center justify-center rounded text-[9px] font-medium border ${PARA_CELL[p.status]}`}
            >
              {p.para}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-muted-foreground">
          <Legend color="#10b981" label={t("guardian.memorized")} />
          <Legend color="#f59e0b" label={t("guardian.inProgress")} />
        </div>
        {hifz.recentRecords.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{t("guardian.lastRecords")}</p>
            <div className="max-h-40 space-y-1 overflow-y-auto pe-1">
              {hifz.recentRecords.map((r, i) => (
                <div key={i} className="flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-1.5 text-xs">
                  <div className="min-w-0">
                    <span className="font-medium capitalize">{r.type}</span>
                    <span className="ms-1.5 text-muted-foreground">· Para {r.paraNumber}</span>
                    {r.surahName && <span className="ms-1.5 truncate text-muted-foreground">· {r.surahName}</span>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {r.qualityRating != null && (
                      <span className="text-amber-500">{"★".repeat(Math.max(0, Math.min(5, r.qualityRating)))}</span>
                    )}
                    <span className="text-muted-foreground">{fmtDate(r.recordedAt, locale)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {hifz.totalRecords === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">{t("guardian.noData")}</p>
        )}
      </CardContent>
    </Card>
  );
}
