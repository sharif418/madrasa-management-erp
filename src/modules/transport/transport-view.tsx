"use client";
// Transport & Vehicle Routing view
import { useCallback, useEffect, useState } from "react";
import { Bus, Plus, Route as RouteIcon, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from "@/store/app-store";
import { toast } from "sonner";
import { ModuleHeader, KpiCard } from "@/components/ui-patterns";
import { VehiclesTab } from "./vehicles-tab";
import { RoutesTab } from "./routes-tab";
import { AllocationsTab } from "./allocations-tab";
import { VehicleForm, RouteForm, AllocationForm } from "./forms";
import type { TransportData } from "./types";

export function TransportView() {
  const { t, dir } = useApp();
  const [data, setData] = useState<TransportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [vehicleForm, setVehicleForm] = useState(false);
  const [routeForm, setRouteForm] = useState(false);
  const [allocForm, setAllocForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/transport", { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) setData(j.data as TransportData);
      else throw new Error(j?.error || "Failed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const kpis = data?.kpis;

  return (
    <div className="space-y-6" dir={dir()}>
      <ModuleHeader
        icon={<Bus className="relative size-6 drop-shadow-sm" />}
        title={t("transport.title")}
        subtitle={t("transport.subtitle")}
        gradient="from-cyan-500 to-blue-600"
        shadow="shadow-cyan-600/20"
      >
        <Button
          onClick={() => setVehicleForm(true)}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20 hover:from-cyan-700 hover:to-blue-700"
        >
          <Plus className="me-2 size-4" /> {t("transport.addVehicle")}
        </Button>
      </ModuleHeader>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label={t("transport.kpi.vehicles")}
          value={kpis?.activeVehicles ?? 0}
          icon={<Bus className="size-5" />}
          gradient="from-cyan-500 to-blue-600"
        />
        <KpiCard
          label={t("transport.kpi.routes")}
          value={kpis?.totalRoutes ?? 0}
          icon={<RouteIcon className="size-5" />}
          gradient="from-teal-500 to-emerald-600"
        />
        <KpiCard
          label={t("transport.kpi.allocations")}
          value={kpis?.allocatedStudents ?? 0}
          icon={<UserPlus className="size-5" />}
          gradient="from-emerald-500 to-teal-600"
        />
      </div>

      <Tabs defaultValue="vehicles">
        <TabsList>
          <TabsTrigger value="vehicles">{t("transport.vehicles")}</TabsTrigger>
          <TabsTrigger value="routes">{t("transport.routes")}</TabsTrigger>
          <TabsTrigger value="allocations">{t("transport.allocations")}</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles">
          <VehiclesTab
            vehicles={data?.vehicles ?? []}
            loading={loading}
            onAdd={() => setVehicleForm(true)}
          />
        </TabsContent>
        <TabsContent value="routes">
          <RoutesTab
            routes={data?.routes ?? []}
            loading={loading}
            onAdd={() => setRouteForm(true)}
          />
        </TabsContent>
        <TabsContent value="allocations">
          <AllocationsTab
            allocations={data?.allocations ?? []}
            loading={loading}
            onAdd={() => setAllocForm(true)}
            onChanged={load}
          />
        </TabsContent>
      </Tabs>

      <VehicleForm open={vehicleForm} onOpenChange={setVehicleForm} onSaved={load} />
      <RouteForm open={routeForm} onOpenChange={setRouteForm} onSaved={load} />
      <AllocationForm open={allocForm} onOpenChange={setAllocForm} onSaved={load} />
    </div>
  );
}
