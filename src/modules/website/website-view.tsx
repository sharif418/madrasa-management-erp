// WebsiteView — public website CMS for each madrasa
// Tabs: Live Preview | Settings
"use client";
import { useCallback, useEffect, useState } from "react";
import { Globe, Eye, Settings as SettingsIcon, FileText } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { WebsitePreviewTab } from "./website-preview-tab";
import { WebsiteSettingsTab } from "./website-settings-tab";
import { PagesTab } from "./pages-tab";

export type WebsiteStats = {
  activeStudents: number;
  alumni: number;
  staff: number;
  yearsOfService: number;
  establishedYear: number;
};

export type WebsiteNotice = {
  id: string;
  title: string;
  type: string;
  publishedAt: string;
};

export type WebsiteEvent = {
  id: string;
  title: string;
  type: string;
  location: string | null;
  startDate: string;
};

export type WebsiteTenant = {
  id: string;
  name: string;
  subdomain: string | null;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  language: string;
  theme: string;
  plan: string;
  createdAt: string;
};

export type WebsiteData = {
  tenant: WebsiteTenant;
  stats: WebsiteStats;
  notices: WebsiteNotice[];
  events: WebsiteEvent[];
};

export function WebsiteView() {
  const { t, dir } = useApp();
  const [data, setData] = useState<WebsiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"preview" | "settings" | "pages">("preview");
  // About text is editable live in Settings — applied to preview instantly
  const [aboutText, setAboutText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/website", { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) setData(j.data as WebsiteData);
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

  return (
    <div className="space-y-6" dir={dir()}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/20 ring-1 ring-white/30">
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
            <Globe className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("website.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("website.subtitle")}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : !data ? (
        <Card className="border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          ⚠️ Failed to load website data
        </Card>
      ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="preview">
              <Eye className="size-4" /> {t("website.livePreview")}
            </TabsTrigger>
            <TabsTrigger value="pages">
              <FileText className="size-4" /> {t("website.pages")}
            </TabsTrigger>
            <TabsTrigger value="settings">
              <SettingsIcon className="size-4" /> {t("website.settings")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-4">
            <WebsitePreviewTab data={data} aboutText={aboutText} />
          </TabsContent>
          <TabsContent value="pages" className="mt-4">
            <PagesTab />
          </TabsContent>
          <TabsContent value="settings" className="mt-4">
            <WebsiteSettingsTab
              data={data}
              aboutText={aboutText}
              onAboutTextChange={setAboutText}
              onSaved={(updated) => {
                setData({ ...data, tenant: updated });
                toast.success(t("website.saved"));
              }}
              onNoticePublished={() => {
                toast.success(t("website.published"));
                void load();
              }}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
