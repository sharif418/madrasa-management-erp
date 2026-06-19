"use client";
// DonorsView — main shell with rose→pink gradient header + 3 tabs (Donors / Donations / Analytics).
import * as React from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, HandCoins, BarChart3, Globe, RefreshCw } from "lucide-react";
import { useApp } from "@/store/app-store";
import { DonorsListTab } from "./donors-list-tab";
import { DonationsTab } from "./donations-tab";
import { DonorsAnalyticsTab } from "./donors-analytics-tab";
import type { Donor, Donation, DonorKpis } from "./types";

export function DonorsView() {
  const { t, locale, dir } = useApp();
  const [kpis, setKpis] = React.useState<DonorKpis | null>(null);
  const [donors, setDonors] = React.useState<Donor[]>([]);
  const [donations, setDonations] = React.useState<Donation[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/donors?limit=200", { cache: "no-store" }),
        fetch("/api/donations?limit=200", { cache: "no-store" }),
      ]);
      const [j1, j2] = await Promise.all([r1.json(), r2.json()]);
      if (j1?.ok) {
        setKpis(j1.data.kpis as DonorKpis);
        setDonors(j1.data.items as Donor[]);
      }
      if (j2?.ok) setDonations(j2.data.items as Donation[]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const cur = (n: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US", {
      maximumFractionDigits: 0,
    }).format(n || 0);

  const heroStats = kpis
    ? [
        { label: t("donors.totalRaised"), value: `৳${cur(kpis.totalRaised)}`, icon: Heart, tone: "from-rose-500 to-pink-600" },
        { label: t("donors.countries"), value: cur(kpis.countriesCount), icon: Globe, tone: "from-teal-500 to-emerald-600" },
        { label: t("donors.recurring"), value: cur(kpis.recurringCount), icon: RefreshCw, tone: "from-amber-500 to-orange-600" },
        { label: t("donors.avgDonation"), value: `৳${cur(kpis.avgDonation)}`, icon: BarChart3, tone: "from-violet-500 to-fuchsia-600" },
      ]
    : [];

  return (
    <div className="space-y-6" dir={dir()}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/20 ring-1 ring-white/30">
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
            <Heart className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("donors.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("donors.subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Hero banner */}
      {!loading && kpis && (
        <Card className="border-0 text-white bg-gradient-to-br from-rose-600 via-pink-600 to-fuchsia-700 shadow-lg overflow-hidden">
          <CardContent className="p-5">
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
            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4">
              {heroStats.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur-sm">
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider opacity-90 truncate">{s.label}</p>
                      <p className="text-lg font-bold tabular-nums truncate">{s.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="donors" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="donors" className="gap-1.5">
            <Users className="size-3.5" /> {t("donors.donors")}
          </TabsTrigger>
          <TabsTrigger value="donations" className="gap-1.5">
            <HandCoins className="size-3.5" /> {t("donors.donations")}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="size-3.5" /> {t("donors.analytics")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="donors" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <DonorsListTab kpis={kpis} />
          </motion.div>
        </TabsContent>

        <TabsContent value="donations" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <DonationsTab donors={donors} />
          </motion.div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <DonorsAnalyticsTab donations={donations} donors={donors} loading={loading} />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
