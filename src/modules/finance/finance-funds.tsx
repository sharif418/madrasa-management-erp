"use client";
// Funds tab — total balance, fund cards grid, Add Fund + Tamlik Automation dialogs.
import { useState } from "react";
import { useApp } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Sparkles, Wallet, TrendingUp } from "lucide-react";
import { AddFundDialog } from "./finance-form";
import { TamlikDialog } from "./tamlik-dialog";
import { fundTypeColors, type Fund, type Overview } from "./finance-types";

type Props = {
  overview: Overview | null;
  loading: boolean;
  reload: () => void;
};

export function FinanceFunds({ overview, loading, reload }: Props) {
  const { t, locale, dir } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [tamlikOpen, setTamlikOpen] = useState(false);

  const cur = (n: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US", {
      maximumFractionDigits: 0,
    }).format(n || 0);

  const funds: Fund[] = overview?.funds ?? [];
  const hasZakat = funds.some((f) => f.type === "zakat" && f.balance > 0);

  return (
    <div className="space-y-5">
      {/* Hero total balance card */}
      <Card className="border-0 bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 text-white overflow-hidden relative">
        <CardContent className="p-5 md:p-7 relative z-10">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 opacity-90">
                <Wallet className="h-4 w-4" />
                <span className="text-sm uppercase tracking-wider">
                  {t("finance.totalBalance")}
                </span>
              </div>
              <p className="text-3xl md:text-4xl font-bold mt-2 tabular-nums">
                ৳ {cur(overview?.totalBalance ?? 0)}
              </p>
              <p className="text-xs md:text-sm opacity-80 mt-2">
                {t("finance.fundCount", { count: funds.length })}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => setTamlikOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white border-0"
                disabled={loading}
              >
                <Sparkles className="h-4 w-4" />
                {t("finance.tamlik")}
              </Button>
              <Button
                onClick={() => setAddOpen(true)}
                variant="secondary"
                className="bg-white/15 hover:bg-white/25 text-white border-0 backdrop-blur-sm"
              >
                <Plus className="h-4 w-4" />
                {t("finance.addFund")}
              </Button>
            </div>
          </div>
          {/* Type breakdown bar */}
          <div className="mt-5">
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/15">
              {funds.map((f) => (
                <div
                  key={f.id}
                  className={fundTypeColors[f.type].chip}
                  style={{
                    width: `${
                      overview?.totalBalance
                        ? (f.balance / overview.totalBalance) * 100
                        : 0
                    }%`,
                  }}
                  title={`${f.name}: ৳${cur(f.balance)}`}
                />
              ))}
            </div>
          </div>
        </CardContent>
        <div className="pointer-events-none absolute -top-10 -end-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 -start-12 h-44 w-44 rounded-full bg-amber-400/10" />
      </Card>

      {/* Funds grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : funds.length === 0 ? (
        <EmptyFunds onAdd={() => setAddOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {funds.map((f) => (
            <FundCard key={f.id} fund={f} cur={cur} />
          ))}
        </div>
      )}

      {/* Recent activity mini-list */}
      {overview && overview.recent.length > 0 && (
        <Card className="border border-border/60">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <h3 className="font-semibold">{t("finance.recentTransactions")}</h3>
            </div>
            <ul className="divide-y divide-border/60">
              {overview.recent.slice(0, 6).map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {r.description || r.category || r.fund.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.fund.name} · {new Date(r.date).toLocaleDateString(
                        locale === "ar" ? "ar-EG" : "bn-BD"
                      )}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      r.type === "income"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : r.type === "expense"
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-purple-600 dark:text-purple-400"
                    }`}
                  >
                    {r.type === "income" ? "+" : r.type === "expense" ? "−" : "↔"}
                    ৳{cur(r.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <AddFundDialog open={addOpen} onOpenChange={setAddOpen} onSaved={reload} />
      <TamlikDialog
        open={tamlikOpen}
        onOpenChange={setTamlikOpen}
        onSaved={reload}
        funds={funds}
        hasZakat={hasZakat}
      />
    </div>
  );
}

function FundCard({
  fund,
  cur,
}: {
  fund: Fund;
  cur: (n: number) => string;
}) {
  const { t } = useApp();
  const colors = fundTypeColors[fund.type];
  return (
    <Card className={`group relative overflow-hidden border ring-1 ${colors.ring}`}>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
              <h3 className="font-semibold truncate">{fund.name}</h3>
            </div>
            <Badge
              variant="outline"
              className={`mt-2 ${colors.badge} border`}
            >
              {t(`finance.${fund.type}`)}
            </Badge>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs text-muted-foreground">{t("finance.balance")}</p>
          <p className="text-2xl font-bold tabular-nums">৳ {cur(fund.balance)}</p>
        </div>
        {fund.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {fund.description}
          </p>
        )}
        {typeof fund._count?.transactions === "number" && (
          <p className="text-[11px] text-muted-foreground mt-3">
            {fund._count.transactions} transactions
          </p>
        )}
      </CardContent>
      <div
        className={`pointer-events-none absolute -bottom-8 -end-8 h-24 w-24 rounded-full bg-gradient-to-br ${colors.gradient} opacity-10 group-hover:opacity-20 transition-opacity`}
      />
    </Card>
  );
}

function EmptyFunds({ onAdd }: { onAdd: () => void }) {
  const { t } = useApp();
  return (
    <Card className="border-dashed">
      <CardContent className="p-10 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mb-3">
          <Wallet className="h-6 w-6 text-emerald-600" />
        </div>
        <p className="text-muted-foreground">{t("finance.noFunds")}</p>
        <Button onClick={onAdd} className="mt-4">
          <Plus className="h-4 w-4" />
          {t("finance.addFund")}
        </Button>
      </CardContent>
    </Card>
  );
}
