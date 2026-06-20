// GenerateDialog — generates FeeCollection records for all active students
// in a class (or all classes) for a given fee structure + month.
"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/store/app-store";
import type { FeeStructure, GenerateResult } from "./fees-types";
import { MONTH_VALUES } from "./fees-types";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  structure: FeeStructure | null;
  classes: { id: string; name: string }[];
  onGenerated: () => void;
};

function currentYear(): number { return new Date().getFullYear(); }

export function GenerateDialog({ open, onOpenChange, structure, classes, onGenerated }: Props) {
  const { t, locale } = useApp();
  const [classId, setClassId] = useState<string>("all");
  const [year, setYear] = useState<string>(String(currentYear()));
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [dueDate, setDueDate] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Default: scope to structure.classId if set
    setClassId(structure?.classId ?? "all");
    setYear(String(currentYear()));
    setMonth(String(new Date().getMonth() + 1).padStart(2, "0"));
    // Default due date = first of selected month
    const d = new Date(currentYear(), new Date().getMonth(), 10);
    setDueDate(d.toISOString().slice(0, 10));
  }, [open, structure]);

  if (!open || !structure) return null;

  const monthLabel = (m: string) => {
    try {
      return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "bn" ? "bn-BD" : "en", {
        month: "long",
      }).format(new Date(2000, Number(m) - 1, 1));
    } catch {
      return m;
    }
  };

  const handleGenerate = async () => {
    if (!structure) return;
    setSaving(true);
    try {
      const monthStr = `${year}-${month}`;
      const res = await fetch("/api/fee-structures/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feeStructureId: structure.id,
          classId: classId === "all" ? null : classId,
          month: monthStr,
          dueDate: dueDate || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Failed");
      const r = j.data as GenerateResult;
      toast.success(
        t("fees.generated", { generated: r.generated, skipped: r.skipped })
      );
      onOpenChange(false);
      onGenerated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
        <div className="flex items-center gap-2 font-medium">
          <Sparkles className="size-4" />
          {structure.name}
        </div>
        <p className="mt-1 text-xs opacity-80">
          ৳{structure.amount.toLocaleString()} · {t(`fees.${structure.type}`)} ·{" "}
          {structure.frequency === "one_time" ? t("fees.oneTime") : t(`fees.${structure.frequency}`)}
        </p>
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t("fees.selectMonth")}</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTH_VALUES.map((m) => (
                <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gen-year">Year</Label>
          <Input
            id="gen-year"
            type="number"
            min="2000"
            max="2100"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="gen-due">{t("fees.dueDate")}</Label>
        <Input
          id="gen-due"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
          {t("common.cancel")}
        </Button>
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={saving}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          <Sparkles className="size-4" />
          {t("fees.generate")}
        </Button>
      </div>
    </div>
  );
}
