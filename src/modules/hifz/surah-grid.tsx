"use client";
// SurahGrid — 114-cell responsive grid showing each surah's memorization status.
// Each tile shows surah number, short Arabic name, and a status-colored background.
// Hover reveals a tooltip with full details. Click opens the detail dialog.
import * as React from "react";
import { useApp } from "@/store/app-store";
import {
  Tooltip, TooltipTrigger, TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { SurahProgressItem, SurahStatus } from "@/app/api/hifz/surah-progress/route";
import { fmtDate } from "./hifz-types";

// Status → cell color classes (Quran palette: emerald=done, amber=wip, sky=revision, muted=new)
export const surahStatusCellClass: Record<SurahStatus, string> = {
  not_started: "bg-muted/50 text-muted-foreground border-border hover:border-muted-foreground/40",
  in_progress: "bg-amber-100 text-amber-900 border-amber-300 hover:border-amber-500 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800",
  completed: "bg-emerald-500 text-white border-emerald-600 hover:border-emerald-700 shadow-sm shadow-emerald-900/20",
  revision: "bg-sky-500 text-white border-sky-600 hover:border-sky-700 shadow-sm shadow-sky-900/20",
};

export const surahStatusDotClass: Record<SurahStatus, string> = {
  not_started: "bg-muted-foreground/40",
  in_progress: "bg-amber-500",
  completed: "bg-emerald-500",
  revision: "bg-sky-500",
};

export function statusLabelKey(s: SurahStatus): string {
  if (s === "not_started") return "hifz.notStarted";
  if (s === "in_progress") return "hifz.inProgress";
  if (s === "completed") return "hifz.completed";
  return "hifz.revision";
}

type Props = {
  surahs: SurahProgressItem[];
  onSelect: (s: SurahProgressItem) => void;
};

export function SurahGrid({ surahs, onSelect }: Props) {
  const { t, locale } = useApp();
  return (
    <div
      className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12"
      role="grid"
      aria-label={t("hifz.surahProgress")}
    >
      {surahs.map((s) => (
        <Tooltip key={s.surahNumber} delayDuration={150}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onSelect(s)}
              aria-label={`${s.surahNumber}. ${s.surahName}`}
              className={cn(
                "group relative flex aspect-square flex-col items-center justify-center rounded-lg border p-1 text-center transition-all duration-150 hover:scale-110 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1",
                surahStatusCellClass[s.status],
              )}
            >
              <span className="absolute start-1 top-1 text-[9px] font-semibold opacity-70 leading-none">
                {s.surahNumber}
              </span>
              <span
                className="text-base font-semibold leading-tight"
                dir="rtl"
                lang="ar"
                style={{ fontFamily: "'Scheherazade New', 'Amiri', serif" }}
              >
                {s.surahNameArabic}
              </span>
              <span className="mt-0.5 text-[9px] opacity-75 leading-none">
                {s.memorizedAyahs}/{s.totalAyahs}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[220px] text-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">{s.surahNumber}. {s.surahName}</span>
                <span dir="rtl" lang="ar" className="font-semibold">{s.surahNameArabic}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-muted-foreground">
                <span>
                  {s.memorizedAyahs} / {s.totalAyahs} {t("hifz.ayahsMemorized").toLowerCase()}
                </span>
                <span>{s.revelationType === "meccan" ? t("hifz.meccan") : t("hifz.medinan")}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <span className={cn("inline-block h-2 w-2 rounded-full", surahStatusDotClass[s.status])} />
                  {t(statusLabelKey(s.status))}
                </span>
                <span>{s.lastPracticed ? fmtDate(s.lastPracticed, locale) : "—"}</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
