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
            <WalletIcon className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("wallet.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("wallet.subtitle")}</p>
          </div>
        </div>
      </header>

      {/* Hero total-balance card with Islamic 8-point star tessellation */}
      <Card className="border-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white overflow-hidden relative shadow-lg shadow-emerald-700/20">
        {/* Islamic 8-point star pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.1]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'><g fill='none' stroke='white' stroke-width='1.1'><polygon points='25,4 31,16 44,16 33,26 38,40 25,32 12,40 17,26 6,16 19,16'/><polygon points='25,16 30,21 25,26 20,21'/></g></svg>\")",
            backgroundSize: "50px 50px",
            backgroundRepeat: "repeat",
          }}
        />
        {/* Decorative Wallet icon in the corner */}
        <div className="pointer-events-none absolute -end-6 -top-6 opacity-15" aria-hidden="true">
          <WalletIcon className="size-44" strokeWidth={1} />
        </div>
        <CardContent className="p-5 md:p-7 relative z-10">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 opacity-90">
                <WalletIcon className="h-4 w-4" />
                <span className="text-sm uppercase tracking-wider">{t("wallet.totalBalance")}</span>
              </div>
              <p className="text-3xl md:text-4xl font-bold mt-2 tabular-nums drop-shadow-sm">
                <span className="me-1 text-2xl md:text-3xl align-top">৳</span>
                {cur(data?.totalBalance ?? 0)}
              </p>
              <p className="text-xs md:text-sm opacity-80 mt-2">{t("wallet.totalBalanceDesc")}</p>
            </div>
            <div className="flex gap-3">
              <Stat icon={Users} label={t("wallet.activeWallets")} value={data?.activeWallets ?? 0} />
              <Stat icon={TrendingUp} label={t("wallet.transactions", { count: data?.total ?? 0 })} value={data?.total ?? 0} hide />
            </div>
          </div>
        </CardContent>
        <div className="pointer-events-none absolute -bottom-12 -start-12 h-44 w-44 rounded-full bg-amber-400/15" />
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
