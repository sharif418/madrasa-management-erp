"use client";
// HifzView — top-level shell for the Hifz Tracking module
// Two tabs: Records (list) and Progress (per-student analytics)
import * as React from "react";
import { BookOpen, BarChart3, Plus } from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { HifzRecordsTable } from "./hifz-records-table";
import { HifzProgress } from "./hifz-progress";
import { HifzForm } from "./hifz-form";
import type { StudentOption } from "./hifz-types";

export function HifzView() {
  const { t, dir } = useApp();
  const { toast } = useToast();
  const [tab, setTab] = React.useState<"records" | "progress">("records");
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <BookOpen className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("hifz.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("landing.hifz.desc")}
            </p>
          </div>
        </div>
        <Button onClick={() => setFormOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 self-start sm:self-auto">
          <Plus className="size-4" /> {t("hifz.add")}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "records" | "progress")}>
        <TabsList>
          <TabsTrigger value="records">
            <BookOpen className="size-4" /> {t("hifz.recordsTab")}
          </TabsTrigger>
          <TabsTrigger value="progress">
            <BarChart3 className="size-4" /> {t("hifz.progressTab")}
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
