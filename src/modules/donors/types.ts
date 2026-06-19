"use client";
// Donors module — shared types & UI helpers
import type { LucideIcon } from "lucide-react";
import { User, Building2, RefreshCw } from "lucide-react";

export type DonorType = "individual" | "organization" | "recurring";

export type Donor = {
  id: string;
  name: string;
  nameArabic: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  country: string;
  type: string;
  preferredFund: string | null;
  totalContributed: number;
  contributionCount: number;
  isRecurring: boolean;
  firstDonation: string | null;
  lastDonation: string | null;
  notes: string | null;
  createdAt: string;
};

export type Donation = {
  id: string;
  donorId: string | null;
  donorName: string;
  amount: number;
  fund: string;
  purpose: string | null;
  paymentMethod: string | null;
  reference: string | null;
  isRecurring: boolean;
  status: string;
  date: string;
  donor?: { name: string; country: string } | null;
};

export type DonorKpis = {
  totalDonors: number;
  totalRaised: number;
  recurringCount: number;
  countriesCount: number;
  avgDonation: number;
};

export const TYPE_META: Record<string, { tint: string; icon: LucideIcon; label: string }> = {
  individual: {
    tint: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    icon: User,
    label: "individual",
  },
  organization: {
    tint: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300",
    icon: Building2,
    label: "organization",
  },
  recurring: {
    tint: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    icon: RefreshCw,
    label: "recurringType",
  },
};

export const FUND_TINT: Record<string, string> = {
  zakat: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  lillah: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
  waqf: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  sadaqah: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  general: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export const DONOR_TYPES: DonorType[] = ["individual", "organization", "recurring"];
export const DONOR_FUNDS = ["zakat", "lillah", "waqf", "sadaqah", "general"];
export const PAYMENT_METHODS = ["cash", "bkash", "nagad", "bank", "card", "sslcommerz"];

// Country → flag emoji map (common ones). Falls back to 🌐.
const FLAGS: Record<string, string> = {
  bangladesh: "🇧🇩", bd: "🇧🇩",
  "saudi arabia": "🇸🇦", sa: "🇸🇦", ksa: "🇸🇦",
  "united arab emirates": "🇦🇪", uae: "🇦🇪",
  pakistan: "🇵🇰", pk: "🇵🇰",
  india: "🇮🇳", in: "🇮🇳",
  malaysia: "🇲🇾", my: "🇲🇾",
  indonesia: "🇮🇩", id: "🇮🇩",
  "united kingdom": "🇬🇧", uk: "🇬🇧",
  "united states": "🇺🇸", usa: "🇺🇸", us: "🇺🇸",
  qatar: "🇶🇦", qa: "🇶🇦",
  kuwait: "🇰🇼", kw: "🇰🇼",
  bahrain: "🇧🇭", bh: "🇧🇭",
  oman: "🇴🇲", om: "🇴🇲",
  turkey: "🇹🇷", tr: "🇹🇷",
  egypt: "🇪🇬", eg: "🇪🇬",
};

export function countryFlag(country: string): string {
  if (!country) return "🌐";
  return FLAGS[country.toLowerCase().trim()] || "🌐";
}
