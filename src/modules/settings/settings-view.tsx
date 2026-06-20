"use client";
// SettingsView — top-level shell for the Settings module
// Tabs: Madrasa Info | Appearance | Roles
import * as React from "react";
import { Settings, Building2, Palette, ShieldCheck, Blocks, Plug } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsInfoTab, type TenantInfo } from "./settings-info";
import { SettingsAppearanceTab } from "./settings-appearance";
import { SettingsRolesTab } from "./settings-roles";
import { SettingsModulesTab } from "./settings-modules";
import { SettingsIntegrationsTab } from "./settings-integrations-tab";

export function SettingsView() {
  const { t, dir } = useApp();
  const [info, setInfo] = React.useState<TenantInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState<"info" | "appearance" | "roles" | "modules" | "integrations">("info");

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/settings", { cache: "no-store" });
        const j = await r.json();
        if (alive && j?.ok) setInfo(j.data as TenantInfo);
      } catch {
        /* ignore */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="space-y-6" dir={dir()}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/20 ring-1 ring-white/30">
            {/* Islamic geometric pattern overlay */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.15]"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='white' stroke-width='1'><polygon points='20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14'/></g></svg>\")",
                backgroundSize: "40px 40px",
                backgroundRepeat: "repeat",
              }}
            />
            <Settings className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("settings.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
          </div>
        </div>
        {info && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">{info.plan}</Badge>
            <Badge variant="outline" className="capitalize bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {info.status}
            </Badge>
          </div>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : !info ? (
        <Card className="border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          ⚠️ Failed to load settings
        </Card>
      ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="info">
              <Building2 className="size-4" /> {t("settings.info")}
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="size-4" /> {t("settings.appearance")}
            </TabsTrigger>
            <TabsTrigger value="modules">
              <Blocks className="size-4" /> {t("settings.modules")}
            </TabsTrigger>
            <TabsTrigger value="integrations">
              <Plug className="size-4" /> {t("settings.integrations")}
            </TabsTrigger>
            <TabsTrigger value="roles">
              <ShieldCheck className="size-4" /> {t("settings.roles")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            <SettingsInfoTab info={info} onSaved={setInfo} />
          </TabsContent>
          <TabsContent value="appearance" className="mt-4">
            <SettingsAppearanceTab info={info} onSaved={setInfo} />
          </TabsContent>
          <TabsContent value="modules" className="mt-4">
            <SettingsModulesTab />
          </TabsContent>
          <TabsContent value="integrations" className="mt-4">
            <SettingsIntegrationsTab />
          </TabsContent>
          <TabsContent value="roles" className="mt-4">
            <SettingsRolesTab />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
