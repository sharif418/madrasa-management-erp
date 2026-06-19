"use client";
// Shared dashboard primitives used by role-aware dashboards (Teacher/Parent).
// Keeps each dashboard file under the 300-line limit by extracting common UI.
import { useMemo, type LucideIcon } from "react";
import { CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Hijri (Islamic) date formatter — used in hero banners. */
export function HijriDate({ locale, className }: { locale: string; className?: string }) {
  const text = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(`${locale}-u-ca-islamic`, {
        day: "numeric", month: "long", year: "numeric",
      }).format(new Date());
    } catch {
      return new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(new Date());
    }
  }, [locale]);
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm text-white/80 ${className ?? ""}`}>
      <CalendarDays className="size-4" />
      {text}
    </span>
  );
}

/** Decorative 8-point Islamic star tessellation overlay — used inside hero banners. */
export function IslamicStarPattern() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><g fill='none' stroke='white' stroke-width='1.2'><polygon points='30,4 36,18 50,18 39,28 44,42 30,34 16,42 21,28 10,18 24,18'/><polygon points='30,18 36,24 30,30 24,24'/></g></svg>\")",
          backgroundSize: "60px 60px",
          backgroundRepeat: "repeat",
        }}
      />
      <svg
        className="pointer-events-none absolute -end-6 -bottom-6 size-32 text-white/10"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M16.5 3.5A9.5 9.5 0 1 0 20.5 17 7.5 7.5 0 0 1 16.5 3.5z" />
      </svg>
    </>
  );
}

/** Gradient KPI stat card — matches the admin dashboard visual language. */
export function GradientStatCard({
  label, value, sub, icon: Icon, gradient,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  gradient: string;
}) {
  return (
    <Card className="group relative h-full overflow-hidden border-0 p-5 shadow-md shadow-black/5 transition-shadow hover:shadow-lg hover:-translate-y-0.5 transition-transform">
      <div className={`absolute inset-0 ${gradient}`} aria-hidden="true" />
      <div
        className="pointer-events-none absolute -end-8 -top-8 size-24 rounded-full bg-white/10 transition-transform group-hover:scale-125"
        aria-hidden="true"
      />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white/80">{label}</p>
            <p className="mt-1 text-3xl font-bold text-white tabular-nums">{value}</p>
          </div>
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30 transition-transform group-hover:scale-105">
            <Icon className="size-6 text-white" />
          </div>
        </div>
        {sub ? <p className="mt-auto pt-3 text-xs text-white/70">{sub}</p> : null}
      </div>
    </Card>
  );
}

/** Section card with a title row + icon + content area. */
export function SectionCard({
  title, icon: Icon, iconTint, action, children,
}: {
  title: string;
  icon: LucideIcon;
  iconTint: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-3">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${iconTint}`}>
            <Icon className="size-4" />
          </span>
          {title}
        </h3>
        {action}
      </div>
      <div className="px-6 pb-6">{children}</div>
    </Card>
  );
}

/** Empty-state placeholder. */
export function EmptyState({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {desc ? <p className="max-w-xs text-xs text-muted-foreground">{desc}</p> : null}
    </div>
  );
}

/** Loading skeleton grid (4 cards) + section placeholders. */
export function DashboardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      <Skeleton className="h-36 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
      </div>
    </div>
  );
}

/** Star rating row (1–5). */
export function StarRow({ value, max = 5 }: { value: number | null; max?: number }) {
  if (value == null) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value}/${max} stars`}>
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          className={`size-3 ${i < value ? "fill-amber-500 text-amber-500" : "fill-muted text-muted"}`}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
        </svg>
      ))}
    </span>
  );
}
