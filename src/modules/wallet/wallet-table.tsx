"use client";
// Wallet table — student name, color-coded balance, recent activity count, actions.
import { Loader2, Eye, Plus } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/store/app-store";
import { balanceTone, type WalletListItem } from "./wallet-types";

type Props = {
  items: WalletListItem[];
  loading: boolean;
  onView: (w: WalletListItem) => void;
  onTopUp: (w: WalletListItem) => void;
};

export function WalletTable({ items, loading, onView, onTopUp }: Props) {
  const { t, locale } = useApp();

  const cur = (n: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US", {
      maximumFractionDigits: 0,
    }).format(n || 0);

  const fmtRelative = (iso: string) => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days <= 0) return d.toLocaleTimeString(locale === "ar" ? "ar-EG" : "bn-BD", { hour: "2-digit", minute: "2-digit" });
    if (days === 1) return "1d";
    if (days < 30) return `${days}d`;
    return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "bn-BD");
  };

  if (loading) {
    return (
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("wallet.student")}</TableHead>
              <TableHead className="text-end">{t("wallet.balance")}</TableHead>
              <TableHead className="hidden md:table-cell text-end">{t("wallet.recentActivity")}</TableHead>
              <TableHead className="text-end">{t("wallet.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 4 }).map((__, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-5 w-full max-w-[160px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-14 text-center">
        <p className="text-base font-medium">{t("wallet.noWallets")}</p>
        <p className="text-sm text-muted-foreground mt-1">{t("wallet.noWalletsDesc")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>{t("wallet.student")}</TableHead>
            <TableHead className="text-end">{t("wallet.balance")}</TableHead>
            <TableHead className="hidden md:table-cell text-end">{t("wallet.recentActivity")}</TableHead>
            <TableHead className="text-end">{t("wallet.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((w) => {
            const tone = balanceTone(w.balance);
            return (
              <TableRow key={w.id} className="transition-colors hover:bg-muted/50">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{w.student.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {w.student.rollNo && (
                        <span className="font-mono text-[11px] text-muted-foreground">
                          #{w.student.rollNo}
                        </span>
                      )}
                      {!w.student.isActive && (
                        <Badge className="text-[10px] h-4 bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          {t("common.inactive")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-end">
                  <span className={`inline-flex items-baseline gap-0.5 text-base font-bold tabular-nums ${tone}`}>
                    <span className="text-sm align-top">৳</span>
                    {cur(w.balance)}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell text-end">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium tabular-nums">{w.logsCount}</span>
                    {w.recentLog ? (
                      <span className="text-[11px] text-muted-foreground">
                        {t("wallet.lastTransaction")} {fmtRelative(w.recentLog.createdAt)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-end">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1"
                      onClick={() => onView(w)}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">{t("wallet.viewDetails")}</span>
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700"
                      onClick={() => onTopUp(w)}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">{t("wallet.topUp")}</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// Re-export Loader2 for parent's submit button convenience
export { Loader2 };
