"use client";
// Routes tab — cards with stops + monthly fee
import { Route as RouteIcon, MapPin, BadgeDollarSign, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/store/app-store";
import { EmptyState } from "@/components/ui-patterns";
import type { Route } from "./types";

export function RoutesTab({
  routes, loading, onAdd,
}: {
  routes: Route[];
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

  if (routes.length === 0) {
    return (
      <EmptyState
        icon={<RouteIcon className="relative size-6" />}
        title={t("transport.empty")}
        description={t("transport.emptyDesc")}
        gradient="from-teal-500 to-emerald-600"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {routes.map((r) => (
        <Card
          key={r.id}
          className="overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="h-1.5 bg-gradient-to-r from-teal-500 to-emerald-600" />
          <CardContent className="space-y-3 p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate font-semibold tracking-tight">{r.name}</p>
              <div className="grid size-10 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md">
                <RouteIcon className="size-5" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <MapPin className="size-4 text-emerald-600" />
              <span className="truncate">
                <span className="font-medium">{r.startPoint}</span>
                <span className="mx-1 text-muted-foreground">→</span>
                <span className="font-medium">{r.endPoint}</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-muted/60 p-2">
                <p className="text-muted-foreground">km</p>
                <p className="font-semibold">{r.distanceKm}</p>
              </div>
              <div className="rounded-lg bg-muted/60 p-2">
                <p className="text-muted-foreground">{t("transport.stops")}</p>
                <p className="font-semibold">{r.stops.length}</p>
              </div>
              <div className="rounded-lg bg-muted/60 p-2">
                <p className="text-muted-foreground"><Users className="inline size-3" /></p>
                <p className="font-semibold">{r.allocatedCount}</p>
              </div>
            </div>

            {r.stops.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {r.stops.slice(0, 4).map((s, i) => (
                  <Badge key={i} variant="outline" className="text-xs font-normal">
                    {s}
                  </Badge>
                ))}
                {r.stops.length > 4 && (
                  <Badge variant="outline" className="text-xs font-normal">
                    +{r.stops.length - 4}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-xs text-muted-foreground">{t("transport.monthlyFee")}</span>
              <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                <BadgeDollarSign className="size-4" />
                {r.monthlyFee.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
