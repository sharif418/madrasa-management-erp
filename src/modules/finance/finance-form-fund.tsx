"use client";
// Add Fund dialog — name, type (color-coded picker), initial balance, description.
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
import { Loader2, Plus } from "lucide-react";
import { fundTypeColors, type FundType } from "./finance-types";

export function AddFundDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const { t, dir } = useApp();
  const [name, setName] = useState("");
  const [type, setType] = useState<FundType>("general");
  const [description, setDescription] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setType("general");
      setDescription("");
      setInitialBalance("");
    }
  }, [open]);

  const submit = async () => {
    if (!name.trim()) {
      toast.error(t("finance.fundName") + " — " + t("common.required"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/finance/funds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          type,
          description: description.trim() || undefined,
          initialBalance: initialBalance ? Number(initialBalance) : undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) {
        toast.error(j?.error || "Failed to create fund");
        return;
      }
      toast.success(t("finance.fundCreated"));
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error("Failed to create fund");
    } finally {
      setSubmitting(false);
    }
  };

  const fundTypes: FundType[] = ["general", "lillah", "waqf", "zakat", "sadaqah"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={dir()} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t("finance.addFund")}
          </DialogTitle>
          <DialogDescription>{t("finance.tamlik.desc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fund-name">{t("finance.fundName")}</Label>
            <Input
              id="fund-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Zakat Fund 1446 AH"
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("finance.fundType")}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {fundTypes.map((ft) => {
                const c = fundTypeColors[ft];
                const active = type === ft;
                return (
                  <button
                    key={ft}
                    type="button"
                    onClick={() => setType(ft)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                      active
                        ? `${c.badge} border-current font-medium`
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                    {t(`finance.${ft}`)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fund-initial">{t("finance.initialBalance")}</Label>
            <Input
              id="fund-initial"
              type="number"
              min="0"
              inputMode="decimal"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fund-desc" className="text-muted-foreground">
              {t("finance.description")} ({t("common.optional")})
            </Label>
            <Textarea
              id="fund-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Purpose / restrictions / source…"
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
