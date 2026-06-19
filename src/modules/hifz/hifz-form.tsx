"use client";
// HifzForm — Add Record dialog
// Captures Sabak / Sabaq Para / Dhor entries with student, para, surah/ayah,
// quality (5-star), mistakes count, notes, and status.
import * as React from "react";
import { Star } from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import {
  HIFZ_TYPES, HIFZ_STATUSES, type HifzType, type HifzStatus,
  type StudentOption, typeAccent, typeLabelKey,
} from "./hifz-types";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  students: StudentOption[];
  defaultStudentId?: string;
  onCreated: () => void;
};

const PARAS = Array.from({ length: 30 }, (_, i) => i + 1);

export function HifzForm({ open, onOpenChange, students, defaultStudentId, onCreated }: Props) {
  const { t, dir } = useApp();
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);

  const [studentId, setStudentId] = React.useState(defaultStudentId ?? "");
  const [type, setType] = React.useState<HifzType>("sabak");
  const [paraNumber, setParaNumber] = React.useState<string>("1");
  const [surahName, setSurahName] = React.useState("");
  const [ayahFrom, setAyahFrom] = React.useState("");
  const [ayahTo, setAyahTo] = React.useState("");
  const [quality, setQuality] = React.useState<number>(4);
  const [mistakes, setMistakes] = React.useState("0");
  const [notes, setNotes] = React.useState("");
  const [status, setStatus] = React.useState<HifzStatus>("completed");

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setStudentId(defaultStudentId ?? "");
      setType("sabak");
      setParaNumber("1");
      setSurahName("");
      setAyahFrom("");
      setAyahTo("");
      setQuality(4);
      setMistakes("0");
      setNotes("");
      setStatus("completed");
    }
  }, [open, defaultStudentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId) {
      toast({ title: t("hifz.studentRequired"), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/hifz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          type,
          paraNumber: Number(paraNumber),
          surahName: surahName || undefined,
          ayahFrom: ayahFrom ? Number(ayahFrom) : undefined,
          ayahTo: ayahTo ? Number(ayahTo) : undefined,
          qualityRating: quality,
          mistakesCount: Number(mistakes || 0),
          notes: notes || undefined,
          status,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed");
      toast({ title: t("hifz.addSuccess") });
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto" dir={dir()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-emerald-600">☪</span> {t("hifz.add")}
          </DialogTitle>
          <DialogDescription>{t("hifz.title")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student + Para */}
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
                      {s.name}
                      {s.rollNo ? ` · ${s.rollNo}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("hifz.paraNumber")} *</Label>
              <Select value={paraNumber} onValueChange={setParaNumber}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {PARAS.map((p) => (
                    <SelectItem key={p} value={String(p)}>
                      {t("hifz.para")} {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Type radio cards */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t("hifz.type")} *</Label>
            <RadioGroup
              dir={dir()}
              value={type}
              onValueChange={(v) => setType(v as HifzType)}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2"
            >
              {HIFZ_TYPES.map((ty) => (
                <label
                  key={ty}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent",
                    type === ty && "border-foreground/40 bg-accent/60"
                  )}
                >
                  <RadioGroupItem value={ty} id={`hifz-type-${ty}`} className="mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ background: typeAccent[ty] }}
                      />
                      <span className="text-sm font-medium">{t(typeLabelKey(ty))}</span>
                    </div>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Surah + Ayah range */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("hifz.surah")}</Label>
              <Input value={surahName} onChange={(e) => setSurahName(e.target.value)} placeholder="Al-Baqarah" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("hifz.ayahFrom")}</Label>
              <Input
                type="number" min={1} value={ayahFrom}
                onChange={(e) => setAyahFrom(e.target.value)}
                placeholder="1"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("hifz.ayahTo")}</Label>
              <Input
                type="number" min={1} value={ayahTo}
                onChange={(e) => setAyahTo(e.target.value)}
                placeholder="20"
              />
            </div>
          </div>

          {/* Quality stars + Mistakes + Status */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("hifz.quality")}</Label>
              <div className="flex items-center gap-1 h-9" role="radiogroup" aria-label={t("hifz.quality")}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n} type="button" onClick={() => setQuality(n)}
                    aria-label={`${n} star`}
                    className="p-1 rounded-md hover:bg-accent transition-colors"
                  >
                    <Star
                      className={cn(
                        "size-5 transition-colors",
                        n <= quality ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                      )}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{t("hifz.qualityHint")}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("hifz.mistakes")}</Label>
              <Input
                type="number" min={0} value={mistakes}
                onChange={(e) => setMistakes(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("hifz.mistakesHint")}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("hifz.status")}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as HifzStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HIFZ_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{t(`hifz.${s}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t("hifz.notes")}</Label>
            <Textarea
              value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={3} placeholder="…"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm shadow-emerald-900/20 transition-all hover:from-emerald-600 hover:to-emerald-800 hover:shadow-md hover:-translate-y-0.5"
            >
              {submitting ? t("common.loading") : t("hifz.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
