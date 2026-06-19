"use client";
// SettingsModulesTab — feature toggle UI for enabling/disabling modules per tenant
import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/store/app-store";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  LayoutDashboard, Users, Settings as SettingsIcon, History, GraduationCap,
  BookOpen, CalendarClock, BookMarked, ClipboardList, FileText, Sparkles,
  Building2, UtensilsCrossed, Bus, HeartPulse, Banknote, Wallet, Receipt,
  Heart, Bell, CalendarDays, MessageSquare, UserPlus, Award, Library,
  Package, FileBarChart, Bot, Lock,
} from "lucide-react";

type Feature = {
  module: string;
  enabled: boolean;
  isCore: boolean;
  category: string;
};

const MODULE_ICONS: Record<string, typeof Users> = {
  dashboard: LayoutDashboard, students: Users, settings: SettingsIcon, audit: History,
  teachers: GraduationCap, academic: BookOpen, timetable: CalendarClock,
  hifz: BookMarked, attendance: ClipboardList, exams: FileText, muhasaba: Sparkles,
  hostel: Building2, mess: UtensilsCrossed, transport: Bus, health: HeartPulse,
  finance: Banknote, wallet: Wallet, fees: Receipt, donors: Heart,
  notices: Bell, calendar: CalendarDays, feedback: MessageSquare,
  admission: UserPlus, alumni: Award, library: Library, inventory: Package,
  reports: FileBarChart, ai: Bot,
};

const CATEGORIES = [
  { key: "core", labelKey: "settings.coreModules", color: "from-emerald-500 to-teal-600" },
  { key: "academic", labelKey: "settings.academicModules", color: "from-violet-500 to-purple-600" },
  { key: "residential", labelKey: "settings.residentialModules", color: "from-amber-500 to-orange-600" },
  { key: "financial", labelKey: "settings.financialModules", color: "from-rose-500 to-pink-600" },
  { key: "communication", labelKey: "settings.communicationModules", color: "from-cyan-500 to-blue-600" },
  { key: "system", labelKey: "settings.systemModules", color: "from-slate-500 to-gray-600" },
];

export function SettingsModulesTab() {
  const { t, dir } = useApp();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/settings/features", { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) setFeatures(j.data.features as Feature[]);
    } catch {
      toast.error("Failed to load features");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (module: string, enabled: boolean) => {
    setUpdating(module);
    try {
      const r = await fetch("/api/settings/features", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module, enabled }),
      });
      const j = await r.json();
      if (j?.ok) {
        setFeatures((prev) => prev.map((f) => f.module === module ? { ...f, enabled } : f));
        toast.success(enabled ? t("settings.moduleEnabled") : t("settings.moduleDisabled"));
      } else {
        toast.error(j?.error || "Failed to update");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {CATEGORIES.map((c) => (
          <Skeleton key={c.key} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={dir()}>
      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-4 border border-emerald-200 dark:border-emerald-900">
        <p className="text-sm text-emerald-800 dark:text-emerald-300">
          {t("settings.modulesDesc")}
        </p>
      </div>

      {CATEGORIES.map((cat) => {
        const catFeatures = features.filter((f) => f.category === cat.key);
        if (catFeatures.length === 0) return null;
        return (
          <div key={cat.key}>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              {t(cat.labelKey)}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {catFeatures.map((f) => {
                const Icon = MODULE_ICONS[f.module] || Package;
                const isUpdating = updating === f.module;
                return (
                  <Card
                    key={f.module}
                    className={`relative overflow-hidden transition-all ${
                      f.enabled ? "opacity-100" : "opacity-60"
                    } hover:shadow-md`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`grid size-10 place-items-center rounded-xl bg-gradient-to-br ${cat.color} text-white shadow-sm`}>
                            <Icon className="size-5" />
                          </div>
                          <div>
                            <p className="font-medium text-sm flex items-center gap-1.5">
                              {t(`nav.${f.module}`) || f.module}
                              {f.isCore && (
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                  <Lock className="size-2.5" /> {t("settings.coreBadge")}
                                </Badge>
                              )}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {f.module}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={f.enabled}
                          disabled={f.isCore || isUpdating}
                          onCheckedChange={(checked) => toggle(f.module, checked)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
