"use client";
// Shared UI patterns used by new modules — gradient header tiles + KPI cards
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Islamic 8-point star SVG tessellation pattern (overlay on gradient tiles)
const ISLAMIC_PATTERN: React.CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='white' stroke-width='1'><polygon points='20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14'/></g></svg>\")",
  backgroundSize: "40px 40px",
  backgroundRepeat: "repeat",
};

// Reusable gradient header tile + module title block
export function ModuleHeader({
  icon, title, subtitle, gradient, shadow, children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  gradient: string; // e.g. "from-emerald-500 to-teal-600"
  shadow: string;   // e.g. "shadow-emerald-600/20"
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br text-white shadow-lg ring-1 ring-white/30",
            gradient, shadow
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.15]"
            aria-hidden="true"
            style={ISLAMIC_PATTERN}
          />
          {icon}
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

// KPI stat card with gradient icon tile
export function KpiCard({
  label, value, icon, gradient, hint,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  gradient: string; // e.g. "from-emerald-500 to-teal-600"
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground/80">{hint}</p> : null}
        </div>
        <div
          className={cn(
            "grid size-10 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md",
            gradient
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// Empty state — gradient icon tile + title + subtitle
export function EmptyState({
  icon, title, description, gradient = "from-emerald-500 to-teal-600",
}: {
  icon: ReactNode;
  title: string;
  description: string;
  gradient?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 p-10 text-center">
      <div
        className={cn(
          "relative grid size-14 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br text-white shadow-lg ring-1 ring-white/30",
          gradient
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          aria-hidden="true"
          style={ISLAMIC_PATTERN}
        />
        {icon}
      </div>
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
