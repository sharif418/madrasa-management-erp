"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/store/app-store";

import {
  ADHKAR_FIELDS, SALAH_FIELDS, SALAH_VALUES,
  type AdhkarField, type SalahField, type SalahStatus,
} from "./types";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
};

export function MuhasabaForm({ open, onOpenChange, onSaved }: Props) {
  const { t } = useApp();
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [salah, setSalah] = useState<Record<SalahField, SalahStatus>>({
    fajr: "pending", dhuhr: "pending", asr: "pending", maghrib: "pending", isha: "pending",
  });
  const [adhkar, setAdhkar] = useState<Record<AdhkarField, boolean>>({
    tahajjud: false, quranRecitation: false, morningAdhkar: false, eveningAdhkar: false, sadaqah: false,
  });
  const [akhlaq, setAkhlaq] = useState(3);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStudentId("");
    setDate(new Date().toISOString().slice(0, 10));
    setSalah({ fajr: "pending", dhuhr: "pending", asr: "pending", maghrib: "pending", isha: "pending" });
    setAdhkar({ tahajjud: false, quranRecitation: false, morningAdhkar: false, eveningAdhkar: false, sadaqah: false });
    setAkhlaq(3);
    setNote("");
    void (async () => {
      try {
        const res = await fetch("/api/students?limit=200", { cache: "no-store" });
        const json = await res.json();
        if (json.ok) setStudents(json.data.items.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
      } catch { /* ignore */ }
    })();
  }, [open]);

  const submit = async () => {
    if (!studentId) return toast.error(t("muhasaba.selectStudent"));
    if (!date) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/muhasaba", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          date,
          ...salah,
          ...adhkar,
          akhlaqRating: akhlaq,
          teacherNote: note.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
      toast.success(t("muhasaba.createSuccess"));
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(t("muhasaba.saveFailed"), { description: err instanceof Error ? err.message : "" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="size-5 text-emerald-600" />
            {t("muhasaba.logMuhasaba")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{t("muhasaba.student")}</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue placeholder={t("muhasaba.selectStudent")} /></SelectTrigger>
              <SelectContent className="max-h-72">
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("muhasaba.date")}</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        {/* Salah selectors */}
        <div className="space-y-2">
          <Label>{t("muhasaba.salah")}</Label>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {SALAH_FIELDS.map((f) => (
              <SalahSelector
                key={f}
                field={f}
                value={salah[f]}
                onChange={(v) => setSalah((s) => ({ ...s, [f]: v }))}
              />
            ))}
          </div>
        </div>

        {/* Adhkar checkboxes */}
        <div className="space-y-2">
          <Label>{t("muhasaba.tahajjud")} / {t("muhasaba.sadaqah")}</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ADHKAR_FIELDS.map((f) => (
              <label key={f} className="flex items-center gap-2 text-sm cursor-pointer rounded-md border px-2 py-1.5 hover:bg-muted/40">
                <Checkbox
                  checked={adhkar[f]}
                  onCheckedChange={(v) => setAdhkar((a) => ({ ...a, [f]: !!v }))}
                />
                <span>{t(`muhasaba.${cap(f)}`)}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Akhlaq rating */}
        <div className="space-y-2">
          <Label>{t("muhasaba.akhlaqRating")}: {akhlaq}/5</Label>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setAkhlaq(i + 1)}
                className="text-2xl transition-transform hover:scale-110"
                aria-label={`${i + 1}`}
              >
                <span className={i < akhlaq ? "text-amber-400" : "text-muted-foreground/30"}>★</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("muhasaba.teacherNote")}</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("muhasaba.notePlaceholder")}
            rows={2}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button
            onClick={submit}
            disabled={submitting || !studentId}
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

function SalahSelector({
  field, value, onChange,
}: { field: SalahField; value: SalahStatus; onChange: (v: SalahStatus) => void }) {
  const { t } = useApp();
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{t(`muhasaba.${cap(field)}`)}</p>
      <Select value={value} onValueChange={(v) => onChange(v as SalahStatus)}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {SALAH_VALUES.map((s) => (
            <SelectItem key={s} value={s}>{t(`muhasaba.${s}`)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
