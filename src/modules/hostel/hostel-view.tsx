"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from "@/store/app-store";

import { HostelTreeTab } from "./hostel-tree-tab";
import { MessTab } from "./mess-tab";
import { GatePassTab } from "./gate-pass-tab";
import { VisitorsTab } from "./visitors-tab";
import type { HostelData } from "./types";

export function HostelView() {
  const { t, dir } = useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HostelData | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hostel", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
      setData(json.data as HostelData);
    } catch (err) {
      toast.error(t("hostel.loadFailed"), {
        description: err instanceof Error ? err.message : "",
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6" dir={dir()}>
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/20 ring-1 ring-white/30">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.15]"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='white' stroke-width='1'><polygon points='20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14'/></g></svg>\")",
                backgroundSize: "40px 40px",
                backgroundRepeat: "repeat",
              }}
            />
            <Building2 className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("hostel.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("hostel.subtitle")}</p>
          </div>
        </div>
      </header>

      {loading ? (
        <HostelSkeleton />
      ) : (
        <Tabs defaultValue="hostels" dir={dir()} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-2xl">
            <TabsTrigger value="hostels">{t("hostel.hostelsTab")}</TabsTrigger>
            <TabsTrigger value="mess">{t("hostel.mess")}</TabsTrigger>
            <TabsTrigger value="gate-pass">{t("hostel.gatePass")}</TabsTrigger>
            <TabsTrigger value="visitors">{t("hostel.visitors")}</TabsTrigger>
          </TabsList>
          <TabsContent value="hostels" className="mt-4">
            <HostelTreeTab data={data} onChanged={load} />
          </TabsContent>
          <TabsContent value="mess" className="mt-4">
            <MessTab data={data} onChanged={load} />
          </TabsContent>
          <TabsContent value="gate-pass" className="mt-4">
            <GatePassTab data={data} onChanged={load} />
          </TabsContent>
          <TabsContent value="visitors" className="mt-4">
            <VisitorsTab data={data} onChanged={load} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function HostelSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-2xl" />
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <div className="sr-only" aria-live="polite">
        <Loader2 className="size-4 animate-spin" />
        Loading hostel...
      </div>
    </div>
  );
}
