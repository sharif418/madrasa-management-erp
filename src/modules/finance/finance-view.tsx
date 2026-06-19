"use client";
// Finance module — main view with Funds / Transactions tabs.
// Renders inside the ERP shell. All data is fetched client-side.
import { useEffect, useState } from "react";
import { useApp } from "@/store/app-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight } from "lucide-react";
import { FinanceFunds } from "./finance-funds";
import { FinanceTransactions } from "./finance-transactions";
import type { Overview } from "./finance-types";

export function FinanceView() {
  const { t, dir, locale } = useApp();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  // Reload overview whenever a child signals a change via `reload()`.
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch("/api/finance", { credentials: "include" });
        const j = await r.json();
        if (alive && j?.ok) setOverview(j.data as Overview);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [tick]);

  const reload = () => setTick((n) => n + 1);

  const cur = (n: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US", {
      maximumFractionDigits: 0,
    }).format(n || 0);

  const stats = overview
    ? [
        {
          label: t("finance.totalBalance"),
          value: cur(overview.totalBalance),
          icon: Wallet,
          tone: "from-emerald-600 to-emerald-800",
        },
        {
          label: t("finance.incomeTotal"),
          value: cur(overview.last30d.income),
          icon: ArrowUpCircle,
          tone: "from-teal-600 to-emerald-700",
        },
        {
          label: t("finance.expenseTotal"),
          value: cur(overview.last30d.expense),
          icon: ArrowDownCircle,
          tone: "from-rose-500 to-rose-700",
        },
        {
          label: t("finance.transferTotal"),
          value: cur(overview.last30d.transfer),
          icon: ArrowLeftRight,
          tone: "from-violet-500 to-violet-700",
        },
      ]
    : [];

  return (
    <div dir={dir()} className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("finance.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("finance.tamlik.desc")}
          </p>
        </div>
      </div>

      {/* Stat strip — consistent heights + hover lift */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))
          : stats.map((s) => (
              <Card
                key={s.label}
                className={`group relative h-full overflow-hidden border-0 text-white bg-gradient-to-br ${s.tone} shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
              >
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wider opacity-90">
                        {s.label}
                      </p>
                      <p className="text-xl md:text-2xl font-bold mt-1 tabular-nums truncate">
                        ৳{s.value}
                      </p>
                    </div>
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur-sm transition-transform group-hover:scale-105">
                      <s.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
                <div className="pointer-events-none absolute -bottom-6 -end-6 h-24 w-24 rounded-full bg-white/10 transition-transform group-hover:scale-125" />
              </Card>
            ))}
      </div>

      <Tabs defaultValue="funds" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="funds">{t("finance.funds")}</TabsTrigger>
          <TabsTrigger value="transactions">
            {t("finance.transactions")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="funds" className="mt-4">
          <FinanceFunds
            overview={overview}
            loading={loading}
            reload={reload}
          />
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <FinanceTransactions reload={reload} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
