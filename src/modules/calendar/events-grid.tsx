"use client";
// EventsGrid — all-events grid with type filter + type breakdown pie.
import * as React from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, MapPin, Pencil, PieChart as PieIcon } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { EVENT_TYPE_META, EVENT_TYPES, type CalEvent } from "./types";

const TYPE_COLORS: Record<string, string> = {
  exam: "#f43f5e",
  holiday: "#f59e0b",
  islamic: "#10b981",
  meeting: "#8b5cf6",
  admission: "#06b6d4",
  result: "#14b8a6",
  event: "#d946ef",
};

const CHART_TIP = {
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--background)",
  color: "var(--foreground)",
  fontSize: 12,
};

export function EventsGrid({
  events, loading, onEdit,
}: {
  events: CalEvent[];
  loading: boolean;
  onEdit: (e: CalEvent) => void;
}) {
  const { t, locale, dir } = useApp();
  const [filter, setFilter] = React.useState<string>("");

  const fmtDate = (s: string) =>
    new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(new Date(s));

  const filtered = filter ? events.filter((e) => e.type === filter) : events;

  // Type breakdown for pie
  const pieData = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const e of events) map.set(e.type, (map.get(e.type) || 0) + 1);
    return Array.from(map.entries()).map(([name, value]) => ({
      name, value, color: TYPE_COLORS[name] || "#64748b",
    }));
  }, [events]);

  return (
    <div className="space-y-4" dir={dir()}>
      {/* Type breakdown pie + filter chips */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <PieIcon className="size-4 text-violet-600" />
              <h3 className="font-semibold text-sm">{t("calendar.typeBreakdown")}</h3>
            </div>
            <div className="h-48">
              {pieData.length === 0 ? (
                <div className="grid h-full place-items-center text-sm text-muted-foreground">{t("calendar.empty")}</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2} stroke="none">
                      {pieData.map((p) => <Cell key={p.name} fill={p.color} />)}
                    </Pie>
                    <Tooltip contentStyle={CHART_TIP} formatter={(v: number, n: string) => [v, t(`calendar.types.${n}`)]} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} formatter={(v) => (
                      <span className="text-muted-foreground">{t(`calendar.types.${v}`)}</span>
                    )} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-5 text-violet-600" />
                <h3 className="font-semibold">{t("calendar.allEvents")}</h3>
              </div>
              <Badge variant="outline" className="text-xs">{filtered.length}</Badge>
            </div>
            {/* Type filter chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3">
              <button
                type="button"
                onClick={() => setFilter("")}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition",
                  !filter ? "border-violet-600 bg-violet-600 text-white" : "border-border bg-muted/50 hover:bg-muted"
                )}
              >
                {t("common.all")}
              </button>
              {EVENT_TYPES.map((ty) => {
                const meta = EVENT_TYPE_META[ty];
                const active = filter === ty;
                const Icon = meta.icon;
                return (
                  <button
                    key={ty}
                    type="button"
                    onClick={() => setFilter(ty)}
                    className={cn(
                      "shrink-0 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition",
                      active ? "border-violet-600 bg-violet-600 text-white" : "border-border bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <Icon className="size-3" />
                    {t(`calendar.types.${ty}`)}
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center">
                <CalendarDays className="mx-auto mb-2 size-8 opacity-30" />
                <p className="text-sm text-muted-foreground">{t("calendar.empty")}</p>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 max-h-[420px] overflow-y-auto pe-1">
                {filtered.map((e, idx) => {
                  const meta = EVENT_TYPE_META[e.type] || EVENT_TYPE_META.event;
                  const Icon = meta.icon;
                  return (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.25) }}
                    >
                      <div className={cn(
                        "rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md border-s-4",
                        meta.border
                      )}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <span className={cn("grid size-7 shrink-0 place-items-center rounded-md text-white", meta.tile)}>
                              <Icon className="size-3.5" />
                            </span>
                            <div className="min-w-0">
                              <h4 className="font-medium text-sm leading-tight line-clamp-1">{e.title}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {fmtDate(e.startDate)}
                                {e.endDate && ` → ${fmtDate(e.endDate)}`}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0" onClick={() => onEdit(e)}>
                            <Pencil className="size-3" />
                          </Button>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                          <Badge variant="outline" className={cn("text-[10px]", meta.tint)}>
                            {t(`calendar.types.${e.type}`)}
                          </Badge>
                          {e.location && (
                            <span className="inline-flex items-center gap-0.5 text-muted-foreground">
                              <MapPin className="size-2.5" />
                              <span className="max-w-[80px] truncate">{e.location}</span>
                            </span>
                          )}
                          {e.isHighlighted && (
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-[10px]">
                              ★
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
