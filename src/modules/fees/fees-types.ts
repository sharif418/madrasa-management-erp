// Shared types for the Fees module (client-side).
export type FeeType = "tuition" | "admission" | "exam" | "hostel" | "transport";
export type FeeFrequency = "monthly" | "quarterly" | "yearly" | "one_time";
export type CollectionStatus = "pending" | "partial" | "paid" | "overdue";

export type FeeStructure = {
  id: string;
  name: string;
  amount: number;
  type: FeeType | string;
  frequency: FeeFrequency | string;
  lateFeePerDay: number;
  classId: string | null;
  className: string | null;
  createdAt: string;
  collectionsCount: number;
};

export type FeeCollectionItem = {
  id: string;
  studentId: string;
  studentName: string;
  className: string | null;
  feeStructureId: string | null;
  feeName: string | null;
  feeType: FeeType | string | null;
  amount: number;
  paidAmount: number;
  lateFee: number;
  dueDate: string | null;
  paidDate: string | null;
  status: CollectionStatus | string;
  method: string | null;
  notes: string | null;
  createdAt: string;
};

export type CollectionsSummary = {
  totalCollected: number;
  totalOutstanding: number;
  collectionRate: number;
  count: number;
};

export type GenerateResult = {
  generated: number;
  skipped: number;
  total: number;
  message?: string;
};

// Color map for fee type badges — matches task spec
export const FEE_TYPE_TONES: Record<string, string> = {
  tuition: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  admission: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  exam: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  hostel: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  transport: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
};

// Color map for status badges
export const STATUS_TONES: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  partial: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  pending: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  overdue: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

// Month options for the generate dialog (1-12). Labels resolved at render time
// via Intl.DateTimeFormat so we don't depend on translation keys.
export const MONTH_VALUES = [
  "01", "02", "03", "04", "05", "06",
  "07", "08", "09", "10", "11", "12",
];
