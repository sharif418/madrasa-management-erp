// QuranLogView — main shell with header + 2 tabs (Logs / Statistics).
// Emerald→teal gradient header with Islamic 8-point star pattern.
"use client";
import { useApp } from "@/store/app-store";
import { BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuranLogLogsTab } from "./quranlog-logs-tab";
import { QuranLogStatsTab } from "./quranlog-stats-tab";

const ISLAMIC_PATTERN: React.CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='white' stroke-width='1'><polygon points='20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14'/></g></svg>\")",
  backgroundSize: "40px 40px",
  backgroundRepeat: "repeat",
};

export function QuranLogView() {
  const { t, dir } = useApp();

  return (
    <div dir={dir()} className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/20 ring-1 ring-white/30">
            <div className="pointer-events-none absolute inset-0 opacity-[0.15]" aria-hidden="true" style={ISLAMIC_PATTERN} />
            <BookOpen className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("quranlog.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("quranlog.subtitle")}</p>
          </div>
        </div>
      </header>

      <Tabs defaultValue="logs" dir={dir()} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="logs">{t("quranlog.logs")}</TabsTrigger>
          <TabsTrigger value="stats">{t("quranlog.statistics")}</TabsTrigger>
        </TabsList>
        <TabsContent value="logs" className="mt-4">
          <QuranLogLogsTab />
        </TabsContent>
        <TabsContent value="stats" className="mt-4">
          <QuranLogStatsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
