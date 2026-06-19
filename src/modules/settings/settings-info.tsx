"use client";
// SettingsInfoTab — Madrasa info form (name, phone, email, address, currency, language)
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Building2, Save } from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";

export type TenantInfo = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  currency: string;
  language: string;
  theme: string;
  plan: string;
  status: string;
};

export function SettingsInfoTab({
  info,
  onSaved,
}: {
  info: TenantInfo | null;
  onSaved: (t: TenantInfo) => void;
}) {
  const { t } = useApp();
  const { toast } = useToast();
  const [form, setForm] = React.useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    currency: "BDT",
    language: "bn",
  });
  const [saving, setSaving] = React.useState(false);

  // Sync form whenever upstream info loads
  React.useEffect(() => {
    if (!info) return;
    setForm({
      name: info.name ?? "",
      phone: info.phone ?? "",
      email: info.email ?? "",
      address: info.address ?? "",
      currency: info.currency ?? "BDT",
      language: info.language ?? "bn",
    });
  }, [info]);

  const submit = async () => {
    if (!form.name.trim()) {
      toast({ title: t("settings.saveFailed"), description: t("settings.name"), variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const r = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Save failed");
      toast({ title: t("settings.saveSuccess") });
      onSaved(j.data as TenantInfo);
    } catch {
      toast({ title: t("settings.saveFailed"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="size-4 text-emerald-600" />
          {t("settings.tenant")}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="set-name">{t("settings.name")} *</Label>
          <Input
            id="set-name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={t("settings.name")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="set-phone">{t("settings.phone")}</Label>
          <Input
            id="set-phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+880…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="set-email">{t("settings.email")}</Label>
          <Input
            id="set-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="info@madrasa.edu"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="set-address">{t("settings.address")}</Label>
          <Textarea
            id="set-address"
            rows={2}
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder={t("settings.address")}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("settings.currency")}</Label>
          <Select
            value={form.currency}
            onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BDT">{t("settings.bdt")}</SelectItem>
              <SelectItem value="USD">{t("settings.usd")}</SelectItem>
              <SelectItem value="SAR">{t("settings.sar")}</SelectItem>
              <SelectItem value="EUR">{t("settings.eur")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t("settings.language")}</Label>
          <Select
            value={form.language}
            onValueChange={(v) => setForm((f) => ({ ...f, language: v }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bn">বাংলা</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ar">العربية</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <Button onClick={submit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            <Save className="size-4" />
            {saving ? t("common.loading") : t("settings.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
