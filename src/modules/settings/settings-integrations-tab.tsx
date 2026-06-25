"use client";
// SettingsIntegrationsTab — Full integration management:
// SMS, Payment Gateway, Email, Storage — all admin-configurable
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  MessageSquare, CreditCard, Mail, HardDrive,
  Save, Send, ShieldCheck, Loader2, CheckCircle2, XCircle, Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/store/app-store";

type ProviderConfig = {
  id: string | null;
  provider: string;
  category: string;
  label: string;
  fields: string[];
  config: Record<string, string>;
  isActive: boolean;
  isSandbox: boolean;
  lastTestedAt: string | null;
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  sms: <MessageSquare className="size-4 text-emerald-600" />,
  payment: <CreditCard className="size-4 text-blue-600" />,
  email: <Mail className="size-4 text-amber-600" />,
  storage: <HardDrive className="size-4 text-purple-600" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  sms: "from-emerald-600 to-teal-600",
  payment: "from-blue-600 to-indigo-600",
  email: "from-amber-600 to-orange-600",
  storage: "from-purple-600 to-pink-600",
};

const CATEGORY_LABELS: Record<string, string> = {
  sms: "SMS Gateway",
  payment: "Payment Gateway",
  email: "Email Service",
  storage: "File Storage",
};

export function SettingsIntegrationsTab() {
  const { t } = useApp();
  const [configs, setConfigs] = React.useState<ProviderConfig[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [testing, setTesting] = React.useState<string | null>(null);
  const [editValues, setEditValues] = React.useState<Record<string, Record<string, string>>>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/settings/integrations", { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) {
        setConfigs(j.data.configs);
        const vals: Record<string, Record<string, string>> = {};
        for (const c of j.data.configs) vals[c.provider] = { ...c.config };
        setEditValues(vals);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const setField = (provider: string, key: string, value: string) => {
    setEditValues((prev) => ({
      ...prev,
      [provider]: { ...(prev[provider] || {}), [key]: value },
    }));
  };

  const saveProvider = async (provider: string, isActive: boolean, isSandbox: boolean) => {
    setSaving(provider);
    try {
      const r = await fetch("/api/settings/integrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider, config: editValues[provider] || {}, isActive, isSandbox,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Save failed");
      toast.success(`${provider} saved successfully`);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(null); }
  };

  const testProvider = async (provider: string) => {
    setTesting(provider);
    try {
      const r = await fetch("/api/settings/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const j = await r.json();
      if (j?.data?.success || j?.ok) {
        toast.success(j?.data?.message || "Test successful");
      } else {
        toast.error(j?.data?.message || j?.error || "Test failed");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Test failed");
    } finally { setTesting(null); }
  };

  if (loading) return <Skeleton className="h-96 rounded-xl" />;

  const grouped = ["sms", "payment", "email", "storage"].map((cat) => ({
    category: cat,
    providers: configs.filter((c) => c.category === cat),
  }));

  return (
    <div className="space-y-6">
      <Card className="border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <CardContent className="flex items-start gap-2 p-3 text-xs text-emerald-800 dark:text-emerald-200">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          <p>সমস্ত ক্রেডেনশিয়াল এনক্রিপ্ট করে ডাটাবেসে সংরক্ষিত হয়। প্রোডাকশনে পাঠানোর আগে সবকিছু টেস্ট করুন।</p>
        </CardContent>
      </Card>

      {grouped.map(({ category, providers }) => (
        <div key={category} className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            {CATEGORY_ICONS[category]}
            {CATEGORY_LABELS[category]}
          </h3>

          <div className="grid gap-3 md:grid-cols-2">
            {providers.map((p) => (
              <Card key={p.provider} className={`relative ${p.isActive ? "ring-2 ring-emerald-500/30" : ""}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Settings2 className="size-3.5" />
                      {p.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {p.isActive ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                      {p.isSandbox && p.isActive && (
                        <Badge variant="outline" className="text-amber-600">Sandbox</Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {p.fields.map((field) => (
                    <div key={field} className="space-y-1">
                      <Label className="text-xs capitalize">{field.replace(/([A-Z])/g, " $1").trim()}</Label>
                      <Input
                        type={field.toLowerCase().includes("key") || field.toLowerCase().includes("secret") || field.toLowerCase().includes("password") ? "password" : "text"}
                        value={editValues[p.provider]?.[field] || ""}
                        onChange={(e) => setField(p.provider, field, e.target.value)}
                        placeholder={`Enter ${field}`}
                        className="text-xs"
                      />
                    </div>
                  ))}

                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={p.isSandbox}
                        onCheckedChange={(v) => saveProvider(p.provider, p.isActive, v)}
                      />
                      <Label className="text-xs">Sandbox</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={p.isActive}
                        onCheckedChange={(v) => saveProvider(p.provider, v, p.isSandbox)}
                      />
                      <Label className="text-xs">Active</Label>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => saveProvider(p.provider, p.isActive, p.isSandbox)}
                      disabled={saving === p.provider}
                      className={`bg-gradient-to-r ${CATEGORY_COLORS[category]} text-white text-xs`}
                    >
                      {saving === p.provider ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testProvider(p.provider)}
                      disabled={testing === p.provider || !p.id}
                      className="text-xs"
                    >
                      {testing === p.provider ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                      Test
                    </Button>
                    {p.lastTestedAt && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <CheckCircle2 className="size-3 text-emerald-500" />
                        Tested {new Date(p.lastTestedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
