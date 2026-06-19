// Analytics performers — Top Performers + At-Risk Students + Fund Health
"use client";
import { Trophy, AlertTriangle, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type TopPerformer = { id: string; name: string; avg: number; grade: string };
export type AtRiskStudent = { id: string; name: string; reasons: string[] };
export type FundHealth = {
  id: string;
  name: string;
  type: string;
  balance: number;
  runwayMonths: number;
  status: "healthy" | "stable" | "watch";
};

type Props = {
  topPerformers: TopPerformer[];
  atRiskStudents: AtRiskStudent[];
  fundHealth: FundHealth[];
};

const GRADE_COLORS: Record<string, string> = {
  "A+": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  "A": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  "B": "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
  "C": "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  "D": "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  "F": "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
};

const STATUS_META: Record<FundHealth["status"], { label: string; cls: string }> = {
  healthy: { label: "analytics.healthy", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
  stable: { label: "analytics.stable", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  watch: { label: "analytics.watch", cls: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" },
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AnalyticsPerformers({ topPerformers, atRiskStudents, fundHealth }: Props) {
  const { t, dir } = useApp();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3" dir={dir()}>
      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="size-4 text-amber-500" />
            {t("analytics.topPerformers")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topPerformers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("analytics.noData")}</p>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto pe-1">
              {topPerformers.map((p, idx) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2 hover:bg-muted/40 transition-colors"
                >
                  <div
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold",
                      idx === 0
                        ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                        : idx === 1
                          ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white"
                          : idx === 2
                            ? "bg-gradient-to-br from-orange-300 to-amber-600 text-white"
                            : "bg-muted text-muted-foreground"
                    )}
                  >
                    {idx + 1}
                  </div>
                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-purple-600 text-xs font-semibold text-white">
                    {initials(p.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">{p.avg}% avg</p>
                  </div>
                  <Badge variant="secondary" className={cn("text-xs font-semibold", GRADE_COLORS[p.grade] ?? "")}>
                    {p.grade}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* At-Risk Students */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="size-4 text-rose-500" />
            {t("analytics.atRiskStudents")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {atRiskStudents.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-8 text-center">
              <TrendingUp className="size-8 text-emerald-500/50" />
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                {t("analytics.healthy")} ✓
              </p>
              <p className="text-xs text-muted-foreground">No at-risk students</p>
            </div>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto pe-1">
              {atRiskStudents.map((s) => (
                <li
                  key={s.id}
                  className="flex items-start gap-3 rounded-xl border border-rose-200/60 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/20 px-3 py-2"
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{s.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {s.reasons.map((r) => (
                        <Badge
                          key={r}
                          variant="outline"
                          className="text-[10px] border-rose-300 text-rose-700 dark:border-rose-800 dark:text-rose-300"
                        >
                          {r === "attendance" ? t("analytics.lowAttendance") : t("analytics.lowQuality")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Fund Health */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="size-4 text-emerald-500" />
            {t("analytics.fundHealth")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fundHealth.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("analytics.noData")}</p>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto pe-1">
              {fundHealth.map((f) => {
                const status = STATUS_META[f.status];
                const isPositive = f.balance >= 0;
                return (
                  <li
                    key={f.id}
                    className="rounded-xl border border-border bg-background px-3 py-2 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={cn(
                            "grid size-7 shrink-0 place-items-center rounded-lg",
                            isPositive ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"
                          )}
                        >
                          {isPositive ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{f.name}</p>
                          <p className="text-[11px] text-muted-foreground capitalize">{f.type}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className={cn("text-[10px] font-semibold", status.cls)}>
                        {t(status.label)}
                      </Badge>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-xs">
                      <span className="font-semibold tabular-nums">৳{f.balance.toLocaleString()}</span>
                      <span className="text-muted-foreground">
                        {t("analytics.runwayMonths", { count: f.runwayMonths })}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
