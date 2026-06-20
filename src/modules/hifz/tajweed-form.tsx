"use client";
// TajweedForm — New Assessment dialog with 5 rubric sliders (1-10) + auto-computed total/grade preview
import * as React from "react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { StudentOption } from "./hifz-types";
import { GRADE_TINTS, IMPROVEMENT_AREAS, gradeFor } from "./tajweed-types";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  students: StudentOption[];
  defaultStudentId?: string;
  onCreated: () => void;
};

export function TajweedForm({ open, onOpenChange, students, defaultStudentId, onCreated }: Props) {
  const { t, dir } = useApp();
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);

  const [studentId, setStudentId] = React.useState(defaultStudentId ?? "");
  const [surahName, setSurahName] = React.useState("");
  const [ayahFrom, setAyahFrom] = React.useState("1");
  const [ayahTo, setAyahTo] = React.useState("10");
  const [scores, setScores] = React.useState({ madd: 8, waqf: 8, tizkeer: 8, nun: 8, makhraj: 8 });
  const [comments, setComments] = React.useState("");
  const [areas, setAreas] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (open) {
      setStudentId(defaultStudentId ?? "");
      setSurahName("");
      setAyahFrom("1");
      setAyahTo("10");
      setScores({ madd: 8, waqf: 8, tizkeer: 8, nun: 8, makhraj: 8 });
      setComments("");
      setAreas([]);
    }
  }, [open, defaultStudentId]);

  const total = (scores.madd + scores.waqf + scores.tizkeer + scores.nun + scores.makhraj) * 2;
  const grade = gradeFor(total);
  const tint = GRADE_TINTS[grade];

  function toggleArea(key: string) {
    setAreas((prev) => (prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId) {
      toast({ title: t("hifz.studentRequired"), variant: "destructive" });
      return;
    }
    if (!surahName.trim()) {
      toast({ title: t("hifz.required"), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/hifz/tajweed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          surahName,
          ayahFrom: Number(ayahFrom),
          ayahTo: Number(ayahTo),
          maddScore: scores.madd,
          waqfScore: scores.waqf,
          tizkeerScore: scores.tizkeer,
          nunScore: scores.nun,
          makhrajScore: scores.makhraj,
          comments: comments || undefined,
          improvementAreas: areas.length ? areas : undefined,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed");
      toast({ title: t("hifz.tajweedSaved") });
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  const scoreFields: { key: keyof typeof scores; labelKey: string }[] = [
    { key: "madd", labelKey: "hifz.maddScore" },
    { key: "waqf", labelKey: "hifz.waqfScore" },
    { key: "tizkeer", labelKey: "hifz.tizkeerScore" },
    { key: "nun", labelKey: "hifz.nunScore" },
    { key: "makhraj", labelKey: "hifz.makhrajScore" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto" dir={dir()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-emerald-600">☪</span> {t("hifz.tajweedAssessment")}
          </DialogTitle>
          <DialogDescription>{t("hifz.newAssessment")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("hifz.student")} *</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("hifz.selectStudent")} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}{s.rollNo ? ` · ${s.rollNo}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("hifz.surah")} *</Label>
              <Input value={surahName} onChange={(e) => setSurahName(e.target.value)} placeholder="Al-Fatihah" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("hifz.ayahFrom")}</Label>
              <Input type="number" min={1} value={ayahFrom} onChange={(e) => setAyahFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("hifz.ayahTo")}</Label>
              <Input type="number" min={1} value={ayahTo} onChange={(e) => setAyahTo(e.target.value)} />
            </div>
          </div>

          {/* Rubric sliders */}
          <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
            {scoreFields.map(({ key, labelKey }) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">{t(labelKey)}</Label>
                  <span className="text-xs font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {scores[key]} / 10
                  </span>
                </div>
                <Slider
                  dir={dir()}
                  value={[scores[key]]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={(v) => setScores((p) => ({ ...p, [key]: v[0] }))}
                />
              </div>
            ))}
          </div>

          {/* Total + grade preview */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-xs text-muted-foreground">{t("hifz.totalScore")}</p>
              <p className="text-2xl font-bold tabular-nums">{total} <span className="text-sm text-muted-foreground">/ 100</span></p>
            </div>
            <span className={cn("rounded-full px-3 py-1 text-sm font-semibold", tint)}>
              {t(`hifz.${grade.toLowerCase().replace(/_/g, "") === "needsimprovement" ? "needsImprovement" : grade.toLowerCase()}`)}
            </span>
          </div>

          {/* Improvement areas */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t("hifz.improvementAreas")}</Label>
            <div className="flex flex-wrap gap-2">
              {IMPROVEMENT_AREAS.map((a) => (
                <button
                  type="button"
                  key={a.key}
                  onClick={() => toggleArea(a.key)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    areas.includes(a.key)
                      ? "border-emerald-500 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : "hover:bg-accent"
                  )}
                >
                  {a.labelKey ? t(a.labelKey) : a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t("hifz.comments")}</Label>
            <Textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={3} placeholder="…" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm transition-all hover:from-emerald-600 hover:to-emerald-800 hover:-translate-y-0.5"
            >
              {submitting ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
