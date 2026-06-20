// Certificate builder form — student selector, type picker, custom text, generate.
"use client";
import { useMemo, useState } from "react";
import {
  Award, BookMarked, Trophy, Medal, Search, Loader2, FileDown, Users, X,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { CertType, CertStudent } from "./certificate-types";

const TYPE_OPTIONS: { key: CertType; icon: typeof Award }[] = [
  { key: "completion", icon: Award },
  { key: "hifz", icon: BookMarked },
  { key: "merit", icon: Trophy },
  { key: "participation", icon: Medal },
];

export type CertificateBuilderProps = {
  students: CertStudent[];
  student: CertStudent | null;
  onStudentChange: (s: CertStudent | null) => void;
  certificateType: CertType;
  onCertificateTypeChange: (t: CertType) => void;
  customText: string;
  onCustomTextChange: (s: string) => void;
  onGenerated?: () => void;
};

export function CertificateBuilder({
  students, student, onStudentChange,
  certificateType, onCertificateTypeChange,
  customText, onCustomTextChange, onGenerated,
}: CertificateBuilderProps) {
  const { t, dir } = useApp();
  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students.slice(0, 50);
    return students
      .filter((s) =>
        s.name.toLowerCase().includes(q) ||
        (s.nameArabic || "").toLowerCase().includes(q) ||
        (s.rollNo || "").toLowerCase().includes(q) ||
        (s.className || "").toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [students, search]);

  const handleGenerate = async () => {
    if (!student) {
      toast.error(t("certificates.selectStudentFirst"));
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/certificates/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          certificateType,
          customText: customText.trim() || undefined,
        }),
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast.success(t("certificates.generated"));
      onGenerated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div dir={dir()} className="space-y-5">
      {/* Student selector */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground">
          {t("certificates.selectStudent")}
        </Label>
        {student ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2.5 dark:border-emerald-900 dark:bg-emerald-950/30">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
                {student.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{student.name}</p>
                <p className="truncate text-[11px] text-muted-foreground" dir="ltr">
                  {student.rollNo ? `#${student.rollNo}` : "—"}
                  {student.className ? ` · ${student.className}` : ""}
                  {student.isHafiz ? " · Hafiz" : ""}
                </p>
              </div>
            </div>
            <Button
              size="icon" variant="ghost" className="size-7 shrink-0"
              onClick={() => { onStudentChange(null); }}
              aria-label="clear"
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setPickerOpen(true)}
            className="w-full justify-start gap-2 text-muted-foreground"
          >
            <Search className="size-4" />
            {t("certificates.studentSearch")}
          </Button>
        )}
      </div>

      {/* Certificate type selector */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground">
          {t("certificates.certificateType")}
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {TYPE_OPTIONS.map(({ key, icon: Icon }) => {
            const active = certificateType === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onCertificateTypeChange(key)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all hover:-translate-y-0.5",
                  active
                    ? "border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-sm dark:border-amber-700 dark:from-amber-950/40 dark:to-yellow-950/30"
                    : "border-border bg-card hover:border-amber-300 dark:hover:border-amber-800"
                )}
              >
                <div
                  className={cn(
                    "grid size-9 place-items-center rounded-lg text-white shadow-sm",
                    active
                      ? "bg-gradient-to-br from-amber-500 to-yellow-600 shadow-amber-500/30"
                      : "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20"
                  )}
                >
                  <Icon className="size-[18px]" />
                </div>
                <span className={cn(
                  "text-[11px] font-medium leading-tight",
                  active ? "text-amber-700 dark:text-amber-300" : ""
                )}>
                  {t(`certificates.${key}`)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom text */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground">
          {t("certificates.customText")}
        </Label>
        <Textarea
          value={customText}
          onChange={(e) => onCustomTextChange(e.target.value)}
          placeholder={t("certificates.customTextPlaceholder")}
          rows={3}
          maxLength={220}
          className="resize-none text-sm"
        />
        <p className="text-right text-[10px] text-muted-foreground">
          {customText.length}/220
        </p>
      </div>

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={generating || !student}
        className="w-full gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-md shadow-amber-500/30 hover:from-amber-600 hover:to-yellow-700"
      >
        {generating ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <FileDown className="size-4" />
        )}
        {generating ? t("certificates.generating") : t("certificates.generate")}
      </Button>

      {/* Student picker dialog */}
      {pickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-border bg-card p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            dir={dir()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Users className="size-4 text-emerald-600" />
                {t("certificates.selectStudent")}
              </h3>
              <Button size="icon" variant="ghost" className="size-7" onClick={() => setPickerOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("certificates.studentSearch")}
                className="pl-9"
                autoFocus
              />
            </div>
            <ScrollArea className="h-72 rounded-lg border border-border">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  {t("certificates.noStudents")}
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {filtered.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onStudentChange(s);
                          setPickerOpen(false);
                          setSearch("");
                        }}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-start transition-colors hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[11px] font-bold text-white">
                            {s.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{s.name}</p>
                            {s.nameArabic && (
                              <p className="truncate text-[11px] text-muted-foreground" dir="rtl">
                                {s.nameArabic}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {s.isHafiz && (
                            <Badge variant="outline" className="border-amber-400 bg-amber-50 text-[9px] text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                              Hafiz
                            </Badge>
                          )}
                          <span className="text-[11px] text-muted-foreground" dir="ltr">
                            {s.rollNo ? `#${s.rollNo}` : "—"}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {filtered.length} / {students.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
