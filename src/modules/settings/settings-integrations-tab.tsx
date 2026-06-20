"use client";
// SettingsIntegrationsTab — SMS / WhatsApp / Email gateway config
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare, MessageCircle, Mail, Save, Send, ShieldCheck, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/store/app-store";

type GatewaySettings = Record<string, string>;

const SMS_PROVIDERS = ["none", "twilio", "vonage", "sslwireless"];
const WA_PROVIDERS = ["none", "whatsapp_business", "twilio"];
const EMAIL_PROVIDERS = ["none", "smtp", "sendgrid"];

export function SettingsIntegrationsTab() {
  const { t } = useApp();
  const [settings, setSettings] = React.useState<GatewaySettings>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [testing, setTesting] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/settings/gateway", { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) setSettings(j.data as GatewaySettings);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const set = (key: string, value: string) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };

  const saveGroup = async (group: "sms" | "whatsapp" | "email", keys: string[]) => {
    setSaving(group);
    try {
      const payload: Record<string, string> = {};
      for (const k of keys) payload[k] = settings[k] || "";
      const r = await fetch("/api/settings/gateway", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Save failed");
      toast.success(t("settings.saved"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("settings.gatewayFailed"));
    } finally {
      setSaving(null);
    }
  };

  const testSend = async (kind: "sms" | "whatsapp" | "email") => {
    setTesting(kind);
    // Simulated — no actual network call
    await new Promise((res) => setTimeout(res, 700));
    toast.success(t("settings.testSent"));
    setTesting(null);
  };

  if (loading) {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      {/* Info note */}
      <Card className="border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <CardContent className="flex items-start gap-2 p-3 text-xs text-emerald-800 dark:text-emerald-200">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          <p>{t("settings.gatewayNote")}</p>
        </CardContent>
      </Card>

      {/* SMS Gateway */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="size-4 text-emerald-600" />
            {t("settings.smsGateway")}
            <Badge variant="outline" className="capitalize">
              {settings.sms_provider && settings.sms_provider !== "none"
                ? settings.sms_provider : t("settings.providerNone")}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">{t("settings.provider")}</Label>
            <Select value={settings.sms_provider || "none"}
              onValueChange={(v) => set("sms_provider", v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SMS_PROVIDERS.map((p) => (
                  <SelectItem key={p} value={p}
                    className="capitalize">
                    {p === "none" ? t("settings.providerNone") : p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("settings.senderId")}</Label>
            <Input value={settings.sms_sender_id || ""}
              onChange={(e) => set("sms_sender_id", e.target.value)}
              placeholder="MADRASA" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("settings.apiKey")}</Label>
            <Input type="password" value={settings.sms_api_key || ""}
              onChange={(e) => set("sms_api_key", e.target.value)}
              placeholder="••••••••••••" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("settings.apiSecret")}</Label>
            <Input type="password" value={settings.sms_api_secret || ""}
              onChange={(e) => set("sms_api_secret", e.target.value)}
              placeholder="••••••••••••" />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button onClick={() => saveGroup("sms",
              ["sms_provider", "sms_api_key", "sms_api_secret", "sms_sender_id"])}
              disabled={saving === "sms"}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              {saving === "sms" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {t("common.save")}
            </Button>
            <Button variant="outline" onClick={() => testSend("sms")}
              disabled={testing === "sms"}>
              {testing === "sms" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {t("settings.testSms")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Gateway */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="size-4 text-emerald-600" />
            {t("settings.whatsappGateway")}
            <Badge variant="outline" className="capitalize">
              {settings.whatsapp_provider && settings.whatsapp_provider !== "none"
                ? settings.whatsapp_provider : t("settings.providerNone")}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">{t("settings.provider")}</Label>
            <Select value={settings.whatsapp_provider || "none"}
              onValueChange={(v) => set("whatsapp_provider", v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {WA_PROVIDERS.map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">
                    {p === "none" ? t("settings.providerNone") : p.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("settings.phoneNumberId")}</Label>
            <Input value={settings.whatsapp_phone_number_id || ""}
              onChange={(e) => set("whatsapp_phone_number_id", e.target.value)}
              placeholder="123456789" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">{t("settings.apiKey")}</Label>
            <Input type="password" value={settings.whatsapp_api_key || ""}
              onChange={(e) => set("whatsapp_api_key", e.target.value)}
              placeholder="••••••••••••" />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button onClick={() => saveGroup("whatsapp",
              ["whatsapp_provider", "whatsapp_api_key", "whatsapp_phone_number_id"])}
              disabled={saving === "whatsapp"}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              {saving === "whatsapp" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {t("common.save")}
            </Button>
            <Button variant="outline" onClick={() => testSend("whatsapp")}
              disabled={testing === "whatsapp"}>
              {testing === "whatsapp" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {t("settings.testWhatsapp")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Gateway */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="size-4 text-emerald-600" />
            {t("settings.emailGateway")}
            <Badge variant="outline" className="capitalize">
              {settings.email_provider && settings.email_provider !== "none"
                ? settings.email_provider : t("settings.providerNone")}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">{t("settings.provider")}</Label>
            <Select value={settings.email_provider || "none"}
              onValueChange={(v) => set("email_provider", v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {EMAIL_PROVIDERS.map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">
                    {p === "none" ? t("settings.providerNone") : p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("settings.fromEmail")}</Label>
            <Input type="email" value={settings.email_from_email || ""}
              onChange={(e) => set("email_from_email", e.target.value)}
              placeholder="noreply@madrasa.edu" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("settings.smtpHost")}</Label>
            <Input value={settings.email_smtp_host || ""}
              onChange={(e) => set("email_smtp_host", e.target.value)}
              placeholder="smtp.gmail.com" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("settings.smtpPort")}</Label>
            <Input value={settings.email_smtp_port || ""}
              onChange={(e) => set("email_smtp_port", e.target.value)}
              placeholder="587" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("settings.username")}</Label>
            <Input value={settings.email_username || ""}
              onChange={(e) => set("email_username", e.target.value)}
              placeholder="user@example.com" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("settings.password")}</Label>
            <Input type="password" value={settings.email_password || ""}
              onChange={(e) => set("email_password", e.target.value)}
              placeholder="••••••••••••" />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button onClick={() => saveGroup("email",
              ["email_provider", "email_smtp_host", "email_smtp_port",
               "email_username", "email_password", "email_from_email"])}
              disabled={saving === "email"}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              {saving === "email" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {t("common.save")}
            </Button>
            <Button variant="outline" onClick={() => testSend("email")}
              disabled={testing === "email"}>
              {testing === "email" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {t("settings.testEmail")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
