// Shared finance domain types used across the finance module UI.
export type FundType = "general" | "lillah" | "waqf" | "zakat" | "sadaqah";
export type TxType = "income" | "expense" | "transfer";
export type PaymentMethod = "cash" | "bkash" | "nagad" | "bank" | "wallet";

export type Fund = {
  id: string;
  name: string;
  type: FundType;
  balance: number;
  description?: string | null;
  createdAt: string;
  _count?: { transactions: number };
};

export type Transaction = {
  id: string;
  fundId: string;
  amount: number;
  type: TxType;
  category?: string | null;
  description?: string | null;
  relatedStudentId?: string | null;
  tamlikProof?: string | null;
  paymentMethod?: PaymentMethod | null;
  date: string;
  createdAt: string;
  fund: { name: string; type: FundType };
  student?: { id: string; name: string; rollNo?: string | null } | null;
};

export type Overview = {
  funds: Fund[];
  totalBalance: number;
  last30d: { income: number; expense: number; transfer: number };
  byType: Record<string, number>;
  recent: Transaction[];
};

export type TxListResponse = {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
  sums: { income: number; expense: number; transfer: number };
};

// Fund-type color tokens (no indigo/blue except waqf=blue as spec required)
export const fundTypeColors: Record<
  FundType,
  { badge: string; ring: string; chip: string; gradient: string; dot: string }
> = {
  general: {
    badge:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700",
    ring: "ring-slate-200 dark:ring-slate-700",
    chip: "bg-slate-500",
    gradient: "from-slate-600 to-slate-800",
    dot: "bg-slate-500",
  },
  lillah: {
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    ring: "ring-emerald-200 dark:ring-emerald-800",
    chip: "bg-emerald-500",
    gradient: "from-emerald-600 to-emerald-800",
    dot: "bg-emerald-500",
  },
  waqf: {
    badge:
      "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    ring: "ring-blue-200 dark:ring-blue-800",
    chip: "bg-blue-500",
    gradient: "from-blue-600 to-blue-800",
    dot: "bg-blue-500",
  },
  zakat: {
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    ring: "ring-amber-200 dark:ring-amber-800",
    chip: "bg-amber-500",
    gradient: "from-amber-500 to-amber-700",
    dot: "bg-amber-500",
  },
  sadaqah: {
    badge:
      "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    ring: "ring-rose-200 dark:ring-rose-800",
    chip: "bg-rose-500",
    gradient: "from-rose-500 to-rose-700",
    dot: "bg-rose-500",
  },
};

export const txTypeColors: Record<
  TxType,
  { amount: string; badge: string; dot: string }
> = {
  income: {
    amount: "text-emerald-600 dark:text-emerald-300",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
  expense: {
    amount: "text-rose-600 dark:text-rose-300",
    badge:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    dot: "bg-rose-500",
  },
  transfer: {
    amount: "text-violet-600 dark:text-violet-300",
    badge:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200 dark:border-violet-800",
    dot: "bg-violet-500",
  },
};
