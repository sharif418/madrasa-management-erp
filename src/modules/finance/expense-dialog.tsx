"use client";
// AddExpenseDialog — form for creating an expense (used by ExpensesTab).
import * as React from "react";
import { useApp } from "@/store/app-store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Briefcase, Zap, Wrench, Utensils, Bus, PartyPopper, MoreHorizontal } from "lucide-react";

const CATEGORIES = [
  { value: "salary", icon: Briefcase },
  { value: "utilities", icon: Zap },
  { value: "maintenance", icon: Wrench },
  { value: "food", icon: Utensils },
  { value: "transport", icon: Bus },
  { value: "event", icon: PartyPopper },
  { value: "other", icon: MoreHorizontal },
] as const;

const METHODS = ["cash", "bkash", "nagad", "bank", "wallet"] as const;

function catLabelKey(c: string): string {
  return c === "transport" ? "transportExp" : c;
}

export function AddExpenseDialog({
  open, onOpenChange, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
}) {
  const { t, dir } = useApp();
  const [amount, setAmount] = React.useState("");
  const [category, setCategory] = React.useState<string>("salary");
  const [description, setDescription] = React.useState("");
  const [paidTo, setPaidTo] = React.useState("");
  const [method, setMethod] = React.useState<string>("cash");
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = React.useState(false);

  const reset = () => {
    setAmount(""); setDescription(""); setPaidTo("");
    setCategory("salary"); setMethod("cash");
    setDate(new Date().toISOString().slice(0, 10));
  };

  const save = async () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) { toast.error("Invalid amount"); return; }
    setSaving(true);
    try {
      const r = await fetch("/api/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, category, description, paidTo, paymentMethod: method, date }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Failed");
      toast.success(t("finance.expenseSaved"));
      reset();
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={dir()} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("finance.addExpense")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("finance.amount")}</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={0} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("finance.date")}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("finance.expenseCategory")}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  return (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        <Icon className="size-3.5" />
                        {t(`finance.${catLabelKey(c.value)}`)}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("finance.paidTo")}</Label>
            <Input value={paidTo} onChange={(e) => setPaidTo(e.target.value)} placeholder="—" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("finance.paymentMethod")}</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("finance.description")}</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button onClick={save} disabled={saving} className="bg-rose-600 text-white hover:bg-rose-700">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
