// FeeStructureForm — used inside a Dialog for both Add and Edit flows.
// Validates name + amount locally before POST/PUT.
"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/store/app-store";
import type { FeeStructure } from "./fees-types";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** When set, the form is in "edit" mode. */
  initial?: FeeStructure | null;
  classes: { id: string; name: string }[];
  onSaved: () => void;
};

const TYPES = ["tuition", "admission", "exam", "hostel", "transport"] as const;
const FREQS = ["monthly", "quarterly", "yearly", "one_time"] as const;

export function FeeStructureForm({ open, onOpenChange, initial, classes, onSaved }: Props) {
  const { t, locale } = useApp();
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("tuition");
  const [frequency, setFrequency] = useState<string>("monthly");
  const [amount, setAmount] = useState<string>("");
  const [classId, setClassId] = useState<string>("all");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setType(initial?.type ?? "tuition");
    setFrequency(initial?.frequency ?? "monthly");
    setAmount(initial ? String(initial.amount) : "");
    setClassId(initial?.classId ?? "all");
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    const amt = Number(amount);
    if (!trimmed) return toast.error(t("fees.structureName"));
    if (!Number.isFinite(amt) || amt <= 0) return toast.error(t("fees.amount"));

    setSaving(true);
    try {
      const payload = {
        name: trimmed,
        type,
        frequency,
        amount: amt,
        classId: classId === "all" ? null : classId,
      };
      const url = initial ? `/api/fee-structures/${initial.id}` : "/api/fee-structures";
      const method = initial ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Failed");
      toast.success(initial ? t("common.save") : t("fees.addStructure"));
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const cur = (n: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US", {
      maximumFractionDigits: 0,
    }).format(n || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="fee-name">{t("fees.structureName")}</Label>
        <Input
          id="fee-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tuition Fee — Grade 5"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t("fees.feeType")}</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPES.map((tp) => (
                <SelectItem key={tp} value={tp}>{t(`fees.${tp}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t("fees.frequency")}</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FREQS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f === "one_time" ? t("fees.oneTime") : t(`fees.${f}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="fee-amount">{t("fees.amount")}</Label>
          <Input
            id="fee-amount"
            type="number"
            min="0"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="500"
          />
          {Number.isFinite(Number(amount)) && Number(amount) > 0 && (
            <p className="text-xs text-muted-foreground">৳{cur(Number(amount))}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>{t("fees.selectClass")}</Label>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("fees.allClasses")}</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
          {t("common.cancel")}
        </Button>
        <Button
          type="submit"
          disabled={saving}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {t("common.save")}
        </Button>
      </div>
    </form>
  );
}
