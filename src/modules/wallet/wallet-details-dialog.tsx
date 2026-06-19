"use client";
// Wallet Details Dialog — shows last 20 WalletLog entries (newest first).
// Lazy-loads when opened. Type badge + amount + description + timestamp.
import { useEffect, useState } from "react";
import { useApp } from "@/store/app-store";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowUpCircle, ShoppingBag, WashingMachine, GraduationCap, Loader2,
} from "lucide-react";
import {
  trxTypeColors, type WalletDetailResponse, type WalletStudent, type TrxType,
} from "./wallet-types";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  student: WalletStudent | null;
};

const TRX_ICONS: Record<TrxType, typeof ArrowUpCircle> = {
  top_up: ArrowUpCircle,
  canteen: ShoppingBag,
  laundry: WashingMachine,
  fee_deduction: GraduationCap,
};

export function WalletDetailsDialog({ open, onOpenChange, student }: Props) {
  const { t, dir, locale } = useApp();
  const [data, setData] = useState<WalletDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !student) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setData(null);
      try {
        const res = await fetch(`/api/wallet/${student.id}`, { credentials: "include" });
        const j = await res.json();
        if (!alive) return;
        if (!res.ok || !j?.ok) throw new Error(j?.error);
        setData(j.data as WalletDetailResponse);
      } catch {
        if (alive) toast.error(t("wallet.detailError"));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [open, student, t]);

  const cur = (n: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US", {
      maximumFractionDigits: 0,
    }).format(n || 0);

  const fmtDateTime = (iso: string) => {
    const d = new Date(iso);
    const date = d.toLocaleDateString(locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US");
    const time = d.toLocaleTimeString(locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US", {
      hour: "2-digit", minute: "2-digit",
    });
    return `${date} · ${time}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={dir()} className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 flex-wrap">
            <span>{t("wallet.history")}</span>
            {data && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-0">
                ৳ {cur(data.wallet.balance)}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {student?.name}
            {student?.nameArabic ? (
              <span dir="rtl" className="ms-1" lang="ar">· {student.nameArabic}</span>
            ) : null}
            {data?.wallet.student.class?.name ? (
              <span className="ms-1">· {data.wallet.student.class.name}</span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : !data || data.logs.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            <WalletEmptyIcon />
            <p className="mt-2">{t("wallet.noLogs")}</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <ul className="divide-y divide-border/60 pe-2">
              {data.logs.map((log) => {
                const colors = trxTypeColors[log.trxType];
                const Icon = TRX_ICONS[log.trxType];
                const sign = log.trxType === "top_up" ? "+" : "−";
                return (
                  <li key={log.id} className="flex items-start gap-3 py-3">
                    <div className={`mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted/50 ${colors.icon}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <Badge variant="outline" className={colors.badge}>
                          {t(`wallet.${log.trxType}`)}
                        </Badge>
                        <span className={`text-sm font-semibold tabular-nums ${colors.amount}`}>
                          {sign}৳{cur(log.amount)}
                        </span>
                      </div>
                      {log.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {log.description}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {fmtDateTime(log.createdAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

function WalletEmptyIcon() {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted">
      <Loader2 className="h-5 w-5 text-muted-foreground opacity-50" />
    </span>
  );
}
