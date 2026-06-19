"use client";
// Shared presentational parts for the Timetable module.
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/store/app-store";
import { DAY_LABEL_KEYS, fmtTime, type DayCode, type SlotDTO } from "./types";

export function TodayStrip({
  slots, today,
}: { slots: SlotDTO[]; today: DayCode }) {
  const { t, locale } = useApp();
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg overflow-hidden">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4" />
            <span className="text-sm font-bold">{t("timetable.todaySchedule")}</span>
            <span className="text-xs text-emerald-100/80">· {t(DAY_LABEL_KEYS[today])}</span>
          </div>
          <div className="flex flex-wrap gap-2 ms-auto">
            {slots.slice(0, 6).map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur"
              >
                <span className="tabular-nums" dir="ltr">{fmtTime(s.startTime, locale)}</span>
                · {s.subject}
              </span>
            ))}
            {slots.length > 6 && (
              <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-xs">
                +{slots.length - 6}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function EmptyState({
  icon, title, desc, action,
}: { icon: React.ReactNode; title: string; desc: string; action?: React.ReactNode }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <div className="grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40">
          {icon}
        </div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="max-w-md text-sm text-muted-foreground">{desc}</p>
        {action}
      </CardContent>
    </Card>
  );
}
