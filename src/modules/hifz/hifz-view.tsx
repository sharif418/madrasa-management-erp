"use client";
// HifzView — top-level shell for the Hifz Tracking module
// Two tabs: Records (list) and Progress (per-student analytics)
import * as React from "react";
import { BookOpen, BarChart3, Plus, ScrollText } from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { HifzRecordsTable } from "./hifz-records-table";
import { HifzProgress } from "./hifz-progress";
import { HifzForm } from "./hifz-form";
import { SurahTrackerTab } from "./surah-tracker-tab";
import type { StudentOption } from "./hifz-types";

export function HifzView() {
  const { t, dir } = useApp();
  const { toast } = useToast();
  const [tab, setTab] = React.useState<"records" | "progress" | "surah">("records");
  const [students, setStudents] = React.useState<StudentOption[]>([]);
  const [studentsLoading, setStudentsLoading] = React.useState(true);
  const [formOpen, setFormOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Load students list (for selects in form/records/progress)
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/students?limit=100");
        const json = await res.json();
        if (cancelled) return;
        if (!json.ok) throw new Error(json.error);
        const items: StudentOption[] = (json.data.items ?? []).map((s: { id: string; name: string; nameArabic: string | null; rollNo: string | null }) => ({
          id: s.id, name: s.name, nameArabic: s.nameArabic, rollNo: s.rollNo,
        }));
        setStudents(items);
      } catch {
        if (!cancelled) toast({ title: t("hifz.error"), variant: "destructive" });
      } finally {
        if (!cancelled) setStudentsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [t, toast]);

  const refresh = React.useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <div className="space-y-6" dir={dir()}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-700/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center ring-1 ring-emerald-600/20">
            <BookOpen className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("hifz.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("landing.hifz.desc")}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          className="self-start bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-900/20 transition-all hover:from-emerald-600 hover:to-emerald-800 hover:shadow-lg hover:-translate-y-0.5 sm:self-auto"
        >
          <Plus className="size-4" /> {t("hifz.add")}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "records" | "progress" | "surah")}>
        <TabsList>
          <TabsTrigger value="records">
            <BookOpen className="size-4" /> {t("hifz.recordsTab")}
          </TabsTrigger>
          <TabsTrigger value="progress">
            <BarChart3 className="size-4" /> {t("hifz.progressTab")}
          </TabsTrigger>
          <TabsTrigger value="surah">
            <ScrollText className="size-4" /> {t("hifz.surahTracker")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="mt-4">
          {studentsLoading ? (
            <Skeleton className="h-96 rounded-xl" />
          ) : students.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
              <BookOpen className="size-10 mx-auto mb-3 opacity-40" />
              <p>{t("hifz.noRecords")}</p>
            </div>
          ) : (
            <HifzRecordsTable
              students={students}
              onAddClick={() => setFormOpen(true)}
              refreshKey={refreshKey}
            />
          )}
        </TabsContent>

        <TabsContent value="progress" className="mt-4">
          {studentsLoading ? (
            <Skeleton className="h-96 rounded-xl" />
          ) : students.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
              <BarChart3 className="size-10 mx-auto mb-3 opacity-40" />
              <p>{t("hifz.noProgress")}</p>
            </div>
          ) : (
            <HifzProgress students={students} refreshKey={refreshKey} />
          )}
        </TabsContent>

        <TabsContent value="surah" className="mt-4">
          {studentsLoading ? (
            <Skeleton className="h-96 rounded-xl" />
          ) : students.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
              <ScrollText className="size-10 mx-auto mb-3 opacity-40" />
              <p>{t("hifz.selectStudentFirst")}</p>
            </div>
          ) : (
            <SurahTrackerTab students={students} />
          )}
        </TabsContent>
      </Tabs>

      {/* Add Record dialog (shared) */}
      <HifzForm
        open={formOpen}
        onOpenChange={setFormOpen}
        students={students}
        onCreated={refresh}
      />
    </div>
  );
}
