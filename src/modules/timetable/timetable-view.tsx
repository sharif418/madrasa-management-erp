"use client";
// TimetableView — weekly class schedule (emerald→teal Islamic design).
// Header · class selector · today's schedule strip · weekly grid · slot form.
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Plus, Printer, Loader2, CalendarX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useApp } from "@/store/app-store";

import { TimetableGrid } from "./timetable-grid";
import { SlotForm } from "./slot-form";
import { EmptyState, TodayStrip } from "./timetable-parts";
import {
  DAY_LABEL_KEYS, fmtTime, todayCode,
  type ClassOption, type DayCode, type SlotDTO, type TeacherOption,
} from "./types";

const STAR_PATTERN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='white' stroke-width='1'><polygon points='20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14'/></g></svg>\")";

export function TimetableView() {
  const { t, locale, dir } = useApp();
  const [slots, setSlots] = useState<SlotDTO[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editSlot, setEditSlot] = useState<SlotDTO | null>(null);
  const [prefill, setPrefill] = useState<{ day: DayCode; start: string; classId: string }>({
    day: "sat", start: "08:00", classId: "",
  });

  const [deleteTarget, setDeleteTarget] = useState<SlotDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load classes + teachers once
  useEffect(() => {
    (async () => {
      try {
        const [cRes, tRes] = await Promise.all([
          fetch("/api/academic/classes", { cache: "no-store" }),
          fetch("/api/teachers?active=true", { cache: "no-store" }),
        ]);
        const cJson = await cRes.json();
        const tJson = await tRes.json();
        if (cJson?.ok) {
          const cs = (cJson.data.items as ClassOption[]).map((c) => ({ id: c.id, name: c.name }));
          setClasses(cs);
          if (cs.length) setSelectedClass(cs[0].id);
        }
        if (tJson?.ok) {
          const list = (tJson.data?.items ?? tJson.data ?? []) as TeacherOption[];
          setTeachers(list.map((x) => ({ id: x.id, name: x.name })));
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const load = useCallback(async () => {
    if (!selectedClass) {
      setSlots([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/timetable?classId=${encodeURIComponent(selectedClass)}`, { cache: "no-store" });
      const json = await res.json();
      if (json?.ok) setSlots((json.data.items as SlotDTO[]) ?? []);
      else setSlots([]);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    void load();
  }, [load]);

  const today = todayCode();
  const todaySlots = useMemo(
    () => slots.filter((s) => s.day === today).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [slots, today]
  );

  const handleAdd = (day: DayCode, start: string) => {
    if (!selectedClass) return toast.error(t("timetable.selectClass"));
    setEditSlot(null);
    setPrefill({ day, start, classId: selectedClass });
    setFormOpen(true);
  };

  const handleAddTop = () => {
    if (!selectedClass) return toast.error(t("timetable.selectClass"));
    setEditSlot(null);
    setPrefill({ day: today === "fri" ? "sat" : today, start: "08:00", classId: selectedClass });
    setFormOpen(true);
  };

  const handleEdit = (s: SlotDTO) => {
    setEditSlot(s);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/timetable/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
      toast.success(t("timetable.slotDeleted"));
      setDeleteTarget(null);
      void load();
    } catch (err) {
      toast.error(t("timetable.deleteFailed"), {
        description: err instanceof Error ? err.message : "Failed",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6" dir={dir()}>
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/20 ring-1 ring-white/30">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.15]"
              aria-hidden="true"
              style={{ backgroundImage: STAR_PATTERN, backgroundSize: "40px 40px", backgroundRepeat: "repeat" }}
            />
            <CalendarClock className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("timetable.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("timetable.subtitle")}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t("timetable.selectClass")} />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => window.print()} title={t("timetable.print")}>
            <Printer className="size-4" />
          </Button>
          <Button
            onClick={handleAddTop}
            disabled={!selectedClass}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700"
          >
            <Plus className="size-4" />
            {t("timetable.addSlot")}
          </Button>
        </div>
      </header>

      {/* Today's schedule strip */}
      {selectedClass && !loading && todaySlots.length > 0 && today !== "fri" && (
        <TodayStrip slots={todaySlots} today={today} />
      )}

      {/* Body */}
      {!selectedClass ? (
        <EmptyState
          icon={<CalendarX className="size-10" />}
          title={t("timetable.selectClass")}
          desc={t("timetable.noClassSelected")}
        />
      ) : loading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span className="text-sm">{t("common.loading")}</span>
          </CardContent>
        </Card>
      ) : slots.length === 0 ? (
        <EmptyState
          icon={<CalendarX className="size-10" />}
          title={t("timetable.empty")}
          desc={t("timetable.emptyDesc")}
          action={
            <Button onClick={handleAddTop} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <Plus className="size-4" />
              {t("timetable.addSlot")}
            </Button>
          }
        />
      ) : (
        <TimetableGrid slots={slots} onAdd={handleAdd} onEdit={handleEdit} />
      )}

      <SlotForm
        open={formOpen}
        onOpenChange={setFormOpen}
        slot={editSlot}
        classes={classes}
        teachers={teachers}
        prefillDay={prefill.day}
        prefillStart={prefill.start}
        prefillClassId={prefill.classId}
        onSaved={() => void load()}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("timetable.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("timetable.confirmDeleteDesc")}
              {deleteTarget && (
                <span className="mt-2 block rounded-md bg-muted px-2 py-1 text-xs">
                  {deleteTarget.subject} · {fmtTime(deleteTarget.startTime, locale)}–{fmtTime(deleteTarget.endTime, locale)}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
