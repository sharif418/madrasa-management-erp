// Shared types for the Billing module
export type Plan = "trial" | "basic" | "pro" | "enterprise";

export type BillingInvoice = {
  id: string;
  number: string;
  date: string;
  plan: string;
  amount: number;
  status: "paid" | "pending";
};

export type BillingData = {
  plan: Plan;
  status: string;
  currency: string;
  tenantName: string;
  email: string | null;
  memberSince: string;
  trialEndsAt: string | null;
  daysRemaining: number | null;
  usage: {
    students: number;
    teachers: number;
    modules: number;
    storage: string;
  };
  limits: {
    students: number; // -1 = unlimited
    teachers: number;
    storage: string;
  };
  invoices: BillingInvoice[];
  totalPaid: number;
  nextBilling: string | null;
};

// Static pricing metadata — kept in sync with API PLAN_PRICES
export const PLAN_PRICES: Record<Plan, number> = {
  trial: 0,
  basic: 999,
  pro: 2499,
  enterprise: 5999,
};

export const PLAN_ORDER: Plan[] = ["trial", "basic", "pro", "enterprise"];

// Plan ranking — for upgrade vs downgrade comparison
export const PLAN_RANK: Record<Plan, number> = {
  trial: 0,
  basic: 1,
  pro: 2,
  enterprise: 3,
};
