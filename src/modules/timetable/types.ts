// Shared types & helpers for the Timetable module

export type DayCode = "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri";

export const DAY_CODES: DayCode[] = ["sat", "sun", "mon", "tue", "wed", "thu"];

export const DAY_LABEL_KEYS: Record<DayCode, string> = {
  sat: "timetable.saturday",
  sun: "timetable.sunday",
  mon: "timetable.monday",
  tue: "timetable.tuesday",
  wed: "timetable.wednesday",
  thu: "timetable.thursday",
  fri: "timetable.fridayHoliday",
};

export type SlotDTO = {
  id: string;
  classId: string | null;
  className: string | null;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacherId: string | null;
  teacherName: string | null;
  room: string | null;
  createdAt: string;
};

export type ClassOption = { id: string; name: string };
export type TeacherOption = { id: string; name: string };

// Subject color palette — 12 colors, chosen by subject-name hash so the same
// subject always renders in the same color across the grid.
export type SubjectPalette = {
  name: string;
  badge: string; // badge classes
  bg: string; // cell background tint
  border: string;
  dot: string;
  text: string;
};

export const SUBJECT_PALETTE: SubjectPalette[] = [
  { name: "emerald", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-300 dark:border-emerald-800", dot: "bg-emerald-500", text: "text-emerald-800 dark:text-emerald-200" },
  { name: "teal", badge: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200", bg: "bg-teal-50 dark:bg-teal-950/40", border: "border-teal-300 dark:border-teal-800", dot: "bg-teal-500", text: "text-teal-800 dark:text-teal-200" },
  { name: "cyan", badge: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200", bg: "bg-cyan-50 dark:bg-cyan-950/40", border: "border-cyan-300 dark:border-cyan-800", dot: "bg-cyan-500", text: "text-cyan-800 dark:text-cyan-200" },
  { name: "sky", badge: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200", bg: "bg-sky-50 dark:bg-sky-950/40", border: "border-sky-300 dark:border-sky-800", dot: "bg-sky-500", text: "text-sky-800 dark:text-sky-200" },
  { name: "blue", badge: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-300 dark:border-blue-800", dot: "bg-blue-500", text: "text-blue-800 dark:text-blue-200" },
  { name: "violet", badge: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200", bg: "bg-violet-50 dark:bg-violet-950/40", border: "border-violet-300 dark:border-violet-800", dot: "bg-violet-500", text: "text-violet-800 dark:text-violet-200" },
  { name: "purple", badge: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-300 dark:border-purple-800", dot: "bg-purple-500", text: "text-purple-800 dark:text-purple-200" },
  { name: "fuchsia", badge: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200", bg: "bg-fuchsia-50 dark:bg-fuchsia-950/40", border: "border-fuchsia-300 dark:border-fuchsia-800", dot: "bg-fuchsia-500", text: "text-fuchsia-800 dark:text-fuchsia-200" },
  { name: "rose", badge: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200", bg: "bg-rose-50 dark:bg-rose-950/40", border: "border-rose-300 dark:border-rose-800", dot: "bg-rose-500", text: "text-rose-800 dark:text-rose-200" },
  { name: "amber", badge: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200", bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-300 dark:border-amber-800", dot: "bg-amber-500", text: "text-amber-800 dark:text-amber-200" },
  { name: "orange", badge: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200", bg: "bg-orange-50 dark:bg-orange-950/40", border: "border-orange-300 dark:border-orange-800", dot: "bg-orange-500", text: "text-orange-800 dark:text-orange-200" },
  { name: "lime", badge: "bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-200", bg: "bg-lime-50 dark:bg-lime-950/40", border: "border-lime-300 dark:border-lime-800", dot: "bg-lime-500", text: "text-lime-800 dark:text-lime-200" },
];

export function subjectColor(subject: string): SubjectPalette {
  let h = 0;
  for (let i = 0; i < subject.length; i++) {
    h = (h * 31 + subject.charCodeAt(i)) >>> 0;
  }
  return SUBJECT_PALETTE[h % SUBJECT_PALETTE.length];
}

// Generate hourly time rows from 06:00 to 20:00 (24h) — 15 rows
export function timeRows(): string[] {
  const rows: string[] = [];
  for (let h = 6; h <= 20; h++) {
    rows.push(`${String(h).padStart(2, "0")}:00`);
  }
  return rows;
}

// Approximate prayer time markers (hour:minute) — for visual overlay only
export const PRAYER_TIMES: { name: string; time: string; icon: string }[] = [
  { name: "Fajr", time: "05:15", icon: "🌅" },
  { name: "Dhuhr", time: "12:15", icon: "☀️" },
  { name: "Asr", time: "16:00", icon: "🌤️" },
  { name: "Maghrib", time: "18:15", icon: "🌆" },
  { name: "Isha", time: "19:45", icon: "🌙" },
];

// Convert "HH:MM" → minutes since midnight
export function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Convert minutes since midnight → "HH:MM"
export function fromMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Format time for display (12h) — localized
export function fmtTime(t: string, locale: string): string {
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", hour12: true }).format(d);
}

// JS getDay() → 0=Sun..6=Sat  ⇒  map to our DayCode
export function todayCode(): DayCode {
  const map: DayCode[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[new Date().getDay()];
}
