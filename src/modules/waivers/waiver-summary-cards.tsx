// WaiverSummaryCards — 4 gradient stat cards for the waivers list tab.
// Kept as a separate file to keep waivers-list-tab.tsx under the 250-line guideline.
"use client";
import { Gift, TrendingDown, Users, Percent, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Stat = { label: string; value: string; icon: LucideIcon; tone: string };

export function WaiverSummaryCards({
  loading, stats,
}: {
  loading: boolean;
  stats: Stat[];
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <Card
            key={s.label}
            className={`overflow-hidden border-0 text-white bg-gradient-to-br ${s.tone} shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
          >
            <CardContent className="p-4 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider opacity-90 truncate">{s.label}</p>
                <p className="text-lg font-bold mt-1 tabular-nums truncate">{s.value}</p>
              </div>
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur-sm">
                <Icon className="size-4" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Re-export icons for convenience when building stat objects
export { Gift, TrendingDown, Users, Percent };
