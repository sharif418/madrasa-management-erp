// CreateSeatPlan — form for creating a new seat plan.
// Exam selector + class selector + room name + rows × cols + student checkbox list.
// Auto-loads students when class is selected. Submits to POST /api/seatplan.
"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Inbox } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { ExamOption, ClassOption, StudentOption } from "./seatplan-types";

type Props = {
  exams: ExamOption[];
  classes: ClassOption[];
  loading: boolean;
  onCreated: () => void;
};

export function CreateSeatPlan({ exams, classes, loading, onCreated }: Props) {
  const { t } = useApp();
  const [examId, setExamId] = useState("");
  const [classId, setClassId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [rows, setRows] = useState("5");
  const [cols, setCols] = useState("6");
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // When class changes, load students for that class
  const loadStudents = useCallback(async (cid: string) => {
    setStudentsLoading(true);
    setSelected(new Set());
    try {
      const url = new URL("/api/students", window.location.origin);
      url.searchParams.set("limit", "100");
      if (cid) url.searchParams.set("classId", cid);
      const r = await fetch(url.toString(), { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) {
        setStudents(((j.data.items as StudentOption[]) || []).map((s) => ({
          id: s.id, name: s.name, nameArabic: s.nameArabic ?? null, rollNo: s.rollNo ?? null,
        })));
      } else {
        setStudents([]);
      }
    } catch {
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (classId) void loadStudents(classId);
    else { setStudents([]); setSelected(new Set()); }
  }, [classId, loadStudents]);

  const toggleStudent = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === students.length) setSelected(new Set());
    else setSelected(new Set(students.map((s) => s.id)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examId) return toast.error(t("seatplan.selectExam"));
    if (!roomName.trim()) return toast.error(t("seatplan.roomName"));
    const r = parseInt(rows, 10), c = parseInt(cols, 10);
    if (!Number.isFinite(r) || !Number.isFinite(c) || r < 1 || c < 1)
      return toast.error(t("seatplan.rows") + " / " + t("seatplan.cols"));
    if (selected.size === 0) return toast.error(t("seatplan.students"));
    if (selected.size > r * c)
      return toast.error(`${t("seatplan.students")} > ${r * c} (${r}×${c})`);

    setSaving(true);
    try {
      const res = await fetch("/api/seatplan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId, classId: classId || null,
          roomName: roomName.trim(),
          rows: r, cols: c,
          studentIds: [...selected],
        }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Failed");
      toast.success(t("seatplan.create"));
      // Reset
      setRoomName("");
      setSelected(new Set());
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const capacity = (parseInt(rows, 10) || 0) * (parseInt(cols, 10) || 0);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="size-4 text-violet-600" />
          {t("seatplan.create")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Exam selector */}
          <div className="space-y-1.5">
            <Label>{t("seatplan.selectExam")}</Label>
            <Select value={examId} onValueChange={setExamId} disabled={loading}>
              <SelectTrigger><SelectValue placeholder={t("seatplan.selectExam")} /></SelectTrigger>
              <SelectContent>
                {exams.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Class selector */}
          <div className="space-y-1.5">
            <Label>{t("seatplan.selectClass")}</Label>
            <Select value={classId} onValueChange={setClassId} disabled={loading}>
              <SelectTrigger><SelectValue placeholder={t("seatplan.selectClass")} /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Room name */}
          <div className="space-y-1.5">
            <Label htmlFor="room-name">{t("seatplan.roomName")}</Label>
            <Input
              id="room-name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Room 101 / Hall A"
            />
          </div>

          {/* Rows × Cols */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rows">{t("seatplan.rows")}</Label>
              <Input id="rows" type="number" min={1} max={20} value={rows} onChange={(e) => setRows(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cols">{t("seatplan.cols")}</Label>
              <Input id="cols" type="number" min={1} max={20} value={cols} onChange={(e) => setCols(e.target.value)} />
            </div>
          </div>

          {/* Students checkbox list */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>
                {t("seatplan.students")} ({selected.size}/{students.length})
              </Label>
              {students.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs text-violet-600 hover:underline"
                >
                  {selected.size === students.length ? "Clear" : "All"}
                </button>
              )}
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30">
              <ScrollArea className="h-44">
                {studentsLoading ? (
                  <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Loading...
                  </div>
                ) : students.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 p-6 text-sm text-muted-foreground">
                    <Inbox className="size-6 opacity-50" />
                    <span>{classId ? "No students" : t("seatplan.selectClass")}</span>
                  </div>
                ) : (
                  <ul className="divide-y divide-border/40">
                    {students.map((s) => (
                      <li key={s.id}>
                        <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/40">
                          <Checkbox
                            checked={selected.has(s.id)}
                            onCheckedChange={() => toggleStudent(s.id)}
                          />
                          <span className="text-sm flex-1 truncate">{s.name}</span>
                          {s.rollNo && (
                            <span className="text-xs text-muted-foreground tabular-nums">#{s.rollNo}</span>
                          )}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("seatplan.rows")} × {t("seatplan.cols")} = {capacity} {t("seatplan.seatNumber").replace("#", "")}s
            </p>
          </div>

          <Button
            type="submit"
            disabled={saving || loading}
            className="w-full gap-1.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {t("seatplan.createPlan")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
