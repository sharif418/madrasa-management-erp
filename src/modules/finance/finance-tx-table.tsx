"use client";
// Transactions table — receives items + handlers from the parent. Presentation only.
import { useApp } from "@/store/app-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Inbox, ShieldCheck, Trash2 } from "lucide-react";
import { txTypeColors, type Transaction } from "./finance-types";

type Props = {
  items: Transaction[];
  loading: boolean;
  onDelete: (id: string) => void;
};

export function TransactionsTable({ items, loading, onDelete }: Props) {
  const { t, locale } = useApp();

  const cur = (n: number) =>
    new Intl.NumberFormat(
      locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US",
      { maximumFractionDigits: 0 }
    ).format(n || 0);

  if (loading) {
    return (
      <div className="p-4 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="p-10 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Inbox className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          {t("finance.noTransactions")}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="whitespace-nowrap">
              {t("finance.date")}
            </TableHead>
            <TableHead className="whitespace-nowrap">
              {t("finance.funds")}
            </TableHead>
            <TableHead className="whitespace-nowrap">
              {t("finance.type")}
            </TableHead>
            <TableHead className="text-end whitespace-nowrap">
              {t("finance.amount")}
            </TableHead>
            <TableHead className="whitespace-nowrap hidden md:table-cell">
              {t("finance.category")}
            </TableHead>
            <TableHead className="whitespace-nowrap hidden lg:table-cell">
              {t("finance.method")}
            </TableHead>
            <TableHead className="whitespace-nowrap hidden lg:table-cell">
              {t("finance.relatedStudent")}
            </TableHead>
            <TableHead className="whitespace-nowrap hidden xl:table-cell">
              {t("finance.description")}
            </TableHead>
            <TableHead className="text-end">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((tx) => {
            const c = txTypeColors[tx.type];
            const sign =
              tx.type === "income" ? "+" : tx.type === "expense" ? "−" : "↔";
            return (
              <TableRow key={tx.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="whitespace-nowrap text-sm">
                  {new Date(tx.date).toLocaleDateString(
                    locale === "ar" ? "ar-EG" : "bn-BD",
                    { year: "numeric", month: "short", day: "2-digit" }
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm font-medium">
                  {tx.fund.name}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge variant="outline" className={`${c.badge} border gap-1`}>
                    {tx.type === "transfer" && (
                      <ShieldCheck className="h-3 w-3" />
                    )}
                    {t(`finance.${tx.type}`)}
                  </Badge>
                </TableCell>
                <TableCell
                  className={`text-end whitespace-nowrap font-semibold tabular-nums ${c.amount}`}
                >
                  {sign} ৳{cur(tx.amount)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm hidden md:table-cell text-muted-foreground">
                  {tx.category || "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm hidden lg:table-cell text-muted-foreground">
                  {tx.paymentMethod ? t(`finance.${tx.paymentMethod}`) : "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm hidden lg:table-cell text-muted-foreground">
                  {tx.student?.name || "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm hidden xl:table-cell text-muted-foreground max-w-[200px] truncate">
                  {tx.description || "—"}
                </TableCell>
                <TableCell className="text-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    onClick={() => onDelete(tx.id)}
                    title={t("common.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
