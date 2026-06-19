// Shared types & helpers for the Hifz Tracking module
// Original Islamic terminology (Sabak / Sabaq Para / Dhor / Para / Surah / Ayah)
// is kept verbatim across all languages per project convention.

export type HifzType = "sabak" | "sabaq_para" | "dhor";
export type HifzStatus = "completed" | "revision" | "weak";
export type ParaStatus = "memorized" | "in-progress" | "not-started";

export type HifzRecord = {
  id: string;
  type: HifzType;
  paraNumber: number;
  surahName: string | null;
  ayahFrom: number | null;
  ayahTo: number | null;
  qualityRating: number | null;
  mistakesCount: number;
  notes: string | null;
  status: HifzStatus;
  recordedAt: string;
  studentId: string;
  studentName: string;
  studentNameArabic: string | null;
  rollNo: string | null;
  teacherId: string | null;
  teacherName: string | null;
};

export type HifzListResponse = {
  items: HifzRecord[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ProgressResponse = {
  student: {
    id: string;
    name: string;
    nameArabic: string | null;
    rollNo: string | null;
    isHafiz: boolean;
  };
  totalParas: number;
  last30d: number;
  byType: { sabak: number; sabaq_para: number; dhor: number };
  avgQuality: number;
  parasCovered: { para: number; status: ParaStatus }[];
  trend: {
    index: number;
    date: string;
    quality: number;
    type: HifzType;
    para: number;
  }[];
  totalRecords: number;
};

export type StudentOption = {
  id: string;
  name: string;
  nameArabic?: string | null;
  rollNo?: string | null;
};

// Type metadata for UI rendering (icons handled by caller; labels via i18n)
export const HIFZ_TYPES: HifzType[] = ["sabak", "sabaq_para", "dhor"];
export const HIFZ_STATUSES: HifzStatus[] = ["completed", "revision", "weak"];

// i18n key helpers — caller uses useApp().t()
export const typeLabelKey = (t: HifzType) =>
  t === "sabak" ? "hifz.sabak" : t === "sabaq_para" ? "hifz.sabaqPara" : "hifz.dhor";

export const statusLabelKey = (s: HifzStatus) =>
  s === "completed" ? "hifz.completed" : s === "revision" ? "hifz.revision" : "hifz.weak";

// Visual accent for each type (Tailwind-friendly hex; kept warm/earth-toned, no indigo/blue)
export const typeAccent: Record<HifzType, string> = {
  sabak: "#0d9488",       // teal-600 (new lesson)
  sabaq_para: "#ca8a04",  // yellow-700 (para lesson)
  dhor: "#9333ea",        // purple-700 (revision)
};

// Status color tokens for badges
export const statusBadgeClass: Record<HifzStatus, string> = {
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  revision: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  weak: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

// Para cell color by status
export const paraCellClass: Record<ParaStatus, string> = {
  memorized: "bg-emerald-500 text-white border-emerald-600",
  "in-progress": "bg-amber-400 text-amber-950 border-amber-500",
  "not-started": "bg-muted text-muted-foreground border-border",
};

// Format a date for display (locale-aware short)
export function fmtDate(iso: string, locale: string = "en"): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

// Star rating renderer (filled stars count = rating)
export function starString(rating: number | null | undefined): string {
  if (rating == null) return "—";
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return "★".repeat(r) + "☆".repeat(5 - r);
}
