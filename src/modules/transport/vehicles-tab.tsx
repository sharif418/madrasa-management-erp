"use client";
// Vehicles tab — cards with occupancy bar
import { Bus, User, Phone, Route as RouteIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/store/app-store";
import { EmptyState } from "@/components/ui-patterns";
import type { Vehicle } from "./types";

const TYPE_TINT: Record<string, string> = {
  bus: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
  minibus: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
  microbus: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  van: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
};

export function VehiclesTab({
  vehicles, loading, onAdd,
}: {
  vehicles: Vehicle[];
  loading: boolean;
  onAdd: () => void;
}) {
  const { t } = useApp();

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <EmptyState
        icon={<Bus className="relative size-6" />}
        title={t("transport.empty")}
        description={t("transport.emptyDesc")}
        gradient="from-cyan-500 to-blue-600"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((v) => {
        const pct = v.capacity > 0 ? Math.min(100, Math.round((v.occupancy / v.capacity) * 100)) : 0;
        const full = pct >= 100;
        return (
          <Card
            key={v.id}
            className="overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="h-1.5 bg-gradient-to-r from-cyan-500 to-blue-600" />
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold tracking-tight">{v.registration}</p>
                  <Badge className={`mt-1 ${TYPE_TINT[v.type] || TYPE_TINT.bus}`} variant="secondary">
                    {v.type}
                  </Badge>
                </div>
                <div className="grid size-10 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md">
                  <Bus className="size-5" />
                </div>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  <span className="truncate">{v.driverName}</span>
                </div>
                {v.driverPhone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="size-4" />
                    <span dir="ltr">{v.driverPhone}</span>
                  </div>
                )}
                {v.routeName && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RouteIcon className="size-4" />
                    <span className="truncate">{v.routeName}</span>
                  </div>
                )}
              </div>

              {/* Occupancy */}
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t("transport.occupancy")}</span>
                  <span className={full ? "font-semibold text-rose-600" : "font-medium"}>
                    {v.occupancy} / {v.capacity}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${full ? "bg-rose-500" : "bg-gradient-to-r from-cyan-500 to-blue-600"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
