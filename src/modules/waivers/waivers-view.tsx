// WaiversView — main shell for Fee Waivers & Discounts module.
// Emerald→teal gradient header with Islamic 8-point star pattern + 2 tabs
// (Active Waivers / Statistics). RTL-aware via useApp().dir().
"use client";
import { useApp } from "@/store/app-store";
import { Gift } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WaiversListTab } from "./waivers-list-tab";
import { WaiversStatsTab } from "./waivers-stats-tab";

const ISLAMIC_PATTERN: React.CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='white' stroke-width='1'><polygon points='20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14'/></g></svg>\")",
  backgroundSize: "40px 40px",
  backgroundRepeat: "repeat",
};

export function WaiversView() {
  const { t, dir } = useApp();

  return (
    <div dir={dir()} className="space-y-6">
      {/* Header — emerald→teal gradient tile with Islamic 8-point star pattern */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/20 ring-1 ring-white/30">
            <div className="pointer-events-none absolute inset-0 opacity-[0.15]" aria-hidden="true" style={ISLAMIC_PATTERN} />
            <Gift className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("waivers.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("waivers.subtitle")}</p>
          </div>
        </div>
      </header>

      <Tabs defaultValue="active" dir={dir()} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="active">{t("waivers.active")}</TabsTrigger>
          <TabsTrigger value="stats">{t("waivers.statistics")}</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          <WaiversListTab />
        </TabsContent>
        <TabsContent value="stats" className="mt-4">
          <WaiversStatsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
