"use client";
// PrayerTimeWidget — header pill showing next prayer + countdown.
import * as React from "react";
import { useRouter } from "next/navigation";
import { Moon, Compass } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

type Times = {
  fajrStr: string; sunriseStr: string; dhuhrStr: string;
  asrStr: string; maghribStr: string; ishaStr: string;
  nextPrayer: string; nextPrayerStr: string;
  nextPrayerTime: string; timeUntilNext: number;
};
type Resp = { available: true; times: Times } | { available: false; message: string };

const PRAYER_KEYS: Record<string, string> = {
  fajr: "prayer.fajr", sunrise: "prayer.sunrise", dhuhr: "prayer.dhuhr",
  asr: "prayer.asr", maghrib: "prayer.maghrib", isha: "prayer.isha",
};

function fmtCountdown(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins <= 0) return "";
  const h = Math.floor(mins / 60), m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function PrayerTimeWidget() {
  const { t, locale } = useApp();
  const router = useRouter();
  const [resp, setResp] = React.useState<Resp | null>(null);
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/prayer-times", { cache: "no-store" });
        const j = (await r.json()) as Resp;
        if (alive) setResp(j);
      } catch { /* silent */ }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // Local countdown ticker every 5s
  React.useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 5_000);
    return () => clearInterval(id);
  }, []);

  if (!resp || !resp.available) {
    return (
      <button
        onClick={() => router.push("/settings")}
        className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50/60 px-2.5 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
        title={resp?.message || t("prayer.setLocation")}
      >
        <Compass className="size-3" />
        <span>{t("prayer.setLocation")}</span>
      </button>
    );
  }

  const times = resp.times;
  const target = new Date(times.nextPrayerTime).getTime();
  const msLeft = Math.max(0, target - Date.now());
  const minsLeft = Math.floor(msLeft / 60000);
  const isNow = minsLeft <= 10;
  const countdown = fmtCountdown(msLeft);
  const nameKey = PRAYER_KEYS[times.nextPrayer] || "prayer.nextPrayer";

  const allTimes = [
    ["prayer.fajr", times.fajrStr], ["prayer.sunrise", times.sunriseStr],
    ["prayer.dhuhr", times.dhuhrStr], ["prayer.asr", times.asrStr],
    ["prayer.maghrib", times.maghribStr], ["prayer.isha", times.ishaStr],
  ] as const;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            dir="ltr"
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/70 px-2.5 py-1 text-[11px] font-medium text-emerald-700 cursor-default hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
          >
            <Moon className="size-3.5" />
            <span className="font-semibold">{t(nameKey)}</span>
            <span className="opacity-70">{times.nextPrayerStr}</span>
            <span className="hidden md:inline opacity-80">
              {isNow
                ? `· ${t("prayer.now")}`
                : countdown ? `· ${t("prayer.in")} ${countdown}` : ""}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-44 p-0" align="end">
          <div dir={locale === "ar" ? "rtl" : "ltr"} className="px-3 py-2">
            <p className="mb-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              {t("prayer.allTimes")}
            </p>
            <ul className="space-y-0.5 text-[11px]">
              {allTimes.map(([k, v]) => (
                <li key={k} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">{t(k)}</span>
                  <span className="font-medium tabular-nums">{v}</span>
                </li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
