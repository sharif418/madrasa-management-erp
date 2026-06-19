"use client";
// TimetableGrid — weekly grid (Sat–Thu) × time rows (06:00 → 20:00).
// Each cell shows mini cards for slots. Click empty → onAdd. Click slot → onEdit.
// Subtle prayer-time markers overlaid at Fajr/Dhuhr/Asr/Maghrib/Isha.
import { motion } from "framer-motion";
import { Pencil, Plus, MapPin, User } from "lucide-react";
import { useApp } from "@/store/app-store";
import {
  DAY_CODES, DAY_LABEL_KEYS, PRAYER_TIMES, SUBJECT_PALETTE,
  fmtTime, fromMinutes, subjectColor, timeRows, toMinutes,
  type DayCode, type SlotDTO,
} from "./types";

type Props = {
  slots: SlotDTO[];
  onAdd: (day: DayCode, start: string) => void;
  onEdit: (slot: SlotDTO) => void;
};

export function TimetableGrid({ slots, onAdd, onEdit }: Props) {
  const { t, locale, dir } = useApp();
  const rows = timeRows();
  const today = (() => {
    const map: DayCode[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    return map[new Date().getDay()];
  })();

  // Index slots by `day|startHour` for fast lookup
  const cellMap = new Map<string, SlotDTO[]>();
  for (const s of slots) {
    const startHour = s.startTime.split(":")[0];
    const key = `${s.day}|${startHour}`;
    const arr = cellMap.get(key) ?? [];
    arr.push(s);
    cellMap.set(key, arr);
  }

  // Prayer icon overlay for a given hour-row
  const prayerForHour = (hour: number) => {
    return PRAYER_TIMES.filter((p) => Number(p.time.split(":")[0]) === hour);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-white dark:bg-emerald-950/20">
      <div className="min-w-[900px]">
        {/* Header row */}
        <div
          className="grid border-b border-emerald-100 dark:border-emerald-900/40 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40"
          style={{ gridTemplateColumns: `64px repeat(${DAY_CODES.length}, minmax(0, 1fr))` }}
        >
          <div className="px-2 py-3 text-[10px] font-semibold uppercase tracking-wider text-emerald-700/70 dark:text-emerald-300/70 text-end">
            {t("timetable.day")}
          </div>
          {DAY_CODES.map((d) => {
            const isToday = d === today;
            return (
              <div
                key={d}
                className={`px-3 py-2.5 text-center text-xs font-bold border-s border-emerald-100 dark:border-emerald-900/40 ${
                  isToday
                    ? "bg-gradient-to-b from-emerald-500 to-teal-600 text-white"
                    : "text-emerald-800 dark:text-emerald-100"
                }`}
              >
                <span className="block leading-tight">{t(DAY_LABEL_KEYS[d])}</span>
                {isToday && (
                  <span className="mt-0.5 inline-block rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-semibold">
                    {t("timetable.todaySchedule")}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Body rows */}
        {rows.map((row, idx) => {
          const hour = Number(row.split(":")[0]);
          const prayers = prayerForHour(hour);
          const isLast = idx === rows.length - 1;
          return (
            <div
              key={row}
              className="grid border-b border-emerald-50 dark:border-emerald-900/30 last:border-b-0"
              style={{ gridTemplateColumns: `64px repeat(${DAY_CODES.length}, minmax(0, 1fr))` }}
            >
              {/* Time label */}
              <div className="relative px-2 py-2 text-[10px] font-semibold text-emerald-700/70 dark:text-emerald-300/70 text-end border-e border-emerald-50 dark:border-emerald-900/30">
                <span className="block leading-tight">{fmtTime(row, locale)}</span>
                {prayers.length > 0 && (
                  <span
                    className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 px-1 py-0.5 text-[8px] font-bold text-amber-700 dark:text-amber-300"
                    title={`${t("timetable.prayerTime")}: ${prayers.map((p) => p.name).join(", ")}`}
                  >
                    <span aria-hidden>{prayers[0].icon}</span>
                    <span className="sr-only">{t("timetable.prayerTime")}</span>
                  </span>
                )}
              </div>

              {/* Day cells */}
              {DAY_CODES.map((d) => {
                const cellSlots = cellMap.get(`${d}|${String(hour).padStart(2, "0")}`) ?? [];
                const isToday = d === today;
                return (
                  <div
                    key={d}
                    className={`group relative min-h-[68px] border-s border-emerald-50 dark:border-emerald-900/30 p-1.5 transition-colors ${
                      isToday ? "bg-emerald-50/50 dark:bg-emerald-950/30" : ""
                    }`}
                  >
                    {cellSlots.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => onAdd(d, `${String(hour).padStart(2, "0")}:00`)}
                        className="flex h-full min-h-[58px] w-full items-center justify-center rounded-lg border border-dashed border-emerald-200/60 dark:border-emerald-800/40 text-emerald-400/0 transition-all hover:border-emerald-400 hover:bg-emerald-50/60 hover:text-emerald-600 dark:hover:bg-emerald-900/20"
                        aria-label={t("timetable.addSlot")}
                      >
                        <Plus className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    ) : (
                      <div className="flex h-full flex-col gap-1">
                        {cellSlots.map((s) => {
                          const c = subjectColor(s.subject);
                          return (
                            <motion.button
                              type="button"
                              key={s.id}
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.15 }}
                              onClick={() => onEdit(s)}
                              className={`relative rounded-lg border ${c.border} ${c.bg} px-2 py-1.5 text-start transition-all hover:shadow-md hover:-translate-y-0.5`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span className={`inline-flex items-center gap-1 rounded-full bg-white/70 dark:bg-black/20 px-1.5 py-0.5 text-[9px] font-bold ${c.text}`}>
                                  <span className={`size-1.5 rounded-full ${c.dot}`} />
                                  {s.subject}
                                </span>
                                <Pencil className="size-3 opacity-0 transition-opacity group-hover:opacity-60" />
                              </div>
                              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-900/80 dark:text-emerald-100/80">
                                <span className="font-semibold tabular-nums" dir="ltr">
                                  {fmtTime(s.startTime, locale)}–{fmtTime(s.endTime, locale)}
                                </span>
                              </div>
                              {(s.teacherName || s.room) && (
                                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-emerald-900/70 dark:text-emerald-100/70">
                                  {s.teacherName && (
                                    <span className="inline-flex items-center gap-0.5 truncate">
                                      <User className="size-2.5" />
                                      <span className="truncate">{s.teacherName}</span>
                                    </span>
                                  )}
                                  {s.room && (
                                    <span className="inline-flex items-center gap-0.5">
                                      <MapPin className="size-2.5" />
                                      {s.room}
                                    </span>
                                  )}
                                </div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Friday holiday footer */}
        <div
          className="grid border-t border-emerald-100 dark:border-emerald-900/40 bg-amber-50/60 dark:bg-amber-950/20"
          style={{ gridTemplateColumns: `64px repeat(${DAY_CODES.length}, minmax(0, 1fr))` }}
        >
          <div className="px-2 py-3 text-[10px] font-semibold uppercase tracking-wider text-amber-700/70 dark:text-amber-300/70 text-end">
            {/* day off */}
          </div>
          <div className="col-span-6 flex items-center justify-center gap-2 py-3 text-xs font-semibold text-amber-700 dark:text-amber-300">
            <span aria-hidden>🕌</span>
            {t("timetable.fridayHoliday")}
          </div>
        </div>
      </div>

      {/* Subject color legend */}
      <div className="flex flex-wrap items-center gap-2 border-t border-emerald-50 dark:border-emerald-900/30 px-3 py-2.5" dir={dir()}>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("timetable.subject")}:
        </span>
        {SUBJECT_PALETTE.slice(0, 6).map((p) => (
          <span key={p.name} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className={`size-2 rounded-full ${p.dot}`} />
          </span>
        ))}
      </div>
    </div>
  );
}

// Helper to derive a starting time one hour after a given HH:MM, used to set
// the default end time in the form when the user clicks an empty cell.
export function nextHourLabel(start: string): string {
  const m = toMinutes(start) + 60;
  return fromMinutes(m);
}
