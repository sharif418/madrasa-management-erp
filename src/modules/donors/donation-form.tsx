"use client";
// DonationForm — Add dialog: donor selector, amount, fund, method, purpose, status, date.
import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { HandCoins, Save } from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { DONOR_FUNDS, PAYMENT_METHODS, type Donor } from "./types";

const STATUSES = ["pending", "confirmed", "failed"];

export function DonationForm({
  open, onOpenChange, donors, onSaved, defaultDonorId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  donors: Donor[];
  onSaved: () => void;
  defaultDonorId?: string | null;
}) {
  const { t, locale } = useApp();
  const { toast } = useToast();
  const [donorId, setDonorId] = React.useState<string>("");
  const [donorName, setDonorName] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [fund, setFund] = React.useState("general");
  const [method, setMethod] = React.useState("cash");
  const [status, setStatus] = React.useState("confirmed");
  const [purpose, setPurpose] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [date, setDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const preset = donors.find((d) => d.id === defaultDonorId);
    setDonorId(preset?.id ?? "");
    setDonorName(preset?.name ?? "");
    setAmount("");
    setFund("general");
    setMethod("cash");
    setStatus("confirmed");
    setPurpose("");
    setReference("");
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setDate(`${yyyy}-${mm}-${dd}`);
  }, [open, defaultDonorId, donors]);

  const onDonorSelect = (id: string) => {
    setDonorId(id);
    const d = donors.find((x) => x.id === id);
    setDonorName(d?.name || "");
    if (d?.preferredFund) setFund(d.preferredFund);
  };

  const submit = async () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast({ title: t("donors.donationFailed"), description: t("common.required"), variant: "destructive" });
      return;
    }
    if (!donorId && !donorName.trim()) {
      toast({ title: t("donors.donationFailed"), description: t("donors.name"), variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        donorId: donorId || undefined,
        donorName: donorName.trim() || "Anonymous",
        amount: amt,
        fund,
        purpose: purpose.trim(),
        paymentMethod: method,
        reference: reference.trim(),
        status,
        date: new Date(date).toISOString(),
      };
      const r = await fetch("/api/donations", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Save failed");
      toast({ title: t("donors.donationSaved") });
      onOpenChange(false);
      onSaved();
    } catch {
      toast({ title: t("donors.donationFailed"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="size-5 text-rose-500" />
            {t("donors.recordDonation")}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("donors.donors")}</Label>
              <Select value={donorId} onValueChange={onDonorSelect}>
                <SelectTrigger className="w-full"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {donors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="df-amount">{t("donors.amount")} (৳) *</Label>
              <Input id="df-amount" type="number" min={1} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} dir="ltr" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>{t("donors.fund")}</Label>
              <Select value={fund} onValueChange={setFund}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DONOR_FUNDS.map((f) => (
                    <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("donors.method")}</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("donors.status")}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="df-date">{t("donors.date")}</Label>
              <Input id="df-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="df-ref">{t("donors.reference")}</Label>
              <Input id="df-ref" value={reference} onChange={(e) => setReference(e.target.value)} dir="ltr" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="df-purpose">{t("donors.purpose")}</Label>
            <Textarea id="df-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={2} maxLength={500} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>{t("common.cancel")}</Button>
          <Button onClick={submit} disabled={saving} className="bg-rose-500 hover:bg-rose-600 text-white">
            <Save className="size-4" /> {saving ? t("common.loading") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
