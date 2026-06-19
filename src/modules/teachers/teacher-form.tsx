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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useApp } from "@/store/app-store";

import {
  DESIGNATIONS, SPECIALIZATIONS, EMPTY_FORM,
  type TeacherDTO, type TeacherFormValues,
} from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher?: TeacherDTO | null;
  onSaved: () => void;
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function TeacherForm({ open, onOpenChange, teacher, onSaved }: Props) {
  const { t } = useApp();
  const [values, setValues] = useState<TeacherFormValues>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!teacher;

  useEffect(() => {
    if (!open) return;
    if (teacher) {
      setValues({
        name: teacher.name || "",
        nameArabic: teacher.nameArabic || "",
        phone: teacher.phone || "",
        email: teacher.email || "",
        gender: teacher.gender === "female" ? "female" : "male",
        designation: teacher.designation || "ustadh",
        specialization:
          (teacher.specialization as TeacherFormValues["specialization"]) || "general",
        salary: teacher.salary ?? 0,
        joinDate: teacher.joinDate ? new Date(teacher.joinDate).toISOString().slice(0, 10) : "",
        address: teacher.address || "",
        photoUrl: teacher.photoUrl || "",
        isActive: teacher.isActive,
      });
    } else {
      setValues({ ...EMPTY_FORM, joinDate: new Date().toISOString().slice(0, 10) });
    }
  }, [open, teacher]);

  const update = <K extends keyof TeacherFormValues>(key: K, val: TeacherFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) return toast.error(t("teachers.nameRequired"));
    if (!values.joinDate) return toast.error(t("teachers.joinDateRequired"));

    setSubmitting(true);
    try {
      const payload = {
        name: values.name.trim(),
        nameArabic: values.nameArabic.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        gender: values.gender,
        designation: values.designation,
        specialization: values.specialization || null,
        salary: Number(values.salary) || 0,
        joinDate: values.joinDate,
        address: values.address.trim(),
        photoUrl: values.photoUrl.trim(),
        isActive: values.isActive,
      };
      const url = isEdit ? `/api/teachers/${teacher!.id}` : "/api/teachers";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Request failed");

      toast.success(isEdit ? t("teachers.updateSuccess") : t("teachers.createSuccess"));
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(isEdit ? t("teachers.updateFailed") : t("teachers.createFailed"), {
        description: err instanceof Error ? err.message : "Failed",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("teachers.editTitle") : t("teachers.addTitle")}</DialogTitle>
          <DialogDescription>{isEdit ? t("teachers.edit") : t("teachers.add")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={t("teachers.name")} required>
              <Input value={values.name} onChange={(e) => update("name", e.target.value)} placeholder="Abdul Karim" required />
            </FormField>
            <FormField label={t("teachers.nameArabic")}>
              <Input value={values.nameArabic} onChange={(e) => update("nameArabic", e.target.value)} placeholder="عبد الكريم" dir="rtl" lang="ar" />
            </FormField>
            <FormField label={t("teachers.phone")}>
              <Input value={values.phone} onChange={(e) => update("phone", e.target.value)} placeholder="01XXXXXXXXX" inputMode="tel" />
            </FormField>
            <FormField label={t("teachers.email")}>
              <Input type="email" value={values.email} onChange={(e) => update("email", e.target.value)} placeholder="teacher@madrasa.com" />
            </FormField>
            <FormField label={t("teachers.gender")}>
              <Select value={values.gender} onValueChange={(v) => update("gender", v as "male" | "female")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t("teachers.male")}</SelectItem>
                  <SelectItem value="female">{t("teachers.female")}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={t("teachers.designation")}>
              <Select value={values.designation} onValueChange={(v) => update("designation", v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DESIGNATIONS.map((d) => <SelectItem key={d} value={d}>{t(`teachers.designation${cap(d)}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={t("teachers.specialization")}>
              <Select value={values.specialization || "general"} onValueChange={(v) => update("specialization", v as TeacherFormValues["specialization"])}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPECIALIZATIONS.map((s) => <SelectItem key={s} value={s}>{t(`teachers.spec${cap(s)}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={t("teachers.monthlySalary")} required>
              <Input type="number" min={0} step="0.01" value={values.salary} onChange={(e) => update("salary", e.target.value)} placeholder="0.00" inputMode="decimal" />
            </FormField>
            <FormField label={t("teachers.joinDate")} required>
              <Input type="date" value={values.joinDate} onChange={(e) => update("joinDate", e.target.value)} required />
            </FormField>
            <FormField label={t("teachers.photoUrl")}>
              <Input value={values.photoUrl} onChange={(e) => update("photoUrl", e.target.value)} placeholder="https://..." />
            </FormField>
          </div>

          <FormField label={t("teachers.address")}>
            <Textarea value={values.address} onChange={(e) => update("address", e.target.value)} rows={2} placeholder="House, Road, Area, City" />
          </FormField>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">{t("teachers.status")}</p>
              <p className="text-xs text-muted-foreground">
                {values.isActive ? t("teachers.active") : t("teachers.inactive")}
              </p>
            </div>
            <Switch checked={values.isActive} onCheckedChange={(v) => update("isActive", v)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? t("teachers.saving") : t("common.save")}
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
