"use client";
// Wallet Top-Up Dialog — amount + description + payment method.
// Calls POST /api/wallet/[studentId]/topup atomically.
import { useEffect, useState } from "react";
import { useApp } from "@/store/app-store";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Wallet, Banknote } from "lucide-react";
import type { WalletStudent } from "./wallet-types";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  student: WalletStudent | null;
  currentBalance: number;
  onToppedUp: () => void;
};

export function WalletTopUpDialog({
  open, onOpenChange, student, currentBalance, onToppedUp,
}: Props) {
  const { t, dir, locale } = useApp();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [method, setMethod] = useState("cash");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setAmount("");
      setDescription("");
      setMethod("cash");
    }
  }, [open]);

  const cur = (n: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US", {
      maximumFractionDigits: 0,
    }).format(n || 0);

  const submit = async () => {
    if (!student) return;
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error(t("wallet.amountRequired"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/wallet/${student.id}/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount: amt,
          description: description.trim() || undefined,
          paymentMethod: method,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) {
        toast.error(j?.error || t("wallet.topUpError"));
        return;
      }
      toast.success(t("wallet.topUpSuccess"));
      onToppedUp();
      onOpenChange(false);
    } catch {
      toast.error(t("wallet.topUpError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={dir()} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Wallet className="h-4 w-4" />
            </span>
            {t("wallet.topUpWallet")}
          </DialogTitle>
          <DialogDescription>
            {student?.name}
            {student?.nameArabic ? (
              <span dir="rtl" className="ms-1" lang="ar">· {student.nameArabic}</span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current balance preview */}
          <div className="rounded-lg border bg-muted/30 px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("wallet.balance")}</span>
            <span className="text-lg font-semibold tabular-nums">৳{cur(currentBalance)}</span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="topup-amount">{t("wallet.amount")}</Label>
            <div className="relative">
              <Banknote className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="topup-amount"
                type="number"
                min="1"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t("wallet.enterAmount")}
                className="ps-9"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="topup-method">{t("wallet.paymentMethod")}</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="topup-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">{t("wallet.cash")}</SelectItem>
                <SelectItem value="bkash">{t("wallet.bkash")}</SelectItem>
                <SelectItem value="nagad">{t("wallet.nagad")}</SelectItem>
                <SelectItem value="bank">{t("wallet.bank")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="topup-note" className="text-muted-foreground">
              {t("wallet.note")}
            </Label>
            <Textarea
              id="topup-note"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder=""
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
            {t("wallet.topUp")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
