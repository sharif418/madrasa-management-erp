// Shared types for the Student Profile 360° view.
// Mirrors the shape returned by GET /api/students/[id]/profile.

export type ParaStatus = "memorized" | "in-progress" | "not-started";

export type ProfileStudent = {
  id: string;
  name: string;
  nameArabic: string | null;
  rollNo: string | null;
  gender: string;
  dob: string | null;
  phone: string | null;
  address: string | null;
  bloodGroup: string | null;
  photoUrl: string | null;
  isHafiz: boolean;
  isZakatEligible: boolean;
  isActive: boolean;
  admissionDate: string;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianRelation: string | null;
};

export type ProfileClass = {
  name: string;
  curriculum: string;
  level: number;
} | null;

export type WalletLogLite = {
  id: string;
  amount: number;
  trxType: string;
  description: string | null;
  createdAt: string;
};

export type ProfileHifzRecord = {
  id: string;
  type: string;
  paraNumber: number;
  surahName: string | null;
  ayahFrom: number | null;
  ayahTo: number | null;
  qualityRating: number | null;
  mistakesCount: number;
  status: string;
  notes: string | null;
  recordedAt: string;
};

export type ProfileFee = {
  id: string;
  amount: number;
  paidAmount: number;
  status: string;
  method: string | null;
  paidDate: string | null;
  dueDate: string | null;
};

export type ProfileExamResult = {
  id: string;
  subject: string;
  marks: number;
  total: number;
  grade: string | null;
  remarks: string | null;
  exam: { name: string; term: string | null };
};

export type ProfileData = {
  student: ProfileStudent;
  class: ProfileClass;
  wallet: { balance: number; recentLogs: WalletLogLite[] };
  hifz: {
    totalRecords: number;
    avgQuality: number;
    parasCovered: { para: number; status: ParaStatus }[];
    recentRecords: ProfileHifzRecord[];
  };
  attendance: {
    last30d: { present: number; absent: number; late: number; leave: number; rate: number; total: number };
    series: { date: string; status: string }[];
  };
  fees: {
    totalDue: number;
    totalPaid: number;
    pendingCount: number;
    recentCollections: ProfileFee[];
  };
  examResults: ProfileExamResult[];
};

// ---- Visual helpers (shared across tabs) ----

export const paraCellClass: Record<ParaStatus, string> = {
  memorized: "bg-emerald-500 text-white border-emerald-600",
  "in-progress": "bg-amber-400 text-amber-950 border-amber-500",
  "not-started": "bg-muted text-muted-foreground border-border",
};

export function fmtDate(iso: string | null | undefined, locale: string = "en"): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat(
      locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-GB",
      { year: "numeric", month: "short", day: "numeric" }
    ).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

export function starString(rating: number | null | undefined): string {
  if (rating == null) return "—";
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return "★".repeat(r) + "☆".repeat(5 - r);
}

// Initials for avatar fallback (max 2 chars from name)
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
