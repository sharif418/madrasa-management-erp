"use client";

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

import { useT } from "./i18n";
import {
  CURRICULA, EMPTY_CLASS_FORM,
  type ClassDTO, type ClassFormValues, type Curriculum,
} from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classEntity?: ClassDTO | null;
  onSaved: () => void;
};

export function ClassForm({ open, onOpenChange, classEntity, onSaved }: Props) {
  const t = useT();
  const [values, setValues] = useState<ClassFormValues>(EMPTY_CLASS_FORM);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!classEntity;

  useEffect(() => {
    if (!open) return;
    if (classEntity) {
      setValues({
        name: classEntity.name || "",
        code: classEntity.code || "",
        curriculum: classEntity.curriculum === "alia" ? "alia" : "qawmi",
        level: classEntity.level ?? 1,
        capacity: classEntity.capacity ?? 40,
      });
    } else {
      setValues({ ...EMPTY_CLASS_FORM });
    }
  }, [open, classEntity]);

  const update = <K extends keyof ClassFormValues>(key: K, val: ClassFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) return toast.error(t("academic.nameRequired"));
    const capacity = Number(values.capacity);
    if (!capacity || capacity <= 0) return toast.error(t("academic.capacityRequired"));

    setSubmitting(true);
    try {
      const payload = {
        name: values.name.trim(),
        code: values.code.trim(),
        curriculum: values.curriculum,
        level: Number(values.level) || 0,
        capacity,
      };
      const url = isEdit
        ? `/api/academic/classes/${classEntity!.id}`
        : "/api/academic/classes";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Request failed");

      toast.success(isEdit ? t("academic.updateSuccess") : t("academic.createSuccess"));
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(isEdit ? t("academic.updateFailed") : t("academic.createFailed"), {
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
          <DialogTitle>
            {isEdit ? t("academic.editClass") : t("academic.newClass")}
          </DialogTitle>
          <DialogDescription>{t("academic.subtitle")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <FormField label={t("academic.className")} required>
            <Input
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Maktab — Level 1"
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t("academic.code")}>
              <Input
                value={values.code}
                onChange={(e) => update("code", e.target.value)}
                placeholder="CLS-101"
              />
            </FormField>
            <FormField label={t("academic.curriculum")}>
              <Select
                value={values.curriculum}
                onValueChange={(v) => update("curriculum", v as Curriculum)}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRICULA.map((c) => (
                    <SelectItem key={c} value={c}>{t(`academic.${c}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t("academic.level")}>
              <Input
                type="number"
                min={0}
                value={values.level}
                onChange={(e) => update("level", e.target.value)}
                inputMode="numeric"
              />
            </FormField>
            <FormField label={t("academic.capacity")} required>
              <Input
                type="number"
                min={1}
                value={values.capacity}
                onChange={(e) => update("capacity", e.target.value)}
                inputMode="numeric"
                required
              />
            </FormField>
          </div>

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
