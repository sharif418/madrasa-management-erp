"use client";
// Wallet View — gradient total-balance card, search, paginated table, dialogs.
import { useEffect, useState, useCallback } from "react";
import { useApp } from "@/store/app-store";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet as WalletIcon, Search, ChevronLeft, ChevronRight, Users, TrendingUp } from "lucide-react";
import { WalletTable } from "./wallet-table";
import { WalletDetailsDialog } from "./wallet-details-dialog";
import { WalletTopUpDialog } from "./wallet-topup-dialog";
import type { WalletListItem, WalletListResponse, WalletStudent } from "./wallet-types";

export function WalletView() {
  const { t, dir, locale } = useApp();
  const [data, setData] = useState<WalletListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [details, setDetails] = useState<WalletStudent | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [topUpTarget, setTopUpTarget] = useState<WalletListItem | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search.trim()) qs.set("search", search.trim());
      const res = await fetch(`/api/wallet?${qs.toString()}`, { credentials: "include" });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error);
      setData(j.data as WalletListResponse);
    } catch {
      toast.error(t("wallet.loadError"));
    } finally {
      setLoading(false);
    }
  }, [page, search, t]);

  useEffect(() => {
    const id = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(id);
  }, [load, search]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  const cur = (n: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US", {
      maximumFractionDigits: 0,
    }).format(n || 0);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / limit)) : 1;

  const handleView = (w: WalletListItem) => {
    setDetails({ id: w.student.id, name: w.student.name, nameArabic: w.student.nameArabic, rollNo: w.student.rollNo, isActive: w.student.isActive });
    setDetailsOpen(true);
  };
  const handleTopUp = (w: WalletListItem) => {
    setTopUpTarget(w);
    setTopUpOpen(true);
  };

  return (
    <div dir={dir()} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
          <WalletIcon className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("wallet.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("wallet.subtitle")}</p>
        </div>
      </div>

      {/* Hero total-balance card */}
      <Card className="border-0 bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 text-white overflow-hidden relative">
        <CardContent className="p-5 md:p-7 relative z-10">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 opacity-90">
                <WalletIcon className="h-4 w-4" />
                <span className="text-sm uppercase tracking-wider">{t("wallet.totalBalance")}</span>
              </div>
              <p className="text-3xl md:text-4xl font-bold mt-2 tabular-nums">৳ {cur(data?.totalBalance ?? 0)}</p>
              <p className="text-xs md:text-sm opacity-80 mt-2">{t("wallet.totalBalanceDesc")}</p>
            </div>
            <div className="flex gap-3">
              <Stat icon={Users} label={t("wallet.activeWallets")} value={data?.activeWallets ?? 0} />
              <Stat icon={TrendingUp} label={t("wallet.transactions", { count: data?.total ?? 0 })} value={data?.total ?? 0} hide />
            </div>
          </div>
        </CardContent>
        <div className="pointer-events-none absolute -top-10 -end-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 -start-12 h-44 w-44 rounded-full bg-amber-400/10" />
      </Card>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("wallet.search")}
          className="ps-9"
        />
      </div>

      {/* Table */}
      <WalletTable
        items={data?.items ?? []}
        loading={loading}
        onView={handleView}
        onTopUp={handleTopUp}
      />

      {/* Pagination */}
      {(data?.total ?? 0) > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">
            {t("wallet.pageOf", { page, total: totalPages })}
            {data ? ` · ${t("wallet.transactions", { count: data.total })}` : ""}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
              {t("common.previous")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {t("common.next")}
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      )}

      {/* Loading overlay for total-balance card before first load */}
      {loading && !data && (
        <div className="sr-only">
          <Skeleton className="h-1 w-1" />
        </div>
      )}

      {/* Dialogs */}
      <WalletDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        student={details}
      />
      <WalletTopUpDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        student={topUpTarget ? { id: topUpTarget.student.id, name: topUpTarget.student.name, nameArabic: topUpTarget.student.nameArabic, rollNo: topUpTarget.student.rollNo, isActive: topUpTarget.student.isActive } : null}
        currentBalance={topUpTarget?.balance ?? 0}
        onToppedUp={load}
      />
    </div>
  );
}

function Stat({
  icon: Icon, label, value, hide,
}: { icon: typeof Users; label: string; value: number; hide?: boolean }) {
  if (hide) return null;
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3 min-w-[120px]">
      <div className="flex items-center gap-2 opacity-90">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold tabular-nums mt-1">{value}</p>
    </div>
  );
}
