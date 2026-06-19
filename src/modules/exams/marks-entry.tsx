"use client";
// MarksEntry — Manage Marks dialog. Table: students × subjects, add-subject column,
// auto-grade, bulk save via POST /api/exams/[id]/results
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Loader2, Plus, Save, Trash2, ClipboardList } from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { gradeFor, GRADE_TINT, gradeLabelKey, type ExamListItem } from "./exams-types";

type Student = { id: string; name: string; rollNo: string | null };
type ExistingResult = { studentId: string; subject: string; marks: number; total: number; remarks?: string | null };
type CellMap = Record<string, Record<string, { marks: string; total: string }>>;

export function MarksEntry({
  exam, open, onOpenChange, onSaved,
}: {
  exam: ExamListItem | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
}) {
  const { t, dir } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [subjects, setSubjects] = React.useState<string[]>([]);
  const [marks, setMarks] = React.useState<CellMap>({});
  const [newSubject, setNewSubject] = React.useState("");

  // Load students (filtered by exam.classId if set, else all tenant students) + existing results
  React.useEffect(() => {
    if (!open || !exam) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        // Students
        const sParams = new URLSearchParams({ limit: "200" });
        if (exam.classId) sParams.set("classId", exam.classId);
        const sr = await fetch(`/api/students?${sParams.toString()}`, { cache: "no-store" });
        const sj = await sr.json();
        const list: Student[] = sj?.ok ? (sj.data.items ?? []).map((s: { id: string; name: string; rollNo: string | null }) => ({
          id: s.id, name: s.name, rollNo: s.rollNo,
        })) : [];

        // Existing results
        const rr = await fetch(`/api/exams/${exam.id}/results`, { cache: "no-store" });
        const rj = await rr.json();
        const existing: ExistingResult[] = rj?.ok ? (rj.data.items ?? []) : [];

        // Unique subject columns (preserve insertion order from existing results)
        const subjSet: string[] = [];
        for (const r of existing) if (!subjSet.includes(r.subject)) subjSet.push(r.subject);

        // Build cell map
        const map: CellMap = {};
        for (const s of list) {
          map[s.id] = {};
          for (const sub of subjSet) map[s.id][sub] = { marks: "", total: "100" };
        }
        for (const r of existing) {
          if (!map[r.studentId]) map[r.studentId] = {};
          if (!subjSet.includes(r.subject)) {
            subjSet.push(r.subject);
            for (const s of list) if (!map[s.id][r.subject]) map[s.id][r.subject] = { marks: "", total: "100" };
          }
          map[r.studentId][r.subject] = {
            marks: String(r.marks ?? ""),
            total: String(r.total ?? "100"),
          };
        }

        if (!alive) return;
        setStudents(list);
        setSubjects(subjSet);
        setMarks(map);
        setNewSubject("");
      } catch {
        if (alive) toast({ title: t("exams.saveFailed"), variant: "destructive" });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [open, exam, t, toast]);

  const addSubject = () => {
    const sub = newSubject.trim();
    if (!sub) return;
    if (subjects.includes(sub)) {
      toast({ title: t("exams.subject"), description: sub, variant: "destructive" });
      return;
    }
    setSubjects((prev) => [...prev, sub]);
    setMarks((prev) => {
      const next = { ...prev };
      for (const s of students) {
        if (!next[s.id]) next[s.id] = {};
        next[s.id][sub] = { marks: "", total: "100" };
      }
      return next;
    });
    setNewSubject("");
  };

  const removeSubject = (sub: string) => {
    setSubjects((prev) => prev.filter((s) => s !== sub));
    setMarks((prev) => {
      const next = { ...prev };
      for (const sid of Object.keys(next)) if (next[sid][sub]) delete next[sid][sub];
      return next;
    });
  };

  const setCell = (studentId: string, subject: string, field: "marks" | "total", value: string) => {
    setMarks((prev) => {
      const next = { ...prev };
      if (!next[studentId]) next[studentId] = {};
      next[studentId][subject] = { ...next[studentId][subject], [field]: value };
      return next;
    });
  };

  const gradeForCell = (studentId: string, subject: string) => {
    const cell = marks[studentId]?.[subject];
    if (!cell || cell.marks === "") return null;
    const m = Number(cell.marks);
    const tot = Number(cell.total) || 100;
    if (!Number.isFinite(m)) return null;
    return gradeFor(tot > 0 ? (m / tot) * 100 : 0);
  };

  const save = async () => {
    if (!exam) return;
    setSaving(true);
    try {
      const results: { studentId: string; subject: string; marks: number; total: number; grade: string; remarks: string | null }[] = [];
      for (const s of students) {
        for (const sub of subjects) {
          const cell = marks[s.id]?.[sub];
          if (!cell || cell.marks === "") continue;
          const m = Number(cell.marks);
          const tot = Number(cell.total) || 100;
          if (!Number.isFinite(m)) continue;
          const pct = tot > 0 ? (m / tot) * 100 : 0;
          results.push({ studentId: s.id, subject: sub, marks: m, total: tot, grade: gradeFor(pct), remarks: null });
        }
      }
      if (results.length === 0) {
        toast({ title: t("exams.saveFailed"), description: t("exams.noResults"), variant: "destructive" });
        setSaving(false);
        return;
      }
      const r = await fetch(`/api/exams/${exam.id}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Save failed");
      toast({ title: t("exams.saved") });
      onOpenChange(false);
      onSaved();
    } catch {
      toast({ title: t("exams.saveFailed"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="size-5 text-emerald-600" />
            {t("exams.marksEntry")} — {exam?.name}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> {t("common.loading")}
          </div>
        ) : students.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t("exams.emptyDesc")}
          </div>
        ) : (
          <div className="space-y-3" dir={dir()}>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubject(); } }}
                placeholder={t("exams.subject")}
                className="max-w-48"
              />
              <Button onClick={addSubject} variant="outline" size="sm">
                <Plus className="size-4" /> {t("exams.addSubject")}
              </Button>
              <span className="text-xs text-muted-foreground">
                {t("exams.students")}: {students.length} · {t("exams.subject")}: {subjects.length}
              </span>
            </div>

            <ScrollArea className="max-h-[55vh] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40 hover:bg-violet-50">
                    <TableHead className="sticky top-0 z-10 min-w-32 bg-inherit">{t("exams.students")}</TableHead>
                    {subjects.map((sub) => (
                      <TableHead key={sub} className="sticky top-0 z-10 min-w-40 bg-inherit text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-medium">{sub}</span>
                          <button
                            type="button"
                            onClick={() => removeSubject(sub)}
                            className="text-muted-foreground hover:text-rose-600"
                            aria-label="remove"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium leading-tight">{s.name}</span>
                          {s.rollNo && <span className="text-xs text-muted-foreground">{s.rollNo}</span>}
                        </div>
                      </TableCell>
                      {subjects.map((sub) => {
                        const g = gradeForCell(s.id, sub);
                        return (
                          <TableCell key={sub} className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  value={marks[s.id]?.[sub]?.marks ?? ""}
                                  onChange={(e) => setCell(s.id, sub, "marks", e.target.value)}
                                  className="h-8 w-16 text-center"
                                  placeholder="—"
                                  min={0}
                                />
                                <span className="text-xs text-muted-foreground">/</span>
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  value={marks[s.id]?.[sub]?.total ?? "100"}
                                  onChange={(e) => setCell(s.id, sub, "total", e.target.value)}
                                  className="h-8 w-14 text-center"
                                  min={1}
                                />
                              </div>
                              {g && (
                                <Badge variant="outline" className={cn("px-1.5 py-0 text-[10px]", GRADE_TINT[g])}>
                                  {t(gradeLabelKey(g))}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button onClick={save} disabled={saving || loading || students.length === 0} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {t("exams.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
