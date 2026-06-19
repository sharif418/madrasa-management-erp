"use client";
// SettingsAppearanceTab — theme color swatches + session language switcher
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Palette, Languages, Check } from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { TenantInfo } from "./settings-info";

const THEMES = [
  { id: "emerald", cls: "bg-emerald-500", label: "settings.themeEmerald" },
  { id: "violet", cls: "bg-violet-500", label: "settings.themeViolet" },
  { id: "rose", cls: "bg-rose-500", label: "settings.themeRose" },
  { id: "amber", cls: "bg-amber-500", label: "settings.themeAmber" },
  { id: "teal", cls: "bg-teal-500", label: "settings.themeTeal" },
  { id: "cyan", cls: "bg-cyan-500", label: "settings.themeCyan" },
] as const;

export function SettingsAppearanceTab({
  info,
  onSaved,
}: {
  info: TenantInfo | null;
  onSaved: (t: TenantInfo) => void;
}) {
  const { t, locale, setLocale, themeColor, setThemeColor } = useApp();
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);

  // Sync theme color from tenant info on first load
  React.useEffect(() => {
    if (info?.theme && info.theme !== themeColor) {
      setThemeColor(info.theme);
    }
  }, [info?.theme, themeColor, setThemeColor]);

  const saveTheme = async (newTheme: string) => {
    setSaving(true);
    try {
      const r = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: newTheme }),
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="size-4 text-emerald-600" />
            {t("settings.theme")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("settings.theme")} — preview &amp; apply</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {THEMES.map((th) => {
              const active = themeColor === th.id;
              return (
                <button
                  key={th.id}
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setThemeColor(th.id);
                    saveTheme(th.id);
                  }}
                  className={cn(
                    "group relative flex h-16 flex-col items-center justify-center gap-1 rounded-xl border-2 transition-all",
                    active ? "border-foreground/80 ring-2 ring-offset-2 ring-offset-background" : "border-border hover:border-foreground/40"
                  )}
                  aria-pressed={active}
                  aria-label={t(th.label)}
                >
                  <span className={cn("size-8 rounded-full shadow-inner", th.cls)} />
                  <span className="text-[10px] font-medium text-muted-foreground">{t(th.label)}</span>
                  {active && (
                    <span className="absolute end-1 top-1 inline-flex size-4 items-center justify-center rounded-full bg-foreground text-background">
                      <Check className="size-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Languages className="size-4 text-emerald-600" />
            {t("settings.sessionLang")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("settings.sessionLang")} — {t("settings.language")}
          </p>
          <div className="max-w-xs">
            <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              {t("settings.sessionLang")}
            </Label>
            <Select
              value={locale}
              onValueChange={(v) => setLocale(v as "bn" | "en" | "ar")}
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
        </CardContent>
      </Card>
    </div>
  );
}
