// Shared types for the Wallet module UI
export type TrxType = "top_up" | "canteen" | "laundry" | "fee_deduction";

export type WalletStudent = {
  id: string;
  name: string;
  nameArabic?: string | null;
  rollNo?: string | null;
  isActive: boolean;
};

export type WalletListItem = {
  id: string;
  studentId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
  student: WalletStudent;
  recentLog: {
    id: string;
    amount: number;
    trxType: TrxType;
    createdAt: string;
  } | null;
  logsCount: number;
};

export type WalletListResponse = {
  items: WalletListItem[];
  total: number;
  page: number;
  limit: number;
  totalBalance: number;
  activeWallets: number;
};

export type WalletLog = {
  id: string;
  walletId: string;
  amount: number;
  trxType: TrxType;
  description?: string | null;
  createdAt: string;
};

export type WalletDetailResponse = {
  wallet: {
    id: string;
    studentId: string;
    balance: number;
    createdAt: string;
    updatedAt: string;
    student: WalletStudent & { class?: { name: string } | null };
  };
  logs: WalletLog[];
  stats: {
    totalTransactions: number;
    totalTopUp: number;
  };
};

// Color tokens per trx type — used by badges + amount text
export const trxTypeColors: Record<
  TrxType,
  { badge: string; dot: string; amount: string; icon: string }
> = {
  top_up: {
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
    amount: "text-emerald-600 dark:text-emerald-400",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  canteen: {
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
    amount: "text-amber-600 dark:text-amber-400",
    icon: "text-amber-600 dark:text-amber-400",
  },
  laundry: {
    badge:
      "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800",
    dot: "bg-teal-500",
    amount: "text-teal-600 dark:text-teal-400",
    icon: "text-teal-600 dark:text-teal-400",
  },
  fee_deduction: {
    badge:
      "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    dot: "bg-rose-500",
    amount: "text-rose-600 dark:text-rose-400",
    icon: "text-rose-600 dark:text-rose-400",
  },
};

// Balance color helpers
// Positive (≥1) = emerald, zero/negative = rose, low (<100) = amber
export function balanceTone(balance: number): string {
  if (balance <= 0) return "text-rose-600 dark:text-rose-400";
  if (balance < 100) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}
