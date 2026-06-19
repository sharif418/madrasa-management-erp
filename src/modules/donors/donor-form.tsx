"use client";
// DonorForm — Add/Edit dialog with name, Arabic name, contact, type, fund, notes.
import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Heart, Save } from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { DONOR_TYPES, DONOR_FUNDS, type Donor } from "./types";

export function DonorForm({
  open, onOpenChange, editing, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Donor | null;
  onSaved: () => void;
}) {
  const { t } = useApp();
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [nameArabic, setNameArabic] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [country, setCountry] = React.useState("Bangladesh");
  const [type, setType] = React.useState<string>("individual");
  const [preferredFund, setPreferredFund] = React.useState<string>("general");
  const [isRecurring, setIsRecurring] = React.useState(false);
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setNameArabic(editing?.nameArabic ?? "");
    setEmail(editing?.email ?? "");
    setPhone(editing?.phone ?? "");
    setAddress(editing?.address ?? "");
    setCountry(editing?.country ?? "Bangladesh");
    setType(editing?.type ?? "individual");
    setPreferredFund(editing?.preferredFund ?? "general");
    setIsRecurring(editing?.isRecurring ?? false);
    setNotes(editing?.notes ?? "");
  }, [open, editing]);

  const submit = async () => {
    if (!name.trim()) {
      toast({ title: t("donors.donorFailed"), description: t("common.required"), variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        nameArabic: nameArabic.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        country: country.trim() || "Bangladesh",
        type,
        preferredFund,
        isRecurring,
        notes: notes.trim(),
      };
      const r = editing
        ? await fetch(`/api/donors/${editing.id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
          })
        : await fetch("/api/donors", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
          });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Save failed");
      toast({ title: t("donors.donorSaved") });
      onOpenChange(false);
      onSaved();
    } catch {
      toast({ title: t("donors.donorFailed"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="size-5 text-rose-500" />
            {editing ? t("common.edit") : t("donors.addDonor")}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="df-name">{t("donors.name")} *</Label>
              <Input id="df-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={150} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="df-na">{t("donors.nameArabic")}</Label>
              <Input id="df-na" value={nameArabic} onChange={(e) => setNameArabic(e.target.value)} dir="rtl" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="df-phone">{t("donors.phone")}</Label>
              <Input id="df-phone" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="df-email">{t("donors.email")}</Label>
              <Input id="df-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="df-country">{t("donors.country")}</Label>
              <Input id="df-country" value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("donors.type")}</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DONOR_TYPES.map((ty) => (
                    <SelectItem key={ty} value={ty}>{t(`donors.${ty === "recurring" ? "recurringType" : ty}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("donors.preferredFund")}</Label>
              <Select value={preferredFund} onValueChange={setPreferredFund}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DONOR_FUNDS.map((f) => (
                    <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="df-addr">{t("donors.address")}</Label>
            <Input id="df-addr" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="df-notes">{t("donors.notes")}</Label>
            <Textarea id="df-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={500} />
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
            <div>
              <Label htmlFor="df-rec" className="cursor-pointer">{t("donors.recurringType")}</Label>
              <p className="text-xs text-muted-foreground">{t("donors.recurring")}</p>
            </div>
            <Switch id="df-rec" checked={isRecurring} onCheckedChange={setIsRecurring} />
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
