// Local prayer-time calculator built on the `adhan` npm package.
// Returns Date objects (UTC instants) + already-formatted local time strings
// in the location's timezone (derived from longitude).
import {
  CalculationMethod, Coordinates, Madhab, PrayerTimes,
} from "adhan";

export type PrayerName = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";

export type PrayerTimesResult = {
  fajr: Date; sunrise: Date; dhuhr: Date; asr: Date; maghrib: Date; isha: Date;
  // formatted HH:MM strings in the location's local timezone
  fajrStr: string; sunriseStr: string; dhuhrStr: string;
  asrStr: string; maghribStr: string; ishaStr: string;
  nextPrayer: PrayerName;
  nextPrayerTime: Date;
  nextPrayerStr: string;
  timeUntilNext: number; // ms
  timezone: string;
};

/** Build a longitude-based IANA timezone label (e.g. Etc/GMT-6 for +06:00). */
export function tzFromLongitude(longitude: number): string {
  const off = Math.round(longitude / 15);
  // Etc/GMT sign is reversed by POSIX convention
  const sign = off >= 0 ? "-" : "+";
  return `Etc/GMT${sign}${Math.abs(off)}`;
}

/** Format a Date in the location's local time as "h:mm AM/PM" (locale-aware). */
export function formatPrayerTime(date: Date, longitude: number, locale = "en"): string {
  const tz = tzFromLongitude(longitude);
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: true,
    }).format(date);
  } catch {
    return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: true });
  }
}

const PRAYER_ORDER: PrayerName[] = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

/** Compute prayer times for a lat/lng on a given date using adhan (MWL method). */
export function getPrayerTimes(
  latitude: number, longitude: number, date: Date, locale = "en",
): PrayerTimesResult {
  const coords = new Coordinates(latitude, longitude);
  const params = CalculationMethod.MuslimWorldLeague();
  params.madhab = Madhab.Shafi;
  const pt = new PrayerTimes(coords, date, params);
  const fmt = (d: Date) => formatPrayerTime(d, longitude, locale);

  // Adhan returns "none" for nextPrayer when all of today's prayers are past.
  // In that case, fall back to tomorrow's Fajr.
  let nextName = pt.nextPrayer() as PrayerName | "none";
  let nextTime: Date;
  if (nextName === "none") {
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowPt = new PrayerTimes(coords, tomorrow, params);
    nextName = "fajr";
    nextTime = tomorrowPt.fajr;
  } else {
    nextTime = pt.timeForPrayer(nextName) || pt.isha;
  }

  return {
    fajr: pt.fajr, sunrise: pt.sunrise, dhuhr: pt.dhuhr,
    asr: pt.asr, maghrib: pt.maghrib, isha: pt.isha,
    fajrStr: fmt(pt.fajr), sunriseStr: fmt(pt.sunrise), dhuhrStr: fmt(pt.dhuhr),
    asrStr: fmt(pt.asr), maghribStr: fmt(pt.maghrib), ishaStr: fmt(pt.isha),
    nextPrayer: nextName as PrayerName,
    nextPrayerTime: nextTime,
    nextPrayerStr: fmt(nextTime),
    timeUntilNext: Math.max(0, nextTime.getTime() - date.getTime()),
    timezone: tzFromLongitude(longitude),
  };
}

/** Build a quick "in 2h 15m" style countdown string from a ms duration. */
export function formatCountdown(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins <= 0) return "now";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Resolve the next prayer info from a PrayerTimesResult (already computed). */
export function getNextPrayer(times: PrayerTimesResult) {
  return { name: times.nextPrayer, time: times.nextPrayerTime, timeUntil: times.timeUntilNext };
}

/** Return all prayer entries in order (used by tooltip + lists). */
export function listPrayers(times: PrayerTimesResult): { name: PrayerName; timeStr: string }[] {
  return PRAYER_ORDER.map((n) => ({ name: n, timeStr: times[`${n}Str` as keyof PrayerTimesResult] as string }));
}
