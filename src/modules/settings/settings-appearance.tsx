"use client";
// SettingsAppearanceTab — theme color swatches + session language switcher
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Palette, Languages, Check, GraduationCap, Users, BookOpen } from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { TenantInfo } from "./settings-info";

const THEMES = [
  { id: "emerald", grad: "from-emerald-400 to-teal-600", accent: "bg-emerald-500", label: "settings.themeEmerald" },
  { id: "violet", grad: "from-violet-400 to-purple-600", accent: "bg-violet-500", label: "settings.themeViolet" },
  { id: "rose", grad: "from-rose-400 to-pink-600", accent: "bg-rose-500", label: "settings.themeRose" },
  { id: "amber", grad: "from-amber-400 to-orange-600", accent: "bg-amber-500", label: "settings.themeAmber" },
  { id: "teal", grad: "from-teal-400 to-cyan-600", accent: "bg-teal-500", label: "settings.themeTeal" },
  { id: "cyan", grad: "from-cyan-400 to-sky-600", accent: "bg-cyan-500", label: "settings.themeCyan" },
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

  const activeTheme = THEMES.find((th) => th.id === themeColor) ?? THEMES[0];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Theme swatches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="size-4 text-emerald-600" />
            {t("settings.theme")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("settings.themePreview")}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                    "group relative flex flex-col gap-2 rounded-xl border-2 p-2 transition-all duration-200",
                    active
                      ? "border-foreground/80 ring-2 ring-offset-2 ring-offset-background"
                      : "border-border hover:border-foreground/40 hover:-translate-y-0.5"
                  )}
                  aria-pressed={active}
                  aria-label={t(th.label)}
                >
                  {/* Preview gradient band */}
                  <div className={cn("relative h-12 w-full overflow-hidden rounded-lg bg-gradient-to-br shadow-inner transition-transform group-hover:scale-105", th.grad)}>
                    {/* Soft glow accent */}
                    <div className="pointer-events-none absolute -end-3 -top-3 size-12 rounded-full bg-white/25 blur-md" aria-hidden="true" />
                    {active && (
                      <span className="absolute end-1.5 top-1.5 inline-flex size-5 items-center justify-center rounded-full bg-white text-foreground shadow-sm">
                        <Check className="size-3" />
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-foreground">{t(th.label)}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Live preview card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="size-4 text-emerald-600" />
            {t("settings.livePreview")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border">
            {/* Banner */}
            <div className={cn("relative overflow-hidden bg-gradient-to-br p-4 text-white", activeTheme.grad)}>
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.15]"
                aria-hidden="true"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'><g fill='none' stroke='white' stroke-width='1'><polygon points='15,2 18,10 26,10 20,15 22,23 15,19 8,23 10,15 4,10 12,10'/></g></svg>\")",
                  backgroundSize: "30px 30px",
                  backgroundRepeat: "repeat",
                }}
              />
              <div className="relative">
                <p className="text-xs font-medium uppercase tracking-wide text-white/80">{t(activeTheme.label)}</p>
                <p className="mt-1 text-lg font-bold">Darul Uloom Madrasa</p>
              </div>
            </div>
            {/* Mock stat tiles */}
            <div className="grid grid-cols-3 gap-2 p-3">
              {[
                { icon: GraduationCap, label: "Students", value: "248" },
                { icon: Users, label: "Teachers", value: "18" },
                { icon: BookOpen, label: "Hifz 30d", value: "57" },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="rounded-lg border bg-card p-2.5">
                    <div className={cn("mb-1.5 grid size-6 place-items-center rounded text-white", activeTheme.accent)}>
                      <Icon className="size-3.5" />
                    </div>
                    <div className="text-base font-bold tabular-nums">{s.value}</div>
                    <div className="text-[10px] text-muted-foreground">{s.label}</div>
                  </div>
                );
              })}
            </div>
            {/* Mock button */}
            <div className="flex items-center gap-2 border-t p-3">
              <span className={cn("inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-white bg-gradient-to-r", activeTheme.grad)}>
                {t("settings.applyTheme")}
              </span>
              <span className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground">
                {t("common.cancel")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session language */}
      <Card className="lg:col-span-2">
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
