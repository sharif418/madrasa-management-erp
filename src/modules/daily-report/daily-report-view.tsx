// DailyReportView — end-of-day summary of all madrasa activities.
// Header (emerald→teal tile) + date picker + print button + summary cards
// + collapsible detailed tables. Loading skeletons + empty state + toasts.
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Printer, AlertTriangle, Inbox, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DailySummaryCards } from "./daily-summary-cards";
import { DailyDetails } from "./daily-details";
import type { DailyReport } from "./daily-report-types";

const ISLAMIC_PATTERN: React.CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='white' stroke-width='1'><polygon points='20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14'/></g></svg>\")",
  backgroundSize: "40px 40px",
  backgroundRepeat: "repeat",
};

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export function DailyReportView() {
  const { t, dir, locale } = useApp();
  const [date, setDate] = useState<string>(todayStr());
  const [data, setData] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/daily-report?date=${encodeURIComponent(d)}`, { cache: "no-store" });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setData(j.data as DailyReport);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(date); }, [date, load]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Format date label for the header chip in the active locale.
  const dateLabel = useMemo(() => {
    try {
      const [y, m, d] = date.split("-").map(Number);
      return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "bn" ? "bn-BD" : "en", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      }).format(new Date(y, (m || 1) - 1, d || 1));
    } catch {
      return date;
    }
  }, [date, locale]);

  const hasActivity = data
    ? (data.attendance.total + data.fees.count + data.admissions.newApplications
       + data.hifz.records + data.notices.published + data.visitors.checkedIn
       + data.gatePasses.issued + data.finance.items.length + data.muhasaba.records
       + data.library.booksLent) > 0
    : false;

  const isRtl = dir() === "rtl";
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div dir={dir()} className="space-y-6 p-4 sm:p-6 print:p-0">
      {/* Header — emerald→teal gradient tile with Islamic 8-point star pattern */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:flex-row">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/20 ring-1 ring-white/30">
            <div className="pointer-events-none absolute inset-0 opacity-[0.15]" aria-hidden="true" style={ISLAMIC_PATTERN} />
            <FileText className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("dailyreport.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("dailyreport.subtitle")}</p>
          </div>
        </div>

        {/* Date picker + print */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-background p-1">
            <Button
              variant="ghost" size="icon" className="size-8"
              onClick={() => setDate((d) => shiftDate(d, -1))}
              aria-label="Previous day"
            >
              <PrevIcon className="size-4" />
            </Button>
            <Input
              type="date"
              value={date}
              max={todayStr()}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="h-8 w-[150px] border-0 bg-transparent px-2 text-sm focus-visible:ring-0"
              aria-label={t("dailyreport.date")}
            />
            <Button
              variant="ghost" size="icon" className="size-8"
              onClick={() => setDate((d) => shiftDate(d, 1))}
              disabled={date >= todayStr()}
              aria-label="Next day"
            >
              <NextIcon className="size-4" />
            </Button>
          </div>
          {date !== todayStr() && (
            <Button variant="outline" size="sm" onClick={() => setDate(todayStr())} className="h-9">
              {t("common.today")}
            </Button>
          )}
          <Button
            onClick={handlePrint}
            size="sm"
            className="h-9 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-600/20 hover:from-emerald-600 hover:to-teal-600"
          >
            <Printer className="size-4" />
            <span className="hidden sm:inline">{t("dailyreport.print")}</span>
          </Button>
        </div>
      </div>

      {/* Date chip — visible on print too */}
      <div className="flex items-center justify-center print:block">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          {dateLabel}
        </span>
      </div>

      {error ? (
        <Card className="border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40">
          <CardContent className="flex items-center gap-3 py-4 text-sm text-rose-700 dark:text-rose-300">
            <AlertTriangle className="size-5 shrink-0" />
            <span className="flex-1">{error}</span>
            <Button size="sm" variant="outline" onClick={() => void load(date)} className="print:hidden">
              {t("common.confirm")}
            </Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      ) : !data ? null : !hasActivity ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="grid size-16 place-items-center rounded-2xl bg-muted/40 text-muted-foreground">
              <Inbox className="size-8" />
            </div>
            <div>
              <p className="text-lg font-semibold">{t("dailyreport.noActivity")}</p>
              <p className="text-sm text-muted-foreground">{dateLabel}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <DailySummaryCards data={data} />
          <DailyDetails data={data} />
        </>
      )}
    </div>
  );
}
