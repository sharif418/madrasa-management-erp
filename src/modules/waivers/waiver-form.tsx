// WaiverForm — Add / Edit form used inside a Dialog.
// Fields: student (searchable), waiver type (5 options with icon + desc),
// discount type toggle (percentage/fixed), amount, reason, validFrom, validUntil?.
"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/store/app-store";
import { WAIVER_TYPES, WAIVER_TYPE_KEYS, type WaiverItem, type WaiverType } from "./waivers-types";

type StudentLite = { id: string; name: string; rollNo: string | null; className: string | null };

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: WaiverItem | null;
  onSaved: () => void;
};

export function WaiverForm({ open, onOpenChange, initial, onSaved }: Props) {
  const { t, locale } = useApp();
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [search, setSearch] = useState("");
  const [studentId, setStudentId] = useState<string>("");
  const [type, setType] = useState<WaiverType>("scholarship");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [percentage, setPercentage] = useState("");
  const [fixedAmount, setFixedAmount] = useState("");
  const [reason, setReason] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset / hydrate on open
  useEffect(() => {
    if (!open) return;
    setSearch("");
    setStudentId(initial?.studentId ?? "");
    setType((initial?.type as WaiverType) ?? "scholarship");
    setDiscountType((initial?.discountType as "percentage" | "fixed") ?? "percentage");
    setPercentage(initial ? String(initial.percentage || "") : "");
    setFixedAmount(initial ? String(initial.fixedAmount || "") : "");
    setReason(initial?.reason ?? "");
    setValidFrom(initial ? initial.validFrom.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setValidUntil(initial?.validUntil ? initial.validUntil.slice(0, 10) : "");
  }, [open, initial]);

  // Search students (debounced via simple timer)
  useEffect(() => {
    if (!open) return;
    const q = search.trim();
    const handle = setTimeout(() => {
      const params = new URLSearchParams({ limit: "30" });
      if (q) params.set("search", q);
      fetch(`/api/students?${params}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => {
          if (j?.ok) {
            const items: StudentLite[] = (j.data.items || []).map((s: Record<string, unknown>) => ({
              id: s.id as string,
              name: s.name as string,
              rollNo: (s.rollNo as string | null) ?? null,
              className: (s.class as { name?: string } | null)?.name ?? null,
            }));
            setStudents(items);
          }
        })
        .catch(() => setStudents([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [search, open]);

  if (!open) return null;

  const cur = (n: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US", {
      maximumFractionDigits: 0,
    }).format(n || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return toast.error(t("waivers.selectStudent"));
    const payload: Record<string, unknown> = {
      studentId, type, discountType, reason: reason.trim() || undefined,
      validFrom: validFrom || undefined,
      validUntil: validUntil || undefined,
    };
    if (discountType === "percentage") {
      const pct = Number(percentage);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) return toast.error("0–100");
      payload.percentage = pct;
    } else {
      const fixed = Number(fixedAmount);
      if (!Number.isFinite(fixed) || fixed < 0) return toast.error("≥ 0");
      payload.fixedAmount = fixed;
    }
    setSaving(true);
    try {
      const url = initial ? `/api/waivers/${initial.id}` : "/api/waivers";
      const method = initial ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Failed");
      toast.success(initial ? t("common.save") : t("waivers.addWaiver"));
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const selected = students.find((s) => s.id === studentId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Student selector — searchable */}
      <div className="space-y-1.5">
        <Label>{t("waivers.student")}</Label>
        {!studentId ? (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("waivers.searchStudent")}
                className="ps-9"
                autoFocus
              />
            </div>
            <div className="max-h-40 overflow-y-auto rounded-md border border-border/60 divide-y divide-border/60">
              {students.length === 0 ? (
                <p className="px-3 py-4 text-xs text-muted-foreground text-center">{t("waivers.searchStudent")}</p>
              ) : (
                students.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => { setStudentId(s.id); setStudents([]); setSearch(""); }}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent"
                  >
                    <span className="truncate">{s.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate ms-2">
                      {s.rollNo || "—"} · {s.className || "—"}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-md border border-emerald-300/60 bg-emerald-50/50 dark:bg-emerald-950/20 px-3 py-2">
            <span className="text-sm font-medium truncate">{selected?.name || initial?.studentName}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setStudentId("")}>
              {t("common.edit")}
            </Button>
          </div>
        )}
      </div>

      {/* Waiver type — 5 option cards */}
      <div className="space-y-1.5">
        <Label>{t("waivers.waiverType")}</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {WAIVER_TYPE_KEYS.map((key) => {
            const meta = WAIVER_TYPES[key];
            const Icon = meta.icon;
            const active = type === key;
            return (
              <button
                type="button"
                key={key}
                onClick={() => setType(key)}
                className={`flex items-start gap-2 rounded-lg border p-2.5 text-start transition-all ${
                  active
                    ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-1 ring-emerald-500/40"
                    : "border-border/60 hover:border-emerald-300/60 hover:bg-accent/40"
                }`}
              >
                <Icon className={`size-4 shrink-0 mt-0.5 ${active ? "text-emerald-600" : "text-muted-foreground"}`} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{t(meta.labelKey)}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{t(meta.descKey)}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Discount type toggle + amount */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t("waivers.discountType")}</Label>
          <Select value={discountType} onValueChange={(v) => setDiscountType(v as "percentage" | "fixed")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">{t("waivers.percentage")}</SelectItem>
              <SelectItem value="fixed">{t("waivers.fixedAmount")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="w-amount">
            {discountType === "percentage" ? t("waivers.percentage") : t("waivers.fixedAmount")}
          </Label>
          {discountType === "percentage" ? (
            <Input
              id="w-amount" type="number" min="0" max="100" step="1"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              placeholder="50"
            />
          ) : (
            <Input
              id="w-amount" type="number" min="0" step="1"
              value={fixedAmount}
              onChange={(e) => setFixedAmount(e.target.value)}
              placeholder="500"
            />
          )}
          {discountType === "fixed" && Number.isFinite(Number(fixedAmount)) && Number(fixedAmount) > 0 && (
            <p className="text-xs text-muted-foreground">৳{cur(Number(fixedAmount))}</p>
          )}
        </div>
      </div>

      {/* Valid period */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="w-from">{t("waivers.validFrom")}</Label>
          <Input id="w-from" type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="w-until">{t("waivers.validUntil")}</Label>
          <Input id="w-until" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
        </div>
      </div>

      {/* Reason */}
      <div className="space-y-1.5">
        <Label htmlFor="w-reason">{t("waivers.reason")}</Label>
        <Textarea
          id="w-reason" rows={2} value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="…"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
          {t("common.cancel")}
        </Button>
        <Button
          type="submit" disabled={saving}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {t("common.save")}
        </Button>
      </div>
    </form>
  );
}
