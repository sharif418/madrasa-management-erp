// Shared types + helpers for the Exams module
export type TermKey = "first" | "second" | "final" | null;

export type ExamListItem = {
  id: string;
  name: string;
  classId: string | null;
  className: string | null;
  term: TermKey;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  _count: { results: number };
};

export type ClassOption = { id: string; name: string };

// Grade scale — matches backend report-card endpoint
export function gradeFor(pct: number): "A+" | "A" | "B" | "C" | "D" | "F" {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

export const TERM_LIST: Exclude<TermKey, null>[] = ["first", "second", "final"];

export const TERM_TINT: Record<string, string> = {
  first: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  second: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
  final: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
};

export const GRADE_TINT: Record<string, string> = {
  "A+": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
  A: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-900",
  B: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900",
  C: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900",
  D: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-900",
  F: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900",
};

export const MEDAL_TINT: Record<number, string> = {
  1: "from-amber-400 to-yellow-500 text-white",
  2: "from-slate-300 to-slate-400 text-slate-900",
  3: "from-orange-400 to-amber-600 text-white",
};

export function termLabelKey(term: string): string {
  if (term === "first") return "exams.termFirst";
  if (term === "second") return "exams.termSecond";
  if (term === "final") return "exams.termFinal";
  return "common.none";
}

export function gradeLabelKey(grade: string): string {
  if (grade === "A+") return "exams.gradeAPlus";
  if (grade === "A") return "exams.gradeA";
  if (grade === "B") return "exams.gradeB";
  if (grade === "C") return "exams.gradeC";
  if (grade === "D") return "exams.gradeD";
  if (grade === "F") return "exams.gradeF";
  return "common.none";
}

export function toDateInput(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
