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
  EMPTY_SUBJECT_FORM, SUBJECT_TYPES,
  type ClassOption, type SubjectDTO, type SubjectFormValues, type SubjectType,
} from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject?: SubjectDTO | null;
  classes: ClassOption[];
  onSaved: () => void;
};

export function SubjectForm({ open, onOpenChange, subject, classes, onSaved }: Props) {
  const t = useT();
  const [values, setValues] = useState<SubjectFormValues>(EMPTY_SUBJECT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!subject;

  useEffect(() => {
    if (!open) return;
    if (subject) {
      setValues({
        name: subject.name || "",
        code: subject.code || "",
        type: (SUBJECT_TYPES.includes(subject.type) ? subject.type : "academic") as SubjectType,
        classId: subject.classId || "",
      });
    } else {
      setValues({ ...EMPTY_SUBJECT_FORM });
    }
  }, [open, subject]);

  const update = <K extends keyof SubjectFormValues>(key: K, val: SubjectFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) return toast.error(t("academic.nameRequired"));

    setSubmitting(true);
    try {
      const payload = {
        name: values.name.trim(),
        code: values.code.trim(),
        type: values.type,
        classId: values.classId || null,
      };
      const url = isEdit
        ? `/api/academic/subjects/${subject!.id}`
        : "/api/academic/subjects";
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
            {isEdit ? t("academic.editSubject") : t("academic.newSubject")}
          </DialogTitle>
          <DialogDescription>{t("academic.subtitle")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <FormField label={t("academic.subjectName")} required>
            <Input
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Quran — Surah Al-Baqarah"
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t("academic.code")}>
              <Input
                value={values.code}
                onChange={(e) => update("code", e.target.value)}
                placeholder="QUR-201"
              />
            </FormField>
            <FormField label={t("academic.subjectType")}>
              <Select
                value={values.type}
                onValueChange={(v) => update("type", v as SubjectType)}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBJECT_TYPES.map((s) => (
                    <SelectItem key={s} value={s}>{t(`academic.${s}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label={t("academic.filterClass")}>
            <Select
              value={values.classId || "__none__"}
              onValueChange={(v) => update("classId", v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t("academic.noClass")}</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
