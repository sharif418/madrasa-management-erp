// Shared types for Muhasaba module
export type SalahStatus = "jamaat" | "alone" | "qadha" | "pending";

export const SALAH_FIELDS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
export type SalahField = (typeof SALAH_FIELDS)[number];

export const ADHKAR_FIELDS = [
  "tahajjud",
  "quranRecitation",
  "morningAdhkar",
  "eveningAdhkar",
  "sadaqah",
] as const;
export type AdhkarField = (typeof ADHKAR_FIELDS)[number];

export type MuhasabaStudent = { id: string; name: string; rollNo: string | null };

export type MuhasabaRecord = {
  id: string;
  tenantId: string;
  studentId: string;
  date: string;
  fajr: SalahStatus;
  dhuhr: SalahStatus;
  asr: SalahStatus;
  maghrib: SalahStatus;
  isha: SalahStatus;
  tahajjud: boolean;
  quranRecitation: boolean;
  morningAdhkar: boolean;
  eveningAdhkar: boolean;
  sadaqah: boolean;
  akhlaqRating: number;
  teacherNote: string | null;
  createdAt: string;
  student: MuhasabaStudent;
};

export type MuhasabaListResponse = {
  items: MuhasabaRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type MuhasabaStats = {
  avgSalahConsistency: number;
  adhkarRate: number;
  avgAkhlaq: number;
  dailyStacked: { date: string; jamaat: number; alone: number; qadha: number }[];
  akhlaqTrend: { date: string; avg: number }[];
  topStudents: {
    id: string;
    name: string;
    rollNo: string | null;
    consistency: number;
    akhlaq: number;
  }[];
};

export const SALAH_TINT: Record<SalahStatus, string> = {
  jamaat: "bg-emerald-500",
  alone: "bg-teal-400",
  qadha: "bg-amber-400",
  pending: "bg-rose-300",
};

export const SALAH_VALUES: SalahStatus[] = ["jamaat", "alone", "qadha", "pending"];

export function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso.slice(0, 10);
  }
}

export function fmtDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return iso.slice(5, 10);
  }
}
