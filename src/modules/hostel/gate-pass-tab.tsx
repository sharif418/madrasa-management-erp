"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2, DoorOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/store/app-store";

import { fmtDateTime, type GatePass, type HostelData } from "./types";

type Props = { data: HostelData | null; onChanged: () => void };

const statusTint = (s: string) => {
  switch (s) {
    case "approved":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "used":
      return "bg-muted text-muted-foreground";
    case "rejected":
      return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300";
    default:
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300";
  }
};

export function GatePassTab({ data, onChanged }: Props) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);

  const passes = data?.gatePasses ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{passes.length} {t("hostel.gatePass")}</p>
        <Button
          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
          onClick={() => setOpen(true)}
        >
          <Plus className="size-4" />
          {t("hostel.newGatePass")}
        </Button>
      </div>

      {passes.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">{t("hostel.noGatePass")}</p>
      ) : (
        <div className="grid gap-3">
          {passes.map((p) => (
            <GatePassRow key={p.id} pass={p} onChanged={onChanged} />
          ))}
        </div>
      )}

      <AddGatePassDialog open={open} onOpenChange={setOpen} onSaved={onChanged} />
    </div>
  );
}

function GatePassRow({ pass, onChanged }: { pass: GatePass; onChanged: () => void }) {
  const { t } = useApp();
  const [submitting, setSubmitting] = useState(false);

  const markUsed = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/hostel/gate-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "use", gatePassId: pass.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
      toast.success(t("hostel.visitorCheckedOut"));
      onChanged();
    } catch (err) {
      toast.error(t("hostel.saveFailed"), { description: err instanceof Error ? err.message : "" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{pass.student.name}</p>
            {pass.student.rollNo && (
              <span className="text-xs text-muted-foreground">#{pass.student.rollNo}</span>
            )}
            <Badge className={statusTint(pass.status)}>{t(`hostel.${pass.status}`)}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{pass.reason}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
            <span>{t("hostel.outTime")}: {fmtDateTime(pass.outTime)}</span>
            <span>{t("hostel.inTime")}: {fmtDateTime(pass.inTime)}</span>
          </div>
        </div>
        {pass.status === "approved" && (
          <Button variant="outline" size="sm" onClick={markUsed} disabled={submitting}>
            {submitting && <Loader2 className="size-3 animate-spin" />}
            <DoorOpen className="size-3" />
            {t("hostel.checkOut")}
          </Button>
        )}
      </div>
    </div>
  );
}

function AddGatePassDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const { t } = useApp();
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [studentId, setStudentId] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStudentId(""); setReason("");
    void (async () => {
      try {
        const res = await fetch("/api/students?limit=100", { cache: "no-store" });
        const json = await res.json();
        if (json.ok) setStudents(json.data.items.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
      } catch { /* ignore */ }
    })();
  }, [open]);

  const submit = async () => {
    if (!studentId || !reason.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/hostel/gate-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, reason: reason.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
      toast.success(t("hostel.gatePassCreated"));
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
        <DialogHeader>
          <DialogTitle>{t("hostel.newGatePass")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
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
          <div className="space-y-2">
            <Label>{t("hostel.reason")}</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder={t("hostel.reason")} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button
            onClick={submit}
            disabled={submitting || !studentId || !reason.trim()}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
