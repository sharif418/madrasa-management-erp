"use client";
// LevelForm — Dialog form to create or edit an academic level.
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useT } from "./i18n";

export type LevelDTO = {
  id: string;
  name: string;
  nameArabic: string | null;
  order: number;
  durationYears: number;
  description: string | null;
  createdAt: string;
  _count: { classes: number };
};

type FormValues = {
  name: string;
  nameArabic: string;
  order: number | string;
  durationYears: number | string;
  description: string;
};

export function LevelForm({
  open, onOpenChange, level, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  level: LevelDTO | null;
  onSaved: () => void;
}) {
  const t = useT();
  const isEdit = !!level;
  const [values, setValues] = useState<FormValues>({
    name: "", nameArabic: "", order: 1, durationYears: 1, description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (level) {
      setValues({
        name: level.name,
        nameArabic: level.nameArabic || "",
        order: level.order,
        durationYears: level.durationYears,
        description: level.description || "",
      });
    } else {
      setValues({ name: "", nameArabic: "", order: 1, durationYears: 1, description: "" });
    }
  }, [open, level]);

  const update = <K extends keyof FormValues>(k: K, v: FormValues[K]) =>
    setValues((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) return toast.error(t("academic.nameRequiredLevel"));
    const order = Number(values.order);
    const durationYears = Number(values.durationYears);
    if (Number.isNaN(order) || order < 0) return toast.error(t("academic.nameRequiredLevel"));
    if (Number.isNaN(durationYears) || durationYears <= 0) return toast.error(t("academic.nameRequiredLevel"));

    setSubmitting(true);
    try {
      const payload = {
        name: values.name.trim(),
        nameArabic: values.nameArabic.trim(),
        order,
        durationYears,
        description: values.description.trim(),
      };
      const url = isEdit ? `/api/academic/levels/${level!.id}` : "/api/academic/levels";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Request failed");
      toast.success(t("academic.levelSaved"));
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(t("academic.levelFailed"), {
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
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="size-5 text-emerald-600" />
            {isEdit ? t("academic.editLevel") : t("academic.newLevel")}
          </DialogTitle>
          <DialogDescription>{t("academic.subtitle")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4">
          <FormField label={t("academic.levelName")} required>
            <Input
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Ibtedayi"
              required
            />
          </FormField>

          <FormField label={t("academic.levelNameArabic")}>
            <Input
              value={values.nameArabic}
              onChange={(e) => update("nameArabic", e.target.value)}
              placeholder="ابتدائية"
              dir="rtl"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t("academic.order")} required>
              <Input
                type="number"
                min={0}
                value={values.order}
                onChange={(e) => update("order", e.target.value)}
                inputMode="numeric"
                required
              />
            </FormField>
            <FormField label={t("academic.durationYears")} required>
              <Input
                type="number"
                min={1}
                value={values.durationYears}
                onChange={(e) => update("durationYears", e.target.value)}
                inputMode="numeric"
                required
              />
            </FormField>
          </div>

          <FormField label={t("academic.description")}>
            <Textarea
              value={values.description}
              onChange={(e) => update("description", e.target.value)}
              rows={2}
              placeholder="—"
            />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? t("academic.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormField({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
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
