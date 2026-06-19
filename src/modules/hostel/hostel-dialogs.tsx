"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/store/app-store";

import type { Bed } from "./types";

// Small shared sub-button used by tree tab for adding blocks/floors/rooms
export function ToolButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className="text-xs">
      {icon}
      {label}
    </Button>
  );
}

export function AddHostelDialog({
  open, onOpenChange, onSaved,
}: { open: boolean; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const { t } = useApp();
  const [name, setName] = useState("");
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [wardenId, setWardenId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      try {
        const res = await fetch("/api/teachers?limit=100", { cache: "no-store" });
        const json = await res.json();
        if (json.ok) setTeachers(json.data.items.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
      } catch { /* ignore */ }
    })();
  }, [open]);

  const submit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), wardenTeacherId: wardenId || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
      toast.success(t("hostel.createSuccess"));
      setName(""); setWardenId("");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(t("hostel.saveFailed"), { description: err instanceof Error ? err.message : "" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("hostel.addHostel")}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("hostel.hostelName")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("hostel.hostelName")} />
          </div>
          <div className="space-y-2">
            <Label>{t("hostel.warden")}</Label>
            <Select value={wardenId} onValueChange={setWardenId}>
              <SelectTrigger><SelectValue placeholder={t("hostel.selectWarden")} /></SelectTrigger>
              <SelectContent className="max-h-72">
                {teachers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button
            onClick={submit}
            disabled={submitting || !name.trim()}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {t("common.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AllocateDialog({
  open, onOpenChange, bed, onChanged,
}: { open: boolean; onOpenChange: (o: boolean) => void; bed: Bed | null; onChanged: () => void }) {
  const { t } = useApp();
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [studentId, setStudentId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStudentId("");
    void (async () => {
      try {
        const res = await fetch("/api/students?limit=100", { cache: "no-store" });
        const json = await res.json();
        if (json.ok) setStudents(json.data.items.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
      } catch { /* ignore */ }
    })();
  }, [open]);

  if (!bed) return null;
  const isOccupied = bed.status === "occupied" && bed.allocations[0];

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/hostel/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isOccupied ? { bedId: bed.id, action: "release" } : { bedId: bed.id, studentId }
        ),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
      toast.success(isOccupied ? t("hostel.releaseSuccess") : t("hostel.allocationSuccess"));
      onOpenChange(false);
      onChanged();
    } catch (err) {
      toast.error(t("hostel.saveFailed"), { description: err instanceof Error ? err.message : "" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{bed.bedNumber}</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">
          {isOccupied
            ? `${t("hostel.occupied")}: ${bed.allocations[0].student.name}`
            : t("hostel.selectStudent")}
        </div>
        {!isOccupied && (
          <div className="space-y-2">
            <Label>{t("hostel.selectStudent")}</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue placeholder={t("hostel.selectStudent")} /></SelectTrigger>
              <SelectContent className="max-h-72">
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button
            onClick={submit}
            disabled={submitting || (!isOccupied && !studentId)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {isOccupied ? t("hostel.release") : t("hostel.allocate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Generic small-name dialog used for adding block / floor / room
export function NameDialog({
  open, onOpenChange, title, label, placeholder, onSubmit, successKey, type = "text", extraLabel, extraValue, onExtraChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  label: string;
  placeholder?: string;
  onSubmit: (val: string, extra?: string) => Promise<void>;
  successKey: string;
  type?: "text" | "number";
  extraLabel?: string;
  extraValue?: string;
  onExtraChange?: (v: string) => void;
}) {
  const { t } = useApp();
  const [val, setVal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (!open) return;
    setVal("");
  }, [open]);

  const submit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(val, extraValue);
      toast.success(t(successKey));
      onOpenChange(false);
    } catch (err) {
      toast.error(t("hostel.saveFailed"), { description: err instanceof Error ? err.message : "" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label>{label}</Label>
          <Input
            type={type}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={placeholder}
          />
          {extraLabel && (
            <>
              <Label className="mt-2">{extraLabel}</Label>
              <Input
                type="number"
                value={extraValue ?? ""}
                onChange={(e) => onExtraChange?.(e.target.value)}
              />
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button
            onClick={submit}
            disabled={submitting || !val.trim()}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {t("common.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
