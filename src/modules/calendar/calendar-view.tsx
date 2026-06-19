"use client";
// CalendarView — main shell: violet→purple header + Hijri hero + timeline + grid.
import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Moon, CalendarClock } from "lucide-react";
import { useApp } from "@/store/app-store";
import { EventsTimeline } from "./events-timeline";
import { EventsGrid } from "./events-grid";
import { EventForm } from "./event-form";
import type { CalEvent } from "./types";

type ApiResponse = {
  items: CalEvent[];
  upcoming: CalEvent[];
  todayHijri: string;
  todayGreg: string;
};

export function CalendarView() {
  const { t, locale, dir } = useApp();
  const [data, setData] = React.useState<ApiResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CalEvent | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/calendar?lang=${locale}`, { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) setData(j.data as ApiResponse);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  React.useEffect(() => {
    load();
    // Listen for reload events from child components (timeline add/edit)
    const handler = () => load();
    window.addEventListener("calendar-reload", handler);
    return () => window.removeEventListener("calendar-reload", handler);
  }, [load]);

  const fmtGreg = (s: string) =>
    new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(s));

  const onEdit = (e: CalEvent) => {
    setEditing(e);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6" dir={dir()}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-600/20 ring-1 ring-white/30">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.15]"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='white' stroke-width='1'><polygon points='20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14'/></g></svg>\")",
                backgroundSize: "40px 40px",
                backgroundRepeat: "repeat",
              }}
            />
            <CalendarDays className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("calendar.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("calendar.subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Hijri hero banner */}
      <Card className="border-0 text-white bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700 shadow-lg overflow-hidden">
        <CardContent className="p-5 sm:p-6">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            aria-hidden="true"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><g fill='none' stroke='white' stroke-width='1.2'><polygon points='30,4 36,18 50,18 39,28 44,42 30,34 16,42 21,28 10,18 24,18'/><polygon points='30,18 36,24 30,30 24,24'/></g></svg>\")",
              backgroundSize: "60px 60px",
              backgroundRepeat: "repeat",
            }}
          />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur-sm">
                <Moon className="size-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider opacity-90">{t("calendar.hijriToday")}</p>
                <p className="text-2xl font-bold leading-tight">{data?.todayHijri ?? "—"}</p>
                <p className="text-xs opacity-80 mt-0.5">{data?.todayGreg ? fmtGreg(data.todayGreg) : ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                <CalendarClock className="size-4" />
                <span>{data?.upcoming.length ?? 0} {t("calendar.upcoming")}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline + Grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="lg:col-span-2"
        >
          <EventsTimeline events={data?.upcoming ?? []} loading={loading} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="lg:col-span-3"
        >
          <EventsGrid events={data?.items ?? []} loading={loading} onEdit={onEdit} />
        </motion.div>
      </div>

      <EventForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSaved={load}
      />
    </div>
  );
}
