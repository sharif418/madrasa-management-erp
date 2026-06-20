// Shared Tajweed types and constants
import type { StudentOption } from "./hifz-types";

export type Grade = "EXCELLENT" | "GOOD" | "SATISFACTORY" | "NEEDS_IMPROVEMENT";

export function gradeFor(total: number): Grade {
  if (total >= 85) return "EXCELLENT";
  if (total >= 70) return "GOOD";
  if (total >= 50) return "SATISFACTORY";
  return "NEEDS_IMPROVEMENT";
}

export const gradeLabelKey: Record<Grade, string> = {
  EXCELLENT: "hifz.excellent",
  GOOD: "hifz.good",
  SATISFACTORY: "hifz.satisfactory",
  NEEDS_IMPROVEMENT: "hifz.needsImprovement",
};

// Badge class for each grade
export const GRADE_TINTS: Record<Grade, string> = {
  EXCELLENT: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  GOOD: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300",
  SATISFACTORY: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  NEEDS_IMPROVEMENT: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
};

// Score colors for radar / bars
export const CATEGORY_COLORS: { key: TajweedCategory; labelKey: string; color: string }[] = [
  { key: "madd", labelKey: "hifz.maddScore", color: "#10b981" },
  { key: "waqf", labelKey: "hifz.waqfScore", color: "#0d9488" },
  { key: "tizkeer", labelKey: "hifz.tizkeerScore", color: "#f59e0b" },
  { key: "nun", labelKey: "hifz.nunScore", color: "#9333ea" },
  { key: "makhraj", labelKey: "hifz.makhrajScore", color: "#dc2626" },
];

export type TajweedCategory = "madd" | "waqf" | "tizkeer" | "nun" | "makhraj";

export type TajweedItem = {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string | null;
  date: string;
  surahName: string;
  ayahFrom: number;
  ayahTo: number;
  maddScore: number;
  waqfScore: number;
  tizkeerScore: number;
  nunScore: number;
  makhrajScore: number;
  totalScore: number;
  grade: Grade;
  comments: string | null;
  improvementAreas: string[];
};

export type TajweedStats = {
  count: number;
  avgMadd: number;
  avgWaqf: number;
  avgTizkeer: number;
  avgNun: number;
  avgMakhraj: number;
  avgTotal: number;
};

export type TajweedListResponse = {
  items: TajweedItem[];
  stats: TajweedStats;
  trend: { date: string; total: number; grade: Grade }[];
};

// Improvement areas (key used for storage, label shown in UI)
export const IMPROVEMENT_AREAS: { key: string; label: string; labelKey?: string }[] = [
  { key: "madd", label: "Madd", labelKey: "hifz.maddScore" },
  { key: "waqf", label: "Waqf", labelKey: "hifz.waqfScore" },
  { key: "tizkeer", label: "Tizkeer", labelKey: "hifz.tizkeerScore" },
  { key: "nun", label: "Nun Sakin", labelKey: "hifz.nunScore" },
  { key: "makhraj", label: "Makhraj", labelKey: "hifz.makhrajScore" },
  { key: "ghunnah", label: "Ghunnah" },
  { key: "idgham", label: "Idgham" },
  { key: "ikhfa", label: "Ikhfa" },
  { key: "iqlab", label: "Iqlab" },
  { key: "qalqalah", label: "Qalqalah" },
];

export type { StudentOption };
