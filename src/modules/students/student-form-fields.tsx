"use client";
// Form field components for student create/edit
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useT } from "./i18n";
import { BLOOD_GROUPS, GUARDIAN_RELATIONS, type StudentClass, type StudentInput } from "./types";

type FieldProps = {
  value: StudentInput;
  onChange: (patch: Partial<StudentInput>) => void;
  errors?: Record<string, string>;
  classes: StudentClass[];
};

function toInputDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function BasicInfoFields({ value, onChange, errors }: Omit<FieldProps, "classes">) {
  const t = useT();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="name">
          {t("students.name")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={value.name ?? ""}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={t("students.name")}
        />
        {errors?.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nameArabic">{t("students.nameArabic")}</Label>
        <Input
          id="nameArabic"
          dir="rtl"
          value={value.nameArabic ?? ""}
          onChange={(e) => onChange({ nameArabic: e.target.value })}
          placeholder="الاسم بالعربية"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rollNo">{t("students.rollNo")}</Label>
        <Input
          id="rollNo"
          value={value.rollNo ?? ""}
          onChange={(e) => onChange({ rollNo: e.target.value })}
          placeholder={t("students.rollNo")}
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t("students.gender")}</Label>
        <RadioGroup
          value={value.gender ?? "male"}
          onValueChange={(v) => onChange({ gender: v as "male" | "female" })}
          className="flex items-center gap-6 pt-1.5"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem id="gender-m" value="male" />
            <Label htmlFor="gender-m" className="font-normal cursor-pointer">
              {t("students.male")}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem id="gender-f" value="female" />
            <Label htmlFor="gender-f" className="font-normal cursor-pointer">
              {t("students.female")}
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dob">{t("students.dob")}</Label>
        <Input
          id="dob"
          type="date"
          value={toInputDate(value.dob)}
          onChange={(e) => onChange({ dob: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">{t("students.phone")}</Label>
        <Input
          id="phone"
          value={value.phone ?? ""}
          onChange={(e) => onChange({ phone: e.target.value })}
          placeholder={t("students.phone")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bloodGroup">{t("students.bloodGroup")}</Label>
        <Select
          value={value.bloodGroup ?? "__none__"}
          onValueChange={(v) => onChange({ bloodGroup: v === "__none__" ? "" : v })}
        >
          <SelectTrigger id="bloodGroup" className="w-full">
            <SelectValue placeholder={t("students.bloodGroup")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">—</SelectItem>
            {BLOOD_GROUPS.map((bg) => (
              <SelectItem key={bg} value={bg}>{bg}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function GuardianInfoFields({ value, onChange }: Omit<FieldProps, "classes" | "errors">) {
  const t = useT();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="guardianName">{t("students.guardianName")}</Label>
        <Input
          id="guardianName"
          value={value.guardianName ?? ""}
          onChange={(e) => onChange({ guardianName: e.target.value })}
          placeholder={t("students.guardianName")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="guardianPhone">{t("students.guardianPhone")}</Label>
        <Input
          id="guardianPhone"
          value={value.guardianPhone ?? ""}
          onChange={(e) => onChange({ guardianPhone: e.target.value })}
          placeholder={t("students.guardianPhone")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="guardianRelation">{t("students.guardianRelation")}</Label>
        <Select
          value={value.guardianRelation ?? "__none__"}
          onValueChange={(v) =>
            onChange({ guardianRelation: v === "__none__" ? undefined : (v as StudentInput["guardianRelation"]) })
          }
        >
          <SelectTrigger id="guardianRelation" className="w-full">
            <SelectValue placeholder={t("students.guardianRelation")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">—</SelectItem>
            {GUARDIAN_RELATIONS.map((r) => (
              <SelectItem key={r} value={r}>{t(`students.${r}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="address">{t("students.address")}</Label>
        <Textarea
          id="address"
          rows={2}
          value={value.address ?? ""}
          onChange={(e) => onChange({ address: e.target.value })}
          placeholder={t("students.address")}
        />
      </div>
    </div>
  );
}

export function AdditionalInfoFields({ value, onChange, classes }: FieldProps) {
  const t = useT();
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="classId">{t("students.class")}</Label>
        <Select
          value={value.classId ?? "__none__"}
          onValueChange={(v) => onChange({ classId: v === "__none__" ? "" : v })}
        >
          <SelectTrigger id="classId" className="w-full">
            <SelectValue placeholder={t("students.allClasses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">—</SelectItem>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}{c.code ? ` (${c.code})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="isHafiz" className="cursor-pointer">{t("students.isHafiz")}</Label>
          <p className="text-xs text-muted-foreground">{t("students.hafiz")}</p>
        </div>
        <Switch
          id="isHafiz"
          checked={!!value.isHafiz}
          onCheckedChange={(v) => onChange({ isHafiz: v })}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="isZakatEligible" className="cursor-pointer">
            {t("students.isZakatEligible")}
          </Label>
        </div>
        <Switch
          id="isZakatEligible"
          checked={!!value.isZakatEligible}
          onCheckedChange={(v) => onChange({ isZakatEligible: v })}
        />
      </div>
    </div>
  );
}
