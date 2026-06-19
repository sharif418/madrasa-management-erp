// Payment Dialog — modal for selecting payment method + entering reference
"use client";
import { useState } from "react";
import { CreditCard, Smartphone, Landmark, Wallet, Loader2 } from "lucide-react";
import { useApp } from "@/store/app-store";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type PaymentMethod = "bkash" | "nagad" | "bank" | "card";

export type PaymentDialogProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  targetPlan: "basic" | "pro" | "enterprise";
  price: number;
  currency: string;
  onConfirm: (method: PaymentMethod, reference: string) => Promise<void>;
};

const METHODS: Array<{ key: PaymentMethod; icon: typeof CreditCard; color: string }> = [
  { key: "bkash", icon: Smartphone, color: "from-pink-500 to-pink-600" },
  { key: "nagad", icon: Wallet, color: "from-orange-500 to-orange-600" },
  { key: "bank", icon: Landmark, color: "from-emerald-500 to-teal-600" },
  { key: "card", icon: CreditCard, color: "from-violet-500 to-purple-600" },
];

export function PaymentDialog({
  open, onOpenChange, targetPlan, price, currency, onConfirm,
}: PaymentDialogProps) {
  const { t } = useApp();
  const [method, setMethod] = useState<PaymentMethod>("bkash");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currencySymbol = currency === "BDT" ? "৳" : currency === "SAR" ? "﷼" : "$";

  async function handleConfirm() {
    if (!reference.trim()) {
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(method, reference.trim());
      setReference("");
      setMethod("bkash");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!submitting) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("billing.upgradePlan")}</DialogTitle>
          <DialogDescription>
            {t("billing." + targetPlan)} · {currencySymbol}{price.toLocaleString()}{t("billing.perMonth")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Method selection */}
          <div className="space-y-2">
            <Label>{t("billing.paymentMethod")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map((m) => {
                const active = method === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMethod(m.key)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all",
                      active
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm dark:bg-emerald-950/30 dark:text-emerald-300"
                        : "border-border bg-background hover:bg-accent"
                    )}
                  >
                    <span className={cn("grid size-7 place-items-center rounded-md bg-gradient-to-br text-white", m.color)}>
                      <m.icon className="size-4" />
                    </span>
                    <span className="truncate">{t("billing." + m.key)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reference input */}
          <div className="space-y-2">
            <Label htmlFor="ref">{t("billing.reference")}</Label>
            <Input
              id="ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="TXN-XXXXXXXX"
              disabled={submitting}
            />
            {!reference.trim() && (
              <p className="text-xs text-muted-foreground">
                {t("billing.referenceRequired")}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={submitting || !reference.trim()}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> {t("billing.upgrading")}
              </>
            ) : (
              t("billing.confirmUpgrade")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
