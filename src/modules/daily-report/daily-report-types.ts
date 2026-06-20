// Shared types for the Daily Report module — kept tiny to avoid OOM bloat.

export type DailyByClass = {
  classId: string; className: string;
  present: number; absent: number; late: number; leave: number;
  total: number; rate: number;
};

export type DailyFeeMethod = { method: string; count: number; amount: number };

export type DailyHifzItem = { student: string; type: string; para: number; quality: number | null };
export type DailyHifzType = { type: string; count: number };

export type DailyNoticeItem = { title: string; type: string; audience: string };
export type DailyNoticeType = { type: string; count: number };

export type DailyVisitorItem = {
  name: string; purpose: string;
  checkIn: string; checkOut: string | null;
};

export type DailyFinanceItem = {
  fund: string; type: string; amount: number; description: string | null;
};
export type DailyFundSummary = { fundName: string; income: number; expense: number };

export type DailyReport = {
  date: string;
  attendance: {
    present: number; absent: number; late: number; leave: number;
    total: number; rate: number; byClass: DailyByClass[];
  };
  fees: { collected: number; count: number; methods: DailyFeeMethod[] };
  admissions: { newApplications: number; approved: number; enrolled: number };
  hifz: {
    records: number; byType: DailyHifzType[]; avgQuality: number;
    items: DailyHifzItem[];
  };
  notices: {
    published: number; byType: DailyNoticeType[];
    items: DailyNoticeItem[];
  };
  visitors: {
    checkedIn: number; checkedOut: number; items: DailyVisitorItem[];
  };
  gatePasses: { issued: number; used: number; pending: number };
  finance: {
    income: number; expense: number; net: number;
    byFund: DailyFundSummary[]; items: DailyFinanceItem[];
  };
  muhasaba: { records: number; avgAkhlaq: number };
  library: { booksLent: number; returned: number };
};

// Format currency consistently across the module.
export function fmtCurrency(n: number, locale: string = "en") {
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar" : "bn-BD", {
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return String(n);
  }
}

// Format an ISO timestamp into a short local time.
export function fmtTime(iso: string | null, locale: string = "en") {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}
