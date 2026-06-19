// Shared types & color tokens for the Audit Log module UI
export type AuditAction = "create" | "update" | "delete" | "login" | "logout";

export type AuditEntry = {
  id: string;
  actorId: string | null;
  actorName: string | null;
  actorPhone: string | null;
  action: AuditAction;
  module: string;
  entityId: string | null;
  entityName: string | null;
  details: string | null; // JSON string
  ip: string | null;
  createdAt: string;
};

export type AuditListResponse = {
  items: AuditEntry[];
  total: number;
  page: number;
  limit: number;
  modules: string[];
};

export type AuditFilters = {
  action: string; // "" = all
  module: string; // "" = all
  actorId: string; // "" = all
  from: string; // ISO date
  to: string; // ISO date
};

export const AUDIT_ACTIONS: AuditAction[] = [
  "create", "update", "delete", "login", "logout",
];

// Per-action color tokens (no indigo/blue)
export const auditActionColors: Record<
  AuditAction,
  { badge: string; dot: string; ring: string; icon: string; line: string }
> = {
  create: {
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
    ring: "ring-emerald-200 dark:ring-emerald-800",
    icon: "text-emerald-600 dark:text-emerald-400",
    line: "bg-emerald-300 dark:bg-emerald-700",
  },
  update: {
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800",
    dot: "bg-sky-500",
    ring: "ring-sky-200 dark:ring-sky-800",
    icon: "text-sky-600 dark:text-sky-400",
    line: "bg-sky-300 dark:bg-sky-700",
  },
  delete: {
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    dot: "bg-rose-500",
    ring: "ring-rose-200 dark:ring-rose-800",
    icon: "text-rose-600 dark:text-rose-400",
    line: "bg-rose-300 dark:bg-rose-700",
  },
  login: {
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
    ring: "ring-amber-200 dark:ring-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
    line: "bg-amber-300 dark:bg-amber-700",
  },
  logout: {
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-500",
    ring: "ring-slate-200 dark:ring-slate-700",
    icon: "text-slate-600 dark:text-slate-400",
    line: "bg-slate-300 dark:bg-slate-700",
  },
};
