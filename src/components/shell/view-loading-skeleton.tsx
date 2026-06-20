"use client";
// Polished per-view loading skeleton shown while a lazily-loaded module chunk
// is being fetched. Mirrors the standard module layout: gradient header band,
// 4 KPI cards, and 3 content blocks (chart/table). Emerald theme + Islamic
// 8-point star pattern keep it on-brand.
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ISLAMIC_PATTERN: React.CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='white' stroke-width='1' opacity='0.25'><polygon points='20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14'/></g></svg>\")",
  backgroundSize: "40px 40px",
  backgroundRepeat: "repeat",
};

export function ViewLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Gradient header band */}
      <div
        style={ISLAMIC_PATTERN}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6"
      >
        <Skeleton className="h-7 w-64 bg-white/25" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full bg-white/20" />
        <div className="mt-5 flex gap-2">
          <Skeleton className="h-9 w-28 bg-white/25" />
          <Skeleton className="h-9 w-28 bg-white/20" />
        </div>
      </div>

      {/* 4 KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/60 p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-32" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>

      {/* 3 content blocks: chart + table area */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border/60 p-5 lg:col-span-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-4 h-64 w-full" />
        </div>
        <div className="rounded-xl border border-border/60 p-5">
          <Skeleton className="h-5 w-32" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Spinner caption */}
      <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
        <span>Loading…</span>
      </div>
    </div>
  );
}

export default ViewLoadingSkeleton;
