"use client";
// BulkAttendanceDialog — date + status selector → POST /api/students/bulk
import * as React from "react";
import { Loader2, CalendarCheck } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useT } from "./i18n";

const STATUSES = [
  { value: "present", labelKey: "attendance.present", color: "bg-emerald-500" },
  { value: "absent",  labelKey: "attendance.absent",  color: "bg-rose-500" },
  { value: "late",    labelKey: "attendance.late",    color: "bg-amber-500" },
  { value: "leave",   labelKey: "attendance.leave",   color: "bg-sky-500" },
] as const;

export function BulkAttendanceDialog({
  open, onOpenChange, studentIds, onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  studentIds: string[];
  onDone?: () => void;
}) {
  const t = useT();
  const { toast } = useToast();
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = React.useState<string>("present");
  const [saving, setSaving] = React.useState(false);

  const count = studentIds.length;

  const submit = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "attendance",
          studentIds,
          data: { date, status },
        }),
      });
      const j = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Request failed");
      const r = j.data as { success: number; failed: number };
      toast({
        title: t("students.bulkAttendanceSuccess", { count: r.success }),
        description: r.failed > 0 ? `${r.failed} failed` : undefined,
        variant: r.failed > 0 ? "destructive" : "default",
      });
      onOpenChange(false);
      onDone?.();
    } catch (e) {
      toast({
        title: t("students.loadError"),
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="size-5 text-emerald-600" />
            {t("students.markAttendance")}
          </DialogTitle>
          <DialogDescription>
            {t("students.selected", { count })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="bulk-date" className="text-xs font-medium">
              {t("attendance.date")}
            </Label>
            <Input
              id="bulk-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t("common.status")}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <span className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${s.color}`} />
                      {t(s.labelKey)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={submit}
            disabled={saving || count === 0}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
          >
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t("students.markAttendance")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
