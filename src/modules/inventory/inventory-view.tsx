// Inventory & Assets view
"use client";
import { useCallback, useEffect, useState } from "react";
import { Package, Plus, Boxes, Wrench, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/store/app-store";
import { toast } from "sonner";
import { ModuleHeader, KpiCard, EmptyState } from "@/components/ui-patterns";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AssetForm, ItemForm } from "./forms";
import type { InventoryData, Asset, InventoryItem } from "./types";
import { CONDITION_TINT, ASSET_STATUS_TINT } from "./types";

export function InventoryView() {
  const { t, dir } = useApp();
  const [data, setData] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [assetForm, setAssetForm] = useState(false);
  const [itemForm, setItemForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/inventory", { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) setData(j.data as InventoryData);
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
        icon={<Package className="relative size-6 drop-shadow-sm" />}
        title={t("inventory.title")}
        subtitle={t("inventory.subtitle")}
        gradient="from-slate-500 to-slate-700"
        shadow="shadow-slate-600/20"
      >
        <Button
          onClick={() => setItemForm(true)}
          variant="outline"
          className="border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
        >
          <Plus className="me-2 size-4" /> {t("inventory.addItem")}
        </Button>
        <Button
          onClick={() => setAssetForm(true)}
          className="bg-gradient-to-r from-slate-600 to-slate-800 text-white shadow-md"
        >
          <Plus className="me-2 size-4" /> {t("inventory.addAsset")}
        </Button>
      </ModuleHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label={t("inventory.kpi.assetValue")}
          value={(kpis?.assetValue ?? 0).toLocaleString()}
          icon={<Boxes className="size-5" />}
          gradient="from-slate-500 to-slate-700"
        />
        <KpiCard
          label={t("inventory.kpi.lowStock")}
          value={kpis?.lowStock ?? 0}
          icon={<AlertTriangle className="size-5" />}
          gradient="from-amber-500 to-orange-600"
        />
        <KpiCard
          label={t("inventory.kpi.assets")}
          value={kpis?.assetCount ?? 0}
          icon={<Wrench className="size-5" />}
          gradient="from-teal-500 to-emerald-600"
        />
      </div>

      <Tabs defaultValue="assets">
        <TabsList>
          <TabsTrigger value="assets">{t("inventory.assets")}</TabsTrigger>
          <TabsTrigger value="items">{t("inventory.items")}</TabsTrigger>
        </TabsList>

        <TabsContent value="assets">
          {loading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : !data || data.assets.length === 0 ? (
            <EmptyState icon={<Package className="relative size-6" />} title={t("inventory.empty")} description={t("inventory.emptyDesc")} gradient="from-slate-500 to-slate-700" />
          ) : (
            <AssetsTable assets={data.assets} onChanged={load} />
          )}
        </TabsContent>

        <TabsContent value="items">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
          ) : !data || data.items.length === 0 ? (
            <EmptyState icon={<Package className="relative size-6" />} title={t("inventory.empty")} description={t("inventory.emptyDesc")} gradient="from-slate-500 to-slate-700" />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((i) => <ItemCard key={i.id} item={i} onChanged={load} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AssetForm open={assetForm} onOpenChange={setAssetForm} onSaved={load} />
      <ItemForm open={itemForm} onOpenChange={setItemForm} onSaved={load} />
    </div>
  );
}

function AssetsTable({ assets, onChanged }: { assets: Asset[]; onChanged: () => void }) {
  const { t } = useApp();
  const remove = async (id: string) => {
    if (!confirm("Delete this asset?")) return;
    try {
      const r = await fetch(`/api/inventory/${id}?kind=asset`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || "Failed");
      toast.success("Asset deleted");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="rounded-xl border bg-card">
      <div className="max-h-[28rem] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="text-end">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((a) => (
              <TableRow key={a.id} className="hover:bg-muted/40">
                <TableCell>
                  <div className="font-medium">{a.name}</div>
                  {a.location && <div className="text-xs text-muted-foreground">{a.location}</div>}
                </TableCell>
                <TableCell className="capitalize">{a.category}</TableCell>
                <TableCell className="text-xs text-muted-foreground" dir="ltr">{a.serialNumber || "—"}</TableCell>
                <TableCell><Badge className={CONDITION_TINT[a.condition] || CONDITION_TINT.good} variant="secondary" style={{ textTransform: "capitalize" }}>{a.condition}</Badge></TableCell>
                <TableCell><Badge className={ASSET_STATUS_TINT[a.status] || ASSET_STATUS_TINT.in_use} variant="secondary">{a.status.replace("_", " ")}</Badge></TableCell>
                <TableCell className="font-medium">{a.currentValue.toLocaleString()}</TableCell>
                <TableCell className="text-end">
                  <Button size="icon" variant="ghost" className="size-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40" onClick={() => remove(a.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ItemCard({ item, onChanged }: { item: InventoryItem; onChanged: () => void }) {
  const { t } = useApp();
  const low = item.quantity <= item.minStock;
  const pct = item.minStock > 0 ? Math.min(100, Math.round((item.quantity / (item.minStock * 2)) * 100)) : 100;

  const remove = async () => {
    if (!confirm(`Delete ${item.name}?`)) return;
    try {
      const r = await fetch(`/api/inventory/${item.id}?kind=item`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || "Failed");
      toast.success("Item deleted");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className={`h-1.5 ${low ? "bg-rose-500" : "bg-gradient-to-r from-slate-500 to-slate-700"}`} />
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold tracking-tight">{item.name}</p>
            <p className="text-xs capitalize text-muted-foreground">{item.category} · {item.unit}</p>
          </div>
          {low ? (
            <Badge variant="secondary" className="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertTriangle className="me-1 size-3" /> {t("inventory.lowStock")}
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {t("inventory.inStock")}
            </Badge>
          )}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Stock level</span>
            <span className={`font-semibold ${low ? "text-rose-600" : "text-foreground"}`}>
              {item.quantity} / min {item.minStock}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${low ? "bg-rose-500" : "bg-gradient-to-r from-slate-500 to-slate-700"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-2 text-xs">
          <span className="text-muted-foreground">Cost: <span className="font-medium text-foreground">{item.unitCost.toLocaleString()}/{item.unit}</span></span>
          <button
            onClick={remove}
            className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
            aria-label="Delete"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
