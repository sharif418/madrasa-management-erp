"use client";
// ExamForm — Add/Edit dialog (name, class, term, dates)
import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { GraduationCap, Save } from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { toDateInput, TERM_LIST, termLabelKey, type ExamListItem, type ClassOption, type TermKey } from "./exams-types";

export function ExamForm({
  open,
  onOpenChange,
  editing,
  classes,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: ExamListItem | null;
  classes: ClassOption[];
  onSaved: () => void;
}) {
  const { t } = useApp();
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [classId, setClassId] = React.useState<string>("none");
  const [term, setTerm] = React.useState<string>("none");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setClassId(editing?.classId ?? "none");
    setTerm(editing?.term ?? "none");
    setStartDate(editing?.startDate ? toDateInput(editing.startDate) : "");
    setEndDate(editing?.endDate ? toDateInput(editing.endDate) : "");
  }, [open, editing]);

  const submit = async () => {
    if (!name.trim()) {
      toast({ title: t("common.required"), description: t("exams.name"), variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        classId: classId === "none" ? null : classId,
        term: term === "none" ? null : term,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
      };
      const r = editing
        ? await fetch(`/api/exams/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/exams", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="size-5 text-emerald-600" />
            {editing ? t("exams.edit") : t("exams.add")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ef-name">{t("exams.name")} *</Label>
            <Input
              id="ef-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("exams.name")}
              maxLength={120}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("exams.class")}</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("common.none")}</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("exams.term")}</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("common.none")}</SelectItem>
                  {TERM_LIST.map((tm) => (
                    <SelectItem key={tm} value={tm}>{t(termLabelKey(tm))}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ef-start">{t("exams.startDate")}</Label>
              <Input id="ef-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ef-end">{t("exams.endDate")}</Label>
              <Input id="ef-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            <Save className="size-4" />
            {saving ? t("common.loading") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { TermKey };
