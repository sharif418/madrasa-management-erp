"use client";
// SurahDetailDialog — opens when a surah cell is clicked.
// Shows all HifzRecords for the selected surah by the current student,
// plus a header card with surah info and aggregate stats.
import * as React from "react";
import { BookOpen, Star, Calendar, Activity } from "lucide-react";
import { useApp } from "@/store/app-store";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { matchSurahName } from "@/lib/quran-data";
import type { SurahProgressItem } from "@/app/api/hifz/surah-progress/route";
import {
  HifzRecord, fmtDate, starString, typeLabelKey, statusBadgeClass,
} from "./hifz-types";
import { surahStatusDotClass, statusLabelKey } from "./surah-grid";

type Props = {
  surah: SurahProgressItem | null;
  studentId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
};

export function SurahDetailDialog({ surah, studentId, open, onOpenChange }: Props) {
  const { t, locale, dir } = useApp();
  const [records, setRecords] = React.useState<HifzRecord[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Fetch all HifzRecords for this student when dialog opens, then filter client-side
  React.useEffect(() => {
    if (!open || !surah || !studentId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/hifz?studentId=${encodeURIComponent(studentId)}&limit=100`);
        const json = await res.json();
        if (cancelled) return;
        if (!json.ok) throw new Error(json.error);
        const all: HifzRecord[] = json.data.items ?? [];
        // Filter to records matching this surah (by surahName match)
        const target = surah.surahNumber;
        const filtered = all.filter((r) => {
          const sn = r.surahName ? matchSurahName(r.surahName) : 0;
          return sn === target;
        });
        setRecords(filtered);
      } catch {
        if (!cancelled) setRecords([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, surah, studentId]);

  if (!surah) return null;
  const isRtl = dir() === "rtl";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span
              className="grid size-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-emerald-500/15 to-teal-700/20 text-emerald-700 ring-1 ring-emerald-600/20 dark:text-emerald-400"
              aria-hidden
            >
              <BookOpen className="size-5" />
            </span>
            <span className="flex flex-col">
              <span className="text-lg font-semibold leading-tight">
                {surah.surahNumber}. {surah.surahName}
              </span>
              <span
                className="text-sm font-normal text-muted-foreground"
                dir="rtl" lang="ar"
                style={{ fontFamily: "'Scheherazade New', 'Amiri', serif" }}
              >
                {surah.surahNameArabic} · {surah.surahNameBengali}
              </span>
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("hifz.surahProgress")} — {surah.surahName}
          </DialogDescription>
        </DialogHeader>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" dir={isRtl ? "rtl" : "ltr"}>
          <MiniStat
            icon={<Activity className="size-3.5" />}
            label={t("hifz.ayahsMemorized")}
            value={`${surah.memorizedAyahs}/${surah.totalAyahs}`}
          />
          <MiniStat
            icon={<Star className="size-3.5" />}
            label={t("hifz.avgQuality")}
            value={surah.avgQuality > 0 ? `${surah.avgQuality}/5` : "—"}
          />
          <MiniStat
            icon={<Calendar className="size-3.5" />}
            label={t("hifz.lastPracticed")}
            value={surah.lastPracticed ? fmtDate(surah.lastPracticed, locale) : "—"}
          />
          <div className="rounded-lg border bg-card p-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t("hifz.status")}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={cn("inline-block h-2 w-2 rounded-full", surahStatusDotClass[surah.status])} />
              <span className="text-sm font-semibold">{t(statusLabelKey(surah.status))}</span>
            </div>
          </div>
        </div>

        {/* Records list */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            {t("hifz.records")} · {records.length}
          </p>
          <ScrollArea className="max-h-72 rounded-lg border">
            <div className="divide-y">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-3"><Skeleton className="h-8 w-full" /></div>
                ))
              ) : records.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  {t("hifz.noRecords")}
                </div>
              ) : (
                records.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-2.5 text-sm">
                    <Badge variant="outline" className="shrink-0">
                      {t(typeLabelKey(r.type))}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {t("hifz.paraShort")} {r.paraNumber}
                          {r.surahName ? ` · ${r.surahName}` : ""}
                          {r.ayahFrom != null && r.ayahTo != null ? ` · ${r.ayahFrom}-${r.ayahTo}` : ""}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {fmtDate(r.recordedAt, locale)}
                        {r.teacherName ? ` · ${r.teacherName}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-amber-500 text-xs">
                      {starString(r.qualityRating)}
                    </span>
                    <Badge className={cn("shrink-0", statusBadgeClass[r.status])}>
                      {t(`hifz.${r.status}`)}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-2.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
