"use client";
// Add Transaction dialog — type radio, fund, amount, date, category, method, description.
import { useEffect, useState } from "react";
import { useApp } from "@/store/app-store";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Plus } from "lucide-react";
import type { Fund, PaymentMethod, TxType } from "./finance-types";

export function AddTransactionDialog({
  open,
  onOpenChange,
  onSaved,
  funds,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
  funds: Fund[];
}) {
  const { t, dir } = useApp();
  const [fundId, setFundId] = useState("");
  const [type, setType] = useState<TxType>("income");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (funds.length && !fundId) setFundId(funds[0].id);
    } else {
      setType("income");
      setAmount("");
      setCategory("");
      setDescription("");
      setMethod("cash");
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [open, funds, fundId]);

  const isTransfer = type === "transfer";
  const transferFund =
    isTransfer && fundId ? funds.find((f) => f.id === fundId) : null;

  const submit = async () => {
    if (!fundId) {
      toast.error("Select a fund");
      return;
    }
    if (isTransfer && transferFund && transferFund.type !== "zakat") {
      toast.error(t("finance.tamlik.noZakatFund"));
      return;
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error(t("finance.amount") + " — " + t("common.required"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fundId,
          amount: amt,
          type,
          category: category.trim() || undefined,
          description: description.trim() || undefined,
          paymentMethod: method,
          date: new Date(date).toISOString(),
        }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) {
        toast.error(j?.error || t("finance.createFailed"));
        return;
      }
      toast.success(t("finance.transactionCreated"));
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error(t("finance.createFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const types: { value: TxType; label: string; tone: string }[] = [
    { value: "income", label: t("finance.income"), tone: "text-emerald-600" },
    { value: "expense", label: t("finance.expense"), tone: "text-rose-600" },
    { value: "transfer", label: t("finance.transfer"), tone: "text-purple-600" },
  ];
  const methods: PaymentMethod[] = ["cash", "bkash", "nagad", "bank", "wallet"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={dir()} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t("finance.addTransaction")}
          </DialogTitle>
          <DialogDescription>{t("finance.tamlik.desc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("finance.type")}</Label>
            <RadioGroup
              value={type}
              onValueChange={(v) => setType(v as TxType)}
              className="grid grid-cols-3 gap-2"
            >
              {types.map((tp) => (
                <label
                  key={tp.value}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-all ${
                    type === tp.value
                      ? "border-foreground bg-accent"
                      : "border-border hover:bg-accent/50"
                  }`}
                >
                  <RadioGroupItem value={tp.value} />
                  <span className={tp.tone}>{tp.label}</span>
                </label>
              ))}
            </RadioGroup>
            {isTransfer && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {t("finance.tamlik.shariahNote")}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>{t("finance.funds")}</Label>
            <Select value={fundId} onValueChange={setFundId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("finance.allFunds")} />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {isTransfer
                  ? funds
                      .filter((f) => f.type === "zakat")
                      .map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name} (৳{f.balance})
                        </SelectItem>
                      ))
                  : funds.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name} (৳{f.balance})
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tx-amount">{t("finance.amount")}</Label>
              <Input
                id="tx-amount"
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tx-date">{t("finance.date")}</Label>
              <Input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tx-cat">{t("finance.category")}</Label>
              <Input
                id="tx-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="donation / salary / maintenance…"
              />
            </div>
            {!isTransfer && (
              <div className="space-y-1.5">
                <Label>{t("finance.method")}</Label>
                <Select
                  value={method}
                  onValueChange={(v) => setMethod(v as PaymentMethod)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {methods.map((m) => (
                      <SelectItem key={m} value={m}>
                        {t(`finance.${m}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tx-desc" className="text-muted-foreground">
              {t("finance.description")} ({t("common.optional")})
            </Label>
            <Textarea
              id="tx-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
          <Button onClick={submit} disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
