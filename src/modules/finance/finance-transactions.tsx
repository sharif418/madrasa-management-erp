"use client";
// Transactions tab — state, filters, table, pagination, dialogs, chart.
import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/store/app-store";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AddTransactionDialog } from "./finance-form";
import { FinanceChart } from "./finance-chart";
import { TransactionsTable } from "./finance-tx-table";
import { TransactionsFilterBar } from "./finance-tx-filters";
import type { Fund, Transaction, TxListResponse, TxType } from "./finance-types";

export function FinanceTransactions({
  reload: reloadOverview,
}: {
  reload: () => void;
}) {
  const { t, dir } = useApp();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [items, setItems] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [sums, setSums] = useState({ income: 0, expense: 0, transfer: 0 });
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [fundId, setFundId] = useState("all");
  const [type, setType] = useState<"all" | TxType>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Load funds once for the filter dropdown.
  useEffect(() => {
    fetch("/api/finance/funds", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => j?.ok && setFunds(j.data.funds ?? []))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (fundId !== "all") params.set("fundId", fundId);
    if (type !== "all") params.set("type", type);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("page", String(page));
    params.set("limit", String(limit));
    try {
      const res = await fetch(`/api/finance/transactions?${params.toString()}`, {
        credentials: "include",
      });
      const j = await res.json();
      if (j?.ok) {
        const d: TxListResponse = j.data;
        setItems(d.items);
        setTotal(d.total);
        setSums(d.sums);
      }
    } finally {
      setLoading(false);
    }
  }, [fundId, type, from, to, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to first page when filters change.
  useEffect(() => {
    setPage(1);
  }, [fundId, type, from, to]);

  const onDeleted = () => {
    setDelId(null);
    setDeleting(false);
    load();
    reloadOverview();
    toast.success(t("finance.transactionDeleted"));
  };

  const confirmDelete = async () => {
    if (!delId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/finance/transactions/${delId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) {
        toast.error(j?.error || t("finance.deleteFailed"));
        setDeleting(false);
        return;
      }
      onDeleted();
    } catch {
      toast.error(t("finance.deleteFailed"));
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      <FinanceChart />

      {/* Filters + Add button + summary chips */}
      <Card className="border border-border/60">
        <CardContent className="p-0">
          <TransactionsFilterBar
            funds={funds}
            fundId={fundId}
            type={type}
            from={from}
            to={to}
            sums={sums}
            onFundId={setFundId}
            onType={setType}
            onFrom={setFrom}
            onTo={setTo}
            onAdd={() => setAddOpen(true)}
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border border-border/60">
        <CardContent className="p-0">
          <TransactionsTable
            items={items}
            loading={loading}
            onDelete={(id) => setDelId(id)}
          />

          {!loading && items.length > 0 && (
            <div
              dir={dir()}
              className="flex items-center justify-between gap-2 px-4 py-3 border-t border-border/60 flex-wrap"
            >
              <p className="text-xs text-muted-foreground">
                {total} · {page}/{totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t("common.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  {t("common.next")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AddTransactionDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={() => {
          load();
          reloadOverview();
        }}
        funds={funds}
      />

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent dir={dir()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("finance.confirmDeleteTxn")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
