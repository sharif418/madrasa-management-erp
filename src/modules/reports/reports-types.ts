// Shared types + helpers for the Reports module.
// Shape mirrors the JSON returned by GET /api/reports.

export type StudentSummary = {
  total: number;
  active: number;
  inactive: number;
  hafiz: number;
  zakatEligible: number;
  byGender: { male: number; female: number };
  byClass: { classId: string; className: string; count: number }[];
};

export type FinanceSummary = {
  totalIncome: number;
  totalExpense: number;
  net: number;
  byFundType: { type: string; amount: number }[];
  topExpenses: { category: string; amount: number }[];
};

export type HifzSummary = {
  totalRecords: number;
  avgQuality: number;
  byType: { type: string; count: number }[];
  topStudents: { id: string; name: string; count: number }[];
  parasCovered: number;
  parasDistribution: { para: number; count: number }[];
};

export type AttendanceSummary = {
  avgRate: number;
  counts: {
    present: number; absent: number; late: number; leave: number; total: number;
  };
  byClass: {
    classId: string; className: string;
    rate: number; present: number; total: number;
  }[];
};

export type FeeSummary = {
  feeCollected: number;
  feeDue: number;
  pendingCount: number;
  paidCount: number;
  byClass: {
    classId: string; className: string;
    collected: number; due: number;
  }[];
};

export type ReportsData = {
  studentSummary: StudentSummary;
  financeSummary: FinanceSummary;
  hifzSummary: HifzSummary;
  attendanceSummary: AttendanceSummary;
  feeSummary: FeeSummary;
};

// Consistent palette for all charts (emerald/teal/amber/rose + accents)
export const PALETTE = {
  emerald: "#10b981",
  teal: "#14b8a6",
  amber: "#f59e0b",
  rose: "#f43f5e",
  cyan: "#06b6d4",
  violet: "#8b5cf6",
  slate: "#64748b",
} as const;

export const FUND_COLORS: Record<string, string> = {
  general: PALETTE.emerald,
  lillah: PALETTE.amber,
  waqf: PALETTE.violet,
  zakat: PALETTE.rose,
  sadaqah: PALETTE.cyan,
};

export const STATUS_COLORS: Record<string, string> = {
  present: PALETTE.emerald,
  late: PALETTE.amber,
  absent: PALETTE.rose,
  leave: PALETTE.cyan,
};

export const HIFZ_TYPE_COLORS: Record<string, string> = {
  sabak: PALETTE.emerald,
  sabaq_para: PALETTE.amber,
  dhor: PALETTE.violet,
};

// Format a number as currency (BDT by default — madrasa context)
export function fmtCurrency(n: number, compact = false): string {
  if (compact) {
    return `৳${new Intl.NumberFormat("en-US", {
      notation: "compact", maximumFractionDigits: 1,
    }).format(n)}`;
  }
  return `৳${new Intl.NumberFormat("en-US").format(Math.round(n))}`;
}

export function fmtNum(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

// Tooltip style shared by all recharts charts
export const CHART_TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  fontSize: 12,
  background: "var(--popover)",
  color: "var(--popover-foreground)",
} as const;
