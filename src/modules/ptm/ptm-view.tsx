// PtmView — main shell for Parent-Teacher Meetings module.
// Cyan→blue gradient header with Islamic 8-point star pattern + 2 tabs
// (Upcoming / History). RTL-aware via useApp().dir().
"use client";
import { useApp } from "@/store/app-store";
import { CalendarCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PtmUpcomingTab } from "./ptm-upcoming-tab";
import { PtmHistoryTab } from "./ptm-history-tab";
import { ISLAMIC_PATTERN } from "./ptm-types";

export function PtmView() {
  const { t, dir } = useApp();

  return (
    <div dir={dir()} className="space-y-6">
      {/* Header — cyan→blue gradient tile with Islamic 8-point star pattern */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-600/20 ring-1 ring-white/30">
            <div className="pointer-events-none absolute inset-0 opacity-[0.15]" aria-hidden="true" style={ISLAMIC_PATTERN} />
            <CalendarCheck className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("ptm.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("ptm.subtitle")}</p>
          </div>
        </div>
      </header>

      <Tabs defaultValue="upcoming" dir={dir()} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upcoming">{t("ptm.upcoming")}</TabsTrigger>
          <TabsTrigger value="history">{t("ptm.history")}</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4">
          <PtmUpcomingTab />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <PtmHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
