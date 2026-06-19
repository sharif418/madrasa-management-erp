// CommunicationsView — multi-channel messaging center
// Tabs: Compose | History
"use client";
import { useCallback, useEffect, useState } from "react";
import { Send, History as HistoryIcon } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ComposeTab } from "./compose-tab";
import {
  HistoryTab,
  type ActivityDay,
  type AudienceBreakdownItem,
  type RecentMessage,
} from "./history-tab";

type CommData = {
  recent: RecentMessage[];
  activity: ActivityDay[];
  audienceBreakdown: AudienceBreakdownItem[];
  reach: { all: number; parents: number; staff: number; students: number };
};

export function CommunicationsView() {
  const { t, dir } = useApp();
  const [data, setData] = useState<CommData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"compose" | "history">("compose");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/communications", { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) setData(j.data as CommData);
      else throw new Error(j?.error || "Failed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function onSent(count: number) {
    if (count < 0) {
      toast.error("Failed to send message");
      return;
    }
    toast.success(t("communications.sent", { count }));
    void load();
  }

  return (
    <div className="space-y-6" dir={dir()}>
      {/* Header — cyan→blue gradient tile with Islamic 8-point star pattern */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-600/20 ring-1 ring-white/30">
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
            <Send className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("communications.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("communications.subtitle")}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : !data ? (
        <Card className="border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40">
          <CardContent className="p-4 text-sm text-rose-700 dark:text-rose-300">
            Failed to load communications data
          </CardContent>
        </Card>
      ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="compose">
              <Send className="size-4" /> {t("communications.compose")}
            </TabsTrigger>
            <TabsTrigger value="history">
              <HistoryIcon className="size-4" /> {t("communications.history")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="mt-4">
            <ComposeTab reach={data.reach} onSent={onSent} />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <HistoryTab
              activity={data.activity}
              audienceBreakdown={data.audienceBreakdown}
              recent={data.recent}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
