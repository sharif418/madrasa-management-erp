"use client";
// HifzProgress — per-student memorization progress view
// Shows: circular progress (X/30), 30-cell para grid, stats, quality trend chart
import * as React from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { BookOpenCheck, TrendingUp, Award, Activity, Sparkles } from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  HIFZ_TYPES, type ProgressResponse, type StudentOption,
  typeAccent, typeLabelKey, paraCellClass,
} from "./hifz-types";

type Props = {
  students: StudentOption[];
  refreshKey: number;
};

export function HifzProgress({ students, refreshKey }: Props) {
  const { t, dir } = useApp();
  const { toast } = useToast();
  const [studentId, setStudentId] = React.useState<string>("");
  const [data, setData] = React.useState<ProgressResponse | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Auto-pick first student when list arrives
  React.useEffect(() => {
    if (!studentId && students.length > 0) setStudentId(students[0].id);
  }, [students, studentId]);

  React.useEffect(() => {
    if (!studentId) { setData(null); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/hifz/progress?studentId=${encodeURIComponent(studentId)}`);
        const json = await res.json();
        if (cancelled) return;
        if (!json.ok) throw new Error(json.error);
        setData(json.data);
      } catch {
        if (!cancelled) {
          toast({ title: t("hifz.error"), variant: "destructive" });
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [studentId, refreshKey, t, toast]);

  const pct = data ? Math.round((data.totalParas / 30) * 100) : 0;

  return (
    <div className="space-y-4" dir={dir()}>
      {/* Student selector */}
      <Card className="py-4">
        <CardContent className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs text-muted-foreground">{t("hifz.selectStudent")}</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="w-full"><SelectValue placeholder={t("hifz.selectStudent")} /></SelectTrigger>
              <SelectContent className="max-h-72">
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}{s.rollNo ? ` · ${s.rollNo}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {data?.student?.isHafiz && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-3 py-1.5 text-sm font-medium">
              <Award className="size-4" /> Hafiz
            </div>
          )}
        </CardContent>
      </Card>

      {!studentId ? (
        <EmptyState label={t("hifz.noProgress")} />
      ) : loading ? (
        <div className="grid lg:grid-cols-3 gap-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-64 rounded-xl col-span-full" />
        </div>
      ) : data ? (
        <>
          {/* Top row: circular progress + stats */}
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpenCheck className="size-4 text-emerald-600" />
                  {t("hifz.progress")}
                </CardTitle>
                <CardDescription>{data.student.name}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center pb-6">
                <CircularProgress value={pct} label={t("hifz.parasMemorized", { x: data.totalParas })} />
              </CardContent>
            </Card>

            {/* Stats column */}
            <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
              <StatCard
                icon={<Activity className="size-5 text-emerald-600" />}
                label={t("hifz.last30d")}
                value={String(data.last30d)}
              />
              <StatCard
                icon={<Sparkles className="size-5 text-amber-500" />}
                label={t("hifz.avgQuality")}
                value={data.avgQuality > 0 ? `${data.avgQuality} / 5` : "—"}
              />
              <Card className="sm:col-span-2 py-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t("hifz.byType")}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-3">
                  {HIFZ_TYPES.map((ty) => (
                    <div key={ty} className="rounded-lg border p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ background: typeAccent[ty] }} />
                        <span className="text-xs text-muted-foreground">{t(typeLabelKey(ty))}</span>
                      </div>
                      <p className="text-2xl font-semibold">{data.byType[ty]}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 30-cell para grid */}
          <Card className="py-4">
            <CardHeader>
              <CardTitle className="text-base">{t("hifz.parasCovered")}</CardTitle>
              <CardDescription className="flex flex-wrap gap-4 pt-1">
                <LegendDot color="bg-emerald-500" label={t("hifz.memorized")} />
                <LegendDot color="bg-amber-400" label={t("hifz.inProgress")} />
                <LegendDot color="bg-muted-foreground/30" label={t("hifz.notStarted")} />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {data.parasCovered.map((p) => (
                  <div
                    key={p.para}
                    title={`${t("hifz.para")} ${p.para} — ${t(`hifz.${p.status === "in-progress" ? "inProgress" : p.status === "not-started" ? "notStarted" : "memorized"}`)}`}
                    className={cn(
                      "aspect-square rounded-md border flex flex-col items-center justify-center text-xs font-medium transition-transform hover:scale-105 cursor-default",
                      paraCellClass[p.status]
                    )}
                  >
                    <span className="opacity-70 text-[10px] leading-none">{t("hifz.paraShort")}</span>
                    <span className="text-sm font-semibold leading-tight">{p.para}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quality trend chart */}
          <Card className="py-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="size-4 text-emerald-600" />
                {t("hifz.qualityTrend")}
              </CardTitle>
              <CardDescription>{data.totalRecords} records · last 20 rated</CardDescription>
            </CardHeader>
            <CardContent>
              {data.trend.length === 0 ? (
                <EmptyState label={t("hifz.noRecords")} />
              ) : (
                <div className="h-64 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trend} margin={{ top: 8, right: 16, left: -8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="index"
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                        label={{ value: "#", position: "insideBottomRight", offset: -4, fontSize: 11 }}
                      />
                      <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                        formatter={(v: number) => [`${v} / 5`, t("hifz.quality")]}
                        labelFormatter={(l) => `#${l}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="quality"
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
        </>
      ) : null}
    </div>
  );
}

// ---------- helpers ----------

function CircularProgress({ value, label }: { value: number; label: string }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative w-44 h-44 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={r} fill="none" className="stroke-muted" strokeWidth="10" />
        <circle
          cx="80" cy="80" r={r} fill="none"
          stroke="#0d9488" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="text-center">
        <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{value}%</div>
        <div className="text-xs text-muted-foreground mt-1 px-3">{label}</div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="py-4">
      <CardContent className="flex items-center gap-3">
        <div className="size-10 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn("inline-block w-2.5 h-2.5 rounded-full", color)} />
      {label}
    </span>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <Card className="py-12">
      <CardContent className="text-center text-muted-foreground">
        <BookOpenCheck className="size-10 mx-auto mb-3 opacity-40" />
        <p>{label}</p>
      </CardContent>
    </Card>
  );
}
