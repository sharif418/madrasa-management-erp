"use client";
// ThemeCustomizer — palette presets + custom 3-color picker + live preview
// Theme value formats stored in tenant.theme:
//   - Preset key: "emerald" | "violet" | "rose" | "amber" | "teal" | "cyan"
//                 | "emeraldIslamic" | "royalViolet" | "sunsetAmber" | "oceanTeal" | "roseGarden"
//   - Custom: "custom:#hex,#hex,#hex"
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Check, Save, Pipette, GraduationCap, Users, BookOpen, LayoutDashboard, type LucideIcon } from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { TenantInfo } from "./settings-info";

// Single-color themes (backward compat) — each maps to a 3-color hex palette for preview
const SINGLE_THEMES: { id: string; label: string; hex: string; tailwind: string }[] = [
  { id: "emerald", label: "settings.themeEmerald", hex: "#10b981", tailwind: "from-emerald-400 to-teal-600" },
  { id: "violet",  label: "settings.themeViolet",  hex: "#8b5cf6", tailwind: "from-violet-400 to-purple-600" },
  { id: "rose",    label: "settings.themeRose",    hex: "#f43f5e", tailwind: "from-rose-400 to-pink-600" },
  { id: "amber",   label: "settings.themeAmber",   hex: "#f59e0b", tailwind: "from-amber-400 to-orange-600" },
  { id: "teal",    label: "settings.themeTeal",    hex: "#14b8a6", tailwind: "from-teal-400 to-cyan-600" },
  { id: "cyan",    label: "settings.themeCyan",    hex: "#06b6d4", tailwind: "from-cyan-400 to-sky-600" },
];

// Full palette presets (3-color combos)
const PALETTES: { id: string; label: string; colors: [string, string, string] }[] = [
  { id: "emeraldIslamic", label: "settings.emeraldIslamic", colors: ["#10b981", "#14b8a6", "#06b6d4"] },
  { id: "royalViolet",    label: "settings.royalViolet",    colors: ["#8b5cf6", "#a855f7", "#d946ef"] },
  { id: "sunsetAmber",    label: "settings.sunsetAmber",    colors: ["#f59e0b", "#f97316", "#f43f5e"] },
  { id: "oceanTeal",      label: "settings.oceanTeal",      colors: ["#14b8a6", "#06b6d4", "#0ea5e9"] },
  { id: "roseGarden",     label: "settings.roseGarden",     colors: ["#f43f5e", "#ec4899", "#d946ef"] },
];

const ISLAMIC_PATTERN_STYLE: React.CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'><g fill='none' stroke='white' stroke-width='1'><polygon points='15,2 18,10 26,10 20,15 22,23 15,19 8,23 10,15 4,10 12,10'/></g></svg>\")",
  backgroundSize: "30px 30px",
  backgroundRepeat: "repeat",
};

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// Resolve any theme string → 3 hex colors (for live preview using inline styles)
export function resolveThemeColors(theme: string): [string, string, string] {
  if (theme.startsWith("custom:")) {
    const cs = theme.slice(7).split(",");
    if (cs.length === 3 && cs.every((c) => HEX_RE.test(c))) {
      return [cs[0], cs[1], cs[2]];
    }
  }
  const p = PALETTES.find((x) => x.id === theme);
  if (p) return p.colors;
  const s = SINGLE_THEMES.find((x) => x.id === theme);
  if (s) return [s.hex, s.hex, s.hex];
  return PALETTES[0].colors; // default Emerald Islamic
}

function isCustom(theme: string): boolean {
  return theme.startsWith("custom:");
}

export function ThemeCustomizer({
  info,
  onSaved,
}: {
  info: TenantInfo | null;
  onSaved: (t: TenantInfo) => void;
}) {
  const { t, themeColor, setThemeColor } = useApp();
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);

  // Local "draft" theme — synced from tenant info on first load
  const [draft, setDraft] = React.useState<string>(info?.theme || "emeraldIslamic");

  React.useEffect(() => {
    if (info?.theme) {
      setDraft(info.theme);
      setThemeColor(info.theme);
      setDirty(false);
    }
  }, [info?.theme, setThemeColor]);

  // Custom color inputs (synced when draft is custom)
  const initialCustom: [string, string, string] = isCustom(draft)
    ? resolveThemeColors(draft)
    : ["#10b981", "#14b8a6", "#06b6d4"];
  const [customColors, setCustomColors] = React.useState<[string, string, string]>(initialCustom);

  React.useEffect(() => {
    if (isCustom(draft)) setCustomColors(resolveThemeColors(draft));
  }, [draft]);

  const colors = resolveThemeColors(draft);
  const grad = `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`;
  const accent = colors[0];

  const pickPreset = (id: string) => {
    setDraft(id);
    setDirty(id !== info?.theme);
  };

  const pickCustom = (idx: number, hex: string) => {
    const next: [string, string, string] = [...customColors];
    next[idx] = hex;
    setCustomColors(next);
    const valid = next.every((c) => HEX_RE.test(c));
    if (valid) {
      const val = `custom:${next.join(",")}`;
      setDraft(val);
      setDirty(val !== info?.theme);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      setThemeColor(draft);
      const r = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: draft }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Save failed");
      toast({ title: t("settings.saveSuccess") });
      onSaved(j.data as TenantInfo);
      setDirty(false);
    } catch {
      toast({ title: t("settings.saveFailed"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Palette presets */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="size-4 text-emerald-600" />
            {t("settings.themePresets")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {PALETTES.map((p) => {
              const active = draft === p.id;
              const gradP = `linear-gradient(135deg, ${p.colors[0]}, ${p.colors[1]}, ${p.colors[2]})`;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={saving}
                  onClick={() => pickPreset(p.id)}
                  className={cn(
                    "group relative flex flex-col gap-2 rounded-xl border-2 p-2 transition-all duration-200",
                    active
                      ? "border-foreground/80 ring-2 ring-offset-2 ring-offset-background"
                      : "border-border hover:border-foreground/40 hover:-translate-y-0.5"
                  )}
                  aria-pressed={active}
                  aria-label={t(p.label)}
                >
                  <div className="relative h-14 w-full overflow-hidden rounded-lg shadow-inner transition-transform group-hover:scale-105" style={{ background: gradP }}>
                    <div className="pointer-events-none absolute -end-3 -top-3 size-12 rounded-full bg-white/25 blur-md" aria-hidden="true" />
                    {active && (
                      <span className="absolute end-1.5 top-1.5 inline-flex size-5 items-center justify-center rounded-full bg-white text-foreground shadow-sm">
                        <Check className="size-3" />
                      </span>
                    )}
                    {/* 3-stop color dots */}
                    <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
                      {p.colors.map((c) => (
                        <span key={c} className="size-2.5 rounded-full border border-white/60 shadow" style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-foreground">{t(p.label)}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Single-color swatches (backward compat) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="size-4 text-emerald-600" />
            {t("settings.theme")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {SINGLE_THEMES.map((th) => {
              const active = draft === th.id;
              return (
                <button
                  key={th.id}
                  type="button"
                  disabled={saving}
                  onClick={() => pickPreset(th.id)}
                  className={cn(
                    "group relative flex flex-col gap-2 rounded-xl border-2 p-2 transition-all duration-200",
                    active
                      ? "border-foreground/80 ring-2 ring-offset-2 ring-offset-background"
                      : "border-border hover:border-foreground/40 hover:-translate-y-0.5"
                  )}
                  aria-pressed={active}
                  aria-label={t(th.label)}
                >
                  <div className={cn("relative h-12 w-full overflow-hidden rounded-lg bg-gradient-to-br shadow-inner transition-transform group-hover:scale-105", th.tailwind)}>
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

      {/* Custom color picker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Pipette className="size-4 text-emerald-600" />
            {t("settings.customColor")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("settings.themePreview")}</p>
          <div className="grid grid-cols-3 gap-3">
            {customColors.map((c, i) => (
              <div key={i} className="space-y-1.5">
                <Label className="text-[11px] font-medium text-muted-foreground">
                  {t("settings.hexCode")} {i + 1}
                </Label>
                <div className="relative">
                  <input
                    type="color"
                    value={c}
                    onChange={(e) => pickCustom(i, e.target.value)}
                    disabled={saving}
                    className="h-10 w-full cursor-pointer rounded-md border border-input bg-background p-1"
                    aria-label={`${t("settings.customColor")} ${i + 1}`}
                  />
                </div>
                <Input
                  value={c.toUpperCase()}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (HEX_RE.test(v)) pickCustom(i, v);
                    else setCustomColors((prev) => {
                      const next = [...prev] as [string, string, string];
                      next[i] = v;
                      return next;
                    });
                  }}
                  disabled={saving}
                  className="h-8 font-mono text-xs"
                  maxLength={7}
                />
              </div>
            ))}
          </div>
          {/* 3-stop gradient preview bar */}
          <div className="relative h-3 w-full overflow-hidden rounded-full" style={{ background: `linear-gradient(90deg, ${customColors[0]}, ${customColors[1]}, ${customColors[2]})` }} />
        </CardContent>
      </Card>

      {/* Live preview */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LayoutDashboard className="size-4 text-emerald-600" />
            {t("settings.livePreview")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-[200px_1fr]">
            {/* Mock sidebar */}
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="relative flex items-center gap-2 p-3 text-white" style={{ background: grad }}>
                <div className="pointer-events-none absolute inset-0 opacity-[0.15]" style={ISLAMIC_PATTERN_STYLE} aria-hidden="true" />
                <div className="relative grid size-8 place-items-center rounded-lg bg-white/20 backdrop-blur">
                  <GraduationCap className="size-4" />
                </div>
                <div className="relative">
                  <p className="text-[11px] font-semibold uppercase tracking-wide opacity-90">Madrasa</p>
                  <p className="text-xs font-bold">ERP</p>
                </div>
              </div>
              <nav className="space-y-1 p-2">
                {[
                  { icon: LayoutDashboard, label: "Dashboard", active: true },
                  { icon: Users, label: "Students" },
                  { icon: BookOpen, label: "Hifz" },
                ].map((item) => {
                  const Icon: LucideIcon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium",
                        item.active ? "text-white" : "text-muted-foreground"
                      )}
                      style={item.active ? { background: accent } : undefined}
                    >
                      <Icon className="size-3.5" />
                      {item.label}
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* Mock dashboard content */}
            <div className="overflow-hidden rounded-xl border">
              {/* Banner */}
              <div className="relative overflow-hidden p-4 text-white" style={{ background: grad }}>
                <div className="pointer-events-none absolute inset-0 opacity-[0.15]" style={ISLAMIC_PATTERN_STYLE} aria-hidden="true" />
                <div className="relative">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-white/80">{t("dashboard.title")}</p>
                  <p className="mt-1 text-lg font-bold">Darul Uloom Madrasa</p>
                  <p className="mt-0.5 text-xs text-white/80">Assalamu Alaikum, Admin</p>
                </div>
              </div>
              {/* Mock stat tiles */}
              <div className="grid grid-cols-3 gap-2 p-3">
                {[
                  { icon: GraduationCap, label: "Students", value: "248" },
                  { icon: Users, label: "Teachers", value: "18" },
                  { icon: BookOpen, label: "Hifz 30d", value: "57" },
                ].map((s) => {
                  const Icon: LucideIcon = s.icon;
                  return (
                    <div key={s.label} className="rounded-lg border bg-card p-2.5">
                      <div className="mb-1.5 grid size-6 place-items-center rounded text-white" style={{ background: accent }}>
                        <Icon className="size-3.5" />
                      </div>
                      <div className="text-base font-bold tabular-nums">{s.value}</div>
                      <div className="text-[10px] text-muted-foreground">{s.label}</div>
                    </div>
                  );
                })}
              </div>
              {/* Buttons + badges */}
              <div className="flex flex-wrap items-center gap-2 border-t p-3">
                <span
                  className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
                  style={{ background: grad }}
                >
                  {t("settings.applyTheme")}
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-white"
                  style={{ background: accent }}
                >
                  <Check className="size-3" /> Active
                </span>
                <span className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground">
                  {t("common.cancel")}
                </span>
              </div>
            </div>
          </div>

          {/* Save bar */}
          <div className="mt-4 flex items-center justify-end gap-2 border-t pt-4">
            {dirty && (
              <span className="me-auto text-xs text-amber-600 dark:text-amber-400">
                Unsaved changes
              </span>
            )}
            <Button
              onClick={save}
              disabled={saving || !dirty}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700"
            >
              <Save className="mr-2 size-4" />
              {t("settings.save")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
