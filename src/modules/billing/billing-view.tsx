// BillingView — Subscription & Billing module shell
// Tabs: Overview | Plans | Invoices
"use client";
import { useCallback, useEffect, useState } from "react";
import { CreditCard, LayoutDashboard, Receipt, FileText } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import type { BillingData } from "./types";
import { BillingOverviewTab } from "./billing-overview-tab";
import { BillingPlansTab } from "./billing-plans-tab";
import { BillingInvoicesTab } from "./billing-invoices-tab";

export function BillingView() {
  const { t, dir } = useApp();
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "plans" | "invoices">("overview");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/billing", { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) setData(j.data as BillingData);
      else throw new Error(j?.error || "Failed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6" dir={dir()}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            <CreditCard className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("billing.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("billing.subtitle")}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : !data ? (
        <Card className="border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          ⚠️ Failed to load billing data
        </Card>
      ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="overview">
              <LayoutDashboard className="size-4" /> {t("billing.overview")}
            </TabsTrigger>
            <TabsTrigger value="plans">
              <Receipt className="size-4" /> {t("billing.plans")}
            </TabsTrigger>
            <TabsTrigger value="invoices">
              <FileText className="size-4" /> {t("billing.invoices")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <BillingOverviewTab data={data} onUpgrade={() => setTab("plans")} />
          </TabsContent>
          <TabsContent value="plans" className="mt-4">
            <BillingPlansTab data={data} onUpgraded={load} />
          </TabsContent>
          <TabsContent value="invoices" className="mt-4">
            <BillingInvoicesTab data={data} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
