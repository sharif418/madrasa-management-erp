"use client";
// ExamsView — top-level shell with three tabs: Exams (list + create), Report Cards, Tabulation.
import * as React from "react";
import { GraduationCap, FileText, Table2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useApp } from "@/store/app-store";
import { ExamsList } from "./exams-list";
import { ExamForm } from "./exam-form";
import { MarksEntry } from "./marks-entry";
import { ReportCardView } from "./report-card-view";
import { TabulationTab } from "./tabulation-tab";
import type { ExamListItem, ClassOption } from "./exams-types";

export function ExamsView() {
  const { t, dir } = useApp();
  const [tab, setTab] = React.useState<"exams" | "reports" | "tabulation">("exams");

  // Exams list state
  const [exams, setExams] = React.useState<ExamListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [classes, setClasses] = React.useState<ClassOption[]>([]);
  const [classFilter, setClassFilter] = React.useState<string>("all");
  const [termFilter, setTermFilter] = React.useState<string>("all");

  // Dialog state
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ExamListItem | null>(null);
  const [marksExam, setMarksExam] = React.useState<ExamListItem | null>(null);

  // Load exams list (re-fetch when filters change)
  const loadExams = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (classFilter !== "all") params.set("classId", classFilter);
      if (termFilter !== "all") params.set("term", termFilter);
      const r = await fetch(`/api/exams?${params.toString()}`, { cache: "no-store" });
      const j = await r.json();
      setExams(j?.ok ? (j.data.items as ExamListItem[]) : []);
    } catch {
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, [classFilter, termFilter]);

  // Load classes (once on mount) for filter + form dropdowns
  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/academic/classes?limit=100", { cache: "no-store" });
        const j = await r.json();
        setClasses(j?.ok ? (j.data.items as ClassOption[]).map((c) => ({ id: c.id, name: c.name })) : []);
      } catch {
        setClasses([]);
      }
    })();
  }, []);

  React.useEffect(() => { loadExams(); }, [loadExams]);

  const onAdd = () => { setEditing(null); setFormOpen(true); };
  const onEdit = (e: ExamListItem) => { setEditing(e); setFormOpen(true); };

  return (
    <div className="space-y-6" dir={dir()}>
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-600/20 ring-1 ring-white/30">
            {/* Islamic 8-point star tessellation overlay */}
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
            <GraduationCap className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("exams.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("exams.subtitle")}</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "exams" | "reports" | "tabulation")}>
        <TabsList className="flex w-fit">
          <TabsTrigger value="exams" className="gap-1.5">
            <GraduationCap className="size-4" /> {t("exams.title")}
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5">
            <FileText className="size-4" /> {t("exams.reportCards")}
          </TabsTrigger>
          <TabsTrigger value="tabulation" className="gap-1.5">
            <Table2 className="size-4" /> {t("exams.tabulation")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="focus-visible:outline-none">
          <ExamsList
            exams={exams}
            loading={loading}
            classes={classes}
            classFilter={classFilter}
            termFilter={termFilter}
            onClassChange={setClassFilter}
            onTermChange={setTermFilter}
            onAdd={onAdd}
            onEdit={onEdit}
            onManageMarks={(e) => setMarksExam(e)}
            onViewReport={(e) => { setTab("reports"); /* pre-select handled by ReportCards via exams prop */ void e; }}
            onDeleted={loadExams}
          />
        </TabsContent>

        <TabsContent value="reports" className="focus-visible:outline-none">
          <ReportCardView exams={exams} />
        </TabsContent>

        <TabsContent value="tabulation" className="focus-visible:outline-none">
          <TabulationTab exams={exams} />
        </TabsContent>
      </Tabs>

      {/* Add/Edit dialog */}
      <ExamForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        classes={classes}
        onSaved={loadExams}
      />

      {/* Marks entry dialog */}
      <MarksEntry
        exam={marksExam}
        open={!!marksExam}
        onOpenChange={(o) => !o && setMarksExam(null)}
        onSaved={loadExams}
      />
    </div>
  );
}
