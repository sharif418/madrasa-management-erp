"use client";
// SlotForm — Dialog form to create or edit a timetable slot.
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { useApp } from "@/store/app-store";
import {
  DAY_CODES, DAY_LABEL_KEYS,
  type ClassOption, type DayCode, type SlotDTO, type TeacherOption,
} from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot?: SlotDTO | null;
  classes: ClassOption[];
  teachers: TeacherOption[];
  prefillDay?: DayCode;
  prefillStart?: string;
  prefillClassId?: string;
  onSaved: () => void;
};

const EMPTY = {
  classId: "",
  day: "sat" as DayCode,
  startTime: "08:00",
  endTime: "09:00",
  subject: "",
  teacherId: "",
  room: "",
};

export function SlotForm({
  open, onOpenChange, slot, classes, teachers,
  prefillDay, prefillStart, prefillClassId, onSaved,
}: Props) {
  const { t } = useApp();
  const [values, setValues] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!slot;

  useEffect(() => {
    if (!open) return;
    if (slot) {
      setValues({
        classId: slot.classId || "",
        day: (DAY_CODES.includes(slot.day as DayCode) ? slot.day : "sat") as DayCode,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subject: slot.subject,
        teacherId: slot.teacherId || "",
        room: slot.room || "",
      });
    } else {
      setValues({
        ...EMPTY,
        day: prefillDay || "sat",
        startTime: prefillStart || "08:00",
        endTime: bumpHour(prefillStart || "08:00"),
        classId: prefillClassId || "",
      });
    }
  }, [open, slot, prefillDay, prefillStart, prefillClassId]);

  const update = <K extends keyof typeof values>(k: K, v: (typeof values)[K]) =>
    setValues((s) => ({ ...s, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.subject.trim()) return toast.error(t("timetable.nameRequired"));
    if (!values.startTime || !values.endTime) return toast.error(t("timetable.timeRequired"));
    if (values.startTime >= values.endTime) return toast.error(t("timetable.timeOrder"));

    setSubmitting(true);
    try {
      const payload = {
        classId: values.classId || null,
        day: values.day,
        startTime: values.startTime,
        endTime: values.endTime,
        subject: values.subject.trim(),
        teacherId: values.teacherId || null,
        room: values.room.trim() || null,
      };
      const url = isEdit ? `/api/timetable/${slot!.id}` : "/api/timetable";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Request failed");
      toast.success(t("timetable.slotSaved"));
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(t("timetable.slotFailed"), {
        description: err instanceof Error ? err.message : "Failed",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("timetable.editSlot") : t("timetable.addSlot")}</DialogTitle>
          <DialogDescription>{t("timetable.subtitle")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("timetable.class")}>
              <Select value={values.classId} onValueChange={(v) => update("classId", v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder={t("timetable.selectClass")} /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("timetable.day")}>
              <Select value={values.day} onValueChange={(v) => update("day", v as DayCode)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAY_CODES.map((d) => (
                    <SelectItem key={d} value={d}>{t(DAY_LABEL_KEYS[d])}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label={t("timetable.subject")} required>
            <Input
              value={values.subject}
              onChange={(e) => update("subject", e.target.value)}
              placeholder={t("timetable.subject")}
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t("timetable.startTime")} required>
              <Input
                type="time"
                value={values.startTime}
                onChange={(e) => update("startTime", e.target.value)}
                required
              />
            </Field>
            <Field label={t("timetable.endTime")} required>
              <Input
                type="time"
                value={values.endTime}
                onChange={(e) => update("endTime", e.target.value)}
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t("timetable.teacher")}>
              <Select value={values.teacherId} onValueChange={(v) => update("teacherId", v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder={t("timetable.teacher")} /></SelectTrigger>
                <SelectContent>
                  {teachers.map((tc) => (
                    <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("timetable.room")}>
              <Input
                value={values.room}
                onChange={(e) => update("room", e.target.value)}
                placeholder="—"
              />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ms-1">*</span>}
      </Label>
      {children}
    </div>
  );
}

function bumpHour(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const next = h + 1;
  return `${String(next).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
