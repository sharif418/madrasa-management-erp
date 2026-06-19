"use client";
// EventsTimeline — vertical timeline of upcoming events with type-colored dots
// and countdown badges (Today / Tomorrow / In N days).
import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarClock, MapPin, Plus, Pencil, Calendar as CalIcon,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { EVENT_TYPE_META, daysFromNow, type CalEvent } from "./types";
import { EventForm } from "./event-form";

export function EventsTimeline({
  events, loading,
}: {
  events: CalEvent[];
  loading: boolean;
}) {
  const { t, locale, dir } = useApp();
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CalEvent | null>(null);

  const fmtDate = (s: string) =>
    new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(new Date(s));

  const countdown = (e: CalEvent) => {
    const d = daysFromNow(e.startDate);
    if (d < 0) return null;
    if (d === 0) return { label: t("calendar.today"), tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" };
    if (d === 1) return { label: t("calendar.tomorrow"), tint: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" };
    return { label: t("calendar.inDays", { n: d }), tint: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" };
  };

  const sorted = [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <Card className="overflow-hidden" >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-5 text-violet-600" />
            <h3 className="font-semibold">{t("calendar.upcoming")}</h3>
          </div>
          <Button
            size="sm"
            onClick={() => { setEditing(null); setFormOpen(true); }}
            className="bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700"
          >
            <Plus className="size-4" /> {t("calendar.addEvent")}
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-10 text-center">
            <CalIcon className="mx-auto mb-2 size-10 opacity-30" />
            <p className="font-medium">{t("calendar.empty")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("calendar.emptyDesc")}</p>
          </div>
        ) : (
          <div className="relative" dir={dir()}>
            {/* Timeline vertical line */}
            <div
              className="absolute top-1 bottom-1 w-0.5 bg-gradient-to-b from-violet-500 via-purple-500 to-fuchsia-500 opacity-30"
              style={{ insetInlineStart: "14px" }}
              aria-hidden="true"
            />
            <div className="space-y-3">
              {sorted.map((e, idx) => {
                const meta = EVENT_TYPE_META[e.type] || EVENT_TYPE_META.event;
                const Icon = meta.icon;
                const cd = countdown(e);
                return (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, x: dir() === "rtl" ? 8 : -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(idx * 0.05, 0.3) }}
                    className="relative flex items-start gap-3"
                  >
                    <span className={cn("relative z-10 grid size-7 shrink-0 place-items-center rounded-full text-white shadow-md ring-2 ring-background", meta.tile)}>
                      <Icon className="size-3.5" />
                    </span>
                    <div className={cn(
                      "flex-1 min-w-0 rounded-xl border bg-card p-3 shadow-sm transition-all hover:shadow-md",
                      meta.border, "border-s-4"
                    )}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-semibold leading-tight">{e.title}</h4>
                            {e.isHighlighted && (
                              <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                ★ {t("calendar.highlight")}
                              </Badge>
                            )}
                          </div>
                          {e.titleArabic && (
                            <p className="text-xs text-violet-700 dark:text-violet-300 mt-0.5" dir="rtl">{e.titleArabic}</p>
                          )}
                        </div>
                        {cd && (
                          <Badge variant="outline" className={cn("shrink-0 text-xs", cd.tint)}>
                            {cd.label}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalIcon className="size-3" />
                          {fmtDate(e.startDate)}
                          {e.endDate && ` → ${fmtDate(e.endDate)}`}
                        </span>
                        {e.hijriDate && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                            <CalendarClock className="size-3" />
                            {e.hijriDate}
                          </span>
                        )}
                        {e.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3" />
                            {e.location}
                          </span>
                        )}
                      </div>
                      {e.description && (
                        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{e.description}</p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-xs", meta.tint)}>
                          {t(`calendar.types.${e.type}`)}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ms-auto h-7 px-2 text-xs"
                          onClick={() => { setEditing(e); setFormOpen(true); }}
                        >
                          <Pencil className="size-3" /> {t("common.edit")}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>

      <EventForm open={formOpen} onOpenChange={setFormOpen} editing={editing} onSaved={() => { /* parent reloads via state */ window.dispatchEvent(new Event("calendar-reload")); }} />
    </Card>
  );
}
