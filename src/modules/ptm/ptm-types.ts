// Shared types for the PTM (Parent-Teacher Meeting) module.
export type PtmStatus = "scheduled" | "completed" | "cancelled";

export type PtmItem = {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string | null;
  classId: string | null;
  className: string | null;
  teacherId: string;
  teacherName: string;
  teacherDesignation: string | null;
  date: string; // ISO
  time: string; // HH:mm
  duration: number;
  topic: string | null;
  notes: string | null;
  status: PtmStatus;
  completedAt: string | null;
  createdAt: string;
};

export const DURATION_OPTIONS = [15, 30, 45, 60] as const;

// Status → Tailwind badge classes (amber / emerald / rose)
export const PTM_STATUS_TONE: Record<PtmStatus, string> = {
  scheduled: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
};

export const PTM_STATUS_KEY: Record<PtmStatus, string> = {
  scheduled: "ptm.scheduled",
  completed: "ptm.completed",
  cancelled: "ptm.cancelled",
};

// Islamic 8-point star SVG pattern overlay (shared with other views)
export const ISLAMIC_PATTERN: React.CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='white' stroke-width='1'><polygon points='20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14'/></g></svg>\")",
  backgroundSize: "40px 40px",
  backgroundRepeat: "repeat",
};

// Initials for avatar fallback
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join("");
}
