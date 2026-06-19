"use client";
// DonationsTab — table of all donations + Record Donation button.
import * as React from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HandCoins, Heart, Plus } from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FUND_TINT, DONOR_FUNDS, countryFlag, type Donation, type Donor } from "./types";
import { DonationForm } from "./donation-form";

const STATUS_TINT: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  failed: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
};

export function DonationsTab({ donors }: { donors: Donor[] }) {
  const { t, locale, dir } = useApp();
  const { toast } = useToast();
  const [items, setItems] = React.useState<Donation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [fund, setFund] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (fund) params.set("fund", fund);
      const r = await fetch(`/api/donations?${params.toString()}`, { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) setItems(j.data.items as Donation[]);
    } finally {
      setLoading(false);
    }
  }, [fund]);

  React.useEffect(() => { load(); }, [load]);

  const cur = (n: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US", {
      maximumFractionDigits: 0,
    }).format(n || 0);
  const fmtDate = (s: string) =>
    new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(new Date(s));

  const total = items.reduce((s, x) => s + (x.status === "confirmed" ? x.amount : 0), 0);

  return (
    <div className="space-y-4" dir={dir()}>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFund("")}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition",
              !fund ? "border-rose-500 bg-rose-500 text-white" : "border-border bg-muted/50 hover:bg-muted"
            )}
          >
            {t("donors.allFunds")}
          </button>
          {DONOR_FUNDS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFund(f)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium capitalize transition",
                fund === f ? "border-rose-500 bg-rose-500 text-white" : "border-border bg-muted/50 hover:bg-muted"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {!loading && items.length > 0 && (
            <Badge variant="outline" className="px-2.5 py-1 text-xs">
              <Heart className="size-3 me-1 text-rose-500" />
              ৳{cur(total)} {t("donors.totalRaised")}
            </Badge>
          )}
          <Button
            onClick={() => setFormOpen(true)}
            className="bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md hover:from-rose-600 hover:to-pink-700"
          >
            <Plus className="size-4" /> {t("donors.recordDonation")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/40 p-12 text-center">
          <HandCoins className="mx-auto mb-3 size-12 opacity-30" />
          <p className="text-sm text-muted-foreground">{t("donors.emptyDonations")}</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <ScrollArea className="max-h-[calc(100vh-16rem)]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="ps-4">{t("donors.date")}</TableHead>
                  <TableHead>{t("donors.donors")}</TableHead>
                  <TableHead className="text-end">{t("donors.amount")}</TableHead>
                  <TableHead>{t("donors.fund")}</TableHead>
                  <TableHead>{t("donors.method")}</TableHead>
                  <TableHead>{t("donors.status")}</TableHead>
                  <TableHead className="pe-4">{t("donors.reference")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((d) => (
                  <TableRow key={d.id} className="hover:bg-muted/30">
                    <TableCell className="ps-4 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(d.date)}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1.5">
                        {d.donor?.country && <span title={d.donor.country}>{countryFlag(d.donor.country)}</span>}
                        <span className="truncate max-w-[150px]">{d.donorName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-end font-bold tabular-nums text-rose-700 dark:text-rose-300">৳{cur(d.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize", FUND_TINT[d.fund] || FUND_TINT.general)}>{d.fund}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground capitalize">{d.paymentMethod || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize", STATUS_TINT[d.status] || STATUS_TINT.pending)}>
                        {d.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="pe-4 text-xs text-muted-foreground truncate max-w-[120px]" dir="ltr">{d.reference || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}

      <DonationForm open={formOpen} onOpenChange={setFormOpen} donors={donors} onSaved={load} />
    </div>
  );
}
