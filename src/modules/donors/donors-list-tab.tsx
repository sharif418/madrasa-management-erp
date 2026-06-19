"use client";
// DonorsListTab — donor profile cards with flag, type badge, contribution stats.
import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Plus, Medal, Heart, Phone, Mail, MapPin, RefreshCw, Edit3, HandCoins,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import {
  TYPE_META, FUND_TINT, DONOR_TYPES, countryFlag, type Donor, type DonorKpis,
} from "./types";
import { DonorForm } from "./donor-form";
import { DonationForm } from "./donation-form";

export function DonorsListTab({ kpis }: { kpis: DonorKpis | null }) {
  const { t, locale, dir } = useApp();
  const [donors, setDonors] = React.useState<Donor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [type, setType] = React.useState("");
  const [editing, setEditing] = React.useState<Donor | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [donationFor, setDonationFor] = React.useState<string | null>(null);
  const [donationOpen, setDonationOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (search.trim()) params.set("search", search.trim());
      if (type) params.set("type", type);
      const r = await fetch(`/api/donors?${params.toString()}`, { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) setDonors(j.data.items as Donor[]);
    } finally {
      setLoading(false);
    }
  }, [search, type]);

  React.useEffect(() => {
    const id = setTimeout(() => { load(); }, 300);
    return () => clearTimeout(id);
  }, [load]);

  const cur = (n: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US", {
      maximumFractionDigits: 0,
    }).format(n || 0);
  const fmtDate = (s: string | null) => {
    if (!s) return "—";
    return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(new Date(s));
  };

  const onNewDonation = (id?: string | null) => {
    setDonationFor(id ?? null);
    setDonationOpen(true);
  };

  return (
    <div className="space-y-4" dir={dir()}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input className="ps-9" placeholder={t("common.search")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setType("")}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition",
              !type ? "border-rose-500 bg-rose-500 text-white" : "border-border bg-muted/50 hover:bg-muted"
            )}
          >
            {t("donors.allTypes")}
          </button>
          {DONOR_TYPES.map((ty) => (
            <button
              key={ty}
              type="button"
              onClick={() => setType(ty)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium capitalize transition",
                type === ty ? "border-rose-500 bg-rose-500 text-white" : "border-border bg-muted/50 hover:bg-muted"
              )}
            >
              {t(`donors.${ty === "recurring" ? "recurringType" : ty}`)}
            </button>
          ))}
        </div>
        <Button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md hover:from-rose-600 hover:to-pink-700"
        >
          <Plus className="size-4" /> {t("donors.addDonor")}
        </Button>
      </div>

      {/* KPI summary tiles */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiTile label={t("donors.totalRaised")} value={`৳${cur(kpis.totalRaised)}`} icon={Heart} tone="from-rose-500 to-pink-600" />
          <KpiTile label={t("donors.recurring")} value={cur(kpis.recurringCount)} icon={RefreshCw} tone="from-amber-500 to-orange-600" />
          <KpiTile label={t("donors.countries")} value={cur(kpis.countriesCount)} icon={MapPin} tone="from-teal-500 to-emerald-600" />
          <KpiTile label={t("donors.avgDonation")} value={`৳${cur(kpis.avgDonation)}`} icon={HandCoins} tone="from-violet-500 to-fuchsia-600" />
        </div>
      )}

      {/* Donor cards grid */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      ) : donors.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/40 p-12 text-center">
          <Heart className="mx-auto mb-3 size-12 opacity-30" />
          <p className="font-medium">{t("donors.empty")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("donors.emptyDesc")}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {donors.map((d, idx) => {
            const typeMeta = TYPE_META[d.type] || TYPE_META.individual;
            const TypeIcon = typeMeta.icon;
            const isTop = idx === 0 && d.totalContributed > 0;
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.3) }}
              >
                <Card className={cn(
                  "h-full overflow-hidden border-s-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
                  isTop ? "border-s-amber-500" : "border-s-rose-500/70"
                )}>
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white text-base font-bold">
                          {d.name.charAt(0)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <h3 className="line-clamp-1 font-semibold leading-tight">{d.name}</h3>
                            {isTop && <Medal className="size-4 text-amber-500 shrink-0" />}
                          </div>
                          {d.nameArabic && (
                            <p className="line-clamp-1 text-xs text-rose-700 dark:text-rose-300" dir="rtl">{d.nameArabic}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-2xl shrink-0" title={d.country}>{countryFlag(d.country)}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className={cn("capitalize", typeMeta.tint)}>
                        <TypeIcon className="size-3 me-1" />
                        {t(`donors.${typeMeta.label}`)}
                      </Badge>
                      {d.preferredFund && (
                        <Badge variant="outline" className={cn("capitalize", FUND_TINT[d.preferredFund] || FUND_TINT.general)}>
                          {d.preferredFund}
                        </Badge>
                      )}
                      {d.isRecurring && (
                        <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                          <RefreshCw className="size-3 me-1" />
                          {t("donors.recurringType")}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5 text-xs">
                      <div>
                        <p className="text-muted-foreground">{t("donors.totalContributed")}</p>
                        <p className="font-bold tabular-nums text-rose-700 dark:text-rose-300">৳{cur(d.totalContributed)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("donors.contributionCount")}</p>
                        <p className="font-bold tabular-nums">{d.contributionCount}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {d.phone && <span className="inline-flex items-center gap-1" dir="ltr"><Phone className="size-3" />{d.phone}</span>}
                      {d.email && <span className="inline-flex items-center gap-1 truncate" dir="ltr"><Mail className="size-3" />{d.email}</span>}
                      <span className="inline-flex items-center gap-1">
                        {t("donors.lastDonation")}: {fmtDate(d.lastDonation)}
                      </span>
                    </div>

                    <div className="mt-auto flex items-center gap-2 border-t pt-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => { setEditing(d); setFormOpen(true); }}>
                        <Edit3 className="size-3.5" /> {t("common.edit")}
                      </Button>
                      <Button size="sm" className="flex-1 bg-rose-500 hover:bg-rose-600 text-white" onClick={() => onNewDonation(d.id)}>
                        <HandCoins className="size-3.5" /> {t("donors.recordDonation")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <DonorForm open={formOpen} onOpenChange={setFormOpen} editing={editing} onSaved={load} />
      <DonationForm open={donationOpen} onOpenChange={setDonationOpen} donors={donors} onSaved={load} defaultDonorId={donationFor} />
    </div>
  );
}

function KpiTile({ label, value, icon: Icon, tone }: {
  label: string; value: string; icon: typeof Heart; tone: string;
}) {
  return (
    <Card className={cn("border-0 text-white bg-gradient-to-br shadow-sm", tone)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider opacity-90">{label}</p>
            <p className="text-xl font-bold tabular-nums">{value}</p>
          </div>
          <Icon className="size-5 opacity-80" />
        </div>
      </CardContent>
    </Card>
  );
}
