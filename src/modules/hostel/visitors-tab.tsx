"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2, LogIn, LogOut, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/store/app-store";

import { fmtDateTime, type HostelData, type Visitor } from "./types";

type Props = { data: HostelData | null; onChanged: () => void };

export function VisitorsTab({ data, onChanged }: Props) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);

  const visitors = data?.visitors ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{visitors.length} {t("hostel.visitors")}</p>
        <Button
          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
          onClick={() => setOpen(true)}
        >
          <Plus className="size-4" />
          {t("hostel.checkInVisitor")}
        </Button>
      </div>

      {visitors.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">{t("hostel.noVisitors")}</p>
      ) : (
        <div className="grid gap-3">
          {visitors.map((v) => (
            <VisitorRow key={v.id} visitor={v} onChanged={onChanged} />
          ))}
        </div>
      )}

      <CheckInVisitorDialog open={open} onOpenChange={setOpen} onSaved={onChanged} />
    </div>
  );
}

function VisitorRow({ visitor, onChanged }: { visitor: Visitor; onChanged: () => void }) {
  const { t } = useApp();
  const [submitting, setSubmitting] = useState(false);

  const checkOut = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/hostel/visitor", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: visitor.id }),
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

  const stillIn = !visitor.checkOut;

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
            <UserRound className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold">{visitor.name}</p>
              {stillIn ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <LogIn className="size-3 me-1" />
                  {t("hostel.checkIn")}
                </Badge>
              ) : (
                <Badge variant="outline">
                  <LogOut className="size-3 me-1" />
                  {t("hostel.checkOut")}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{visitor.purpose}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
              {visitor.phone && <span>{t("hostel.phone")}: {visitor.phone}</span>}
              <span>{t("hostel.checkIn")}: {fmtDateTime(visitor.checkIn)}</span>
              <span>{t("hostel.checkOut")}: {fmtDateTime(visitor.checkOut)}</span>
            </div>
          </div>
        </div>
        {stillIn && (
          <Button variant="outline" size="sm" onClick={checkOut} disabled={submitting}>
            {submitting && <Loader2 className="size-3 animate-spin" />}
            <LogOut className="size-3" />
            {t("hostel.checkOut")}
          </Button>
        )}
      </div>
    </div>
  );
}

function CheckInVisitorDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const { t } = useApp();
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [studentId, setStudentId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(""); setPhone(""); setPurpose(""); setStudentId("");
    void (async () => {
      try {
        const res = await fetch("/api/students?limit=100", { cache: "no-store" });
        const json = await res.json();
        if (json.ok) setStudents(json.data.items.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
      } catch { /* ignore */ }
    })();
  }, [open]);

  const submit = async () => {
    if (!name.trim() || !purpose.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/hostel/visitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          purpose: purpose.trim(),
          visitingStudentId: studentId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
      toast.success(t("hostel.visitorCheckedIn"));
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
          <DialogTitle>{t("hostel.checkInVisitor")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("hostel.visitorName")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("hostel.visitorName")} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("hostel.phone")}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
            </div>
            <div className="space-y-2">
              <Label>{t("hostel.visiting")}</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger><SelectValue placeholder={t("common.none")} /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("hostel.purpose")}</Label>
            <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder={t("hostel.purpose")} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button
            onClick={submit}
            disabled={submitting || !name.trim() || !purpose.trim()}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {t("hostel.checkIn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
