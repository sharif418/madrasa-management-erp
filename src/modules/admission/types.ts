// Admission module shared types
export type Application = {
  id: string;
  applicantName: string;
  applicantNameArabic: string | null;
  fatherName: string;
  motherName: string | null;
  dateOfBirth: string | null;
  gender: string;
  guardianPhone: string;
  guardianEmail: string | null;
  address: string | null;
  previousInstitution: string | null;
  appliedLevel: string | null;
  appliedClass: string | null;
  hifzBackground: string | null;
  applicationDate: string;
  status: string;
  reviewedBy: string | null;
  reviewNotes: string | null;
  interviewDate: string | null;
};

export type AdmissionData = {
  items: Application[];
  kpis: {
    total: number;
    pending: number;
    approved: number;
    enrolled: number;
  };
};

export const STATUS_FLOW = ["pending", "reviewing", "approved", "enrolled", "rejected"] as const;

export const STATUS_TINT: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
  reviewing: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  enrolled: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
};
