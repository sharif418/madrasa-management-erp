"use client";
// GuardianPortalDialog — public, read-only parent portal accessible from the
// landing page. Three-step flow inside a single dialog:
//   step="phone"  → enter guardian phone, calls /api/guardian/lookup
//   step="list"   → list of children (cards), click one to view detail
//   step="detail" → GuardianStudentDetail (comprehensive read-only view)
import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Moon, Loader2, Search, Users, PhoneCall, AlertCircle, Heart } from "lucide-react";
import { toast } from "sonner";
import { GuardianStudentCard, type GuardianStudentSummary } from "./guardian-student-card";
import { GuardianStudentDetail } from "./guardian-student-detail";

type Step = "phone" | "list" | "detail";

export function GuardianPortalDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t, dir } = useApp();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<GuardianStudentSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Reset state every time the dialog opens
  useEffect(() => {
    if (open) {
      setStep("phone");
      setPhone("");
      setStudents([]);
      setSelectedId(null);
      setLoading(false);
    }
  }, [open]);

  const lookup = useCallback(async () => {
    const p = phone.trim();
    if (!p) {
      toast.error(t("guardian.enterPhone"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/guardian/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: p }),
      });
      const json = await res.json().catch(() => ({ ok: false, error: "Invalid response" }));
      if (!json.ok) {
        // 404 → no students found; show toast but stay on phone step
        toast.error(json.error || t("guardian.lookupFailed"));
        return;
      }
      setStudents(json.data.students as GuardianStudentSummary[]);
      setStep("list");
    } catch {
      toast.error(t("guardian.lookupFailed"));
    } finally {
      setLoading(false);
    }
  }, [phone, t]);

  const selectStudent = useCallback((id: string) => {
    setSelectedId(id);
    setStep("detail");
  }, []);

  const backToList = useCallback(() => {
    setSelectedId(null);
    setStep("list");
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[520px]"
        // dir is set on inner wrapper so dialog chrome stays LTR
      >
        {/* Header (gradient) */}
        <DialogHeader className="space-y-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur ring-1 ring-white/30">
              <Moon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold text-white sm:text-lg">
                {t("guardian.title")}
              </DialogTitle>
              <DialogDescription className="text-xs text-white/80 sm:text-sm">
                {t("guardian.subtitle")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body (scrollable) */}
        <div
          dir={dir}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5"
          style={{ scrollbarWidth: "thin" }}
        >
          {step === "phone" && (
            <PhoneStep
              phone={phone}
              setPhone={setPhone}
              loading={loading}
              onLookup={lookup}
              t={t}
            />
          )}

          {step === "list" && (
            <ListStep students={students} onSelect={selectStudent} t={t} />
          )}

          {step === "detail" && selectedId && (
            <GuardianStudentDetail studentId={selectedId} onBack={backToList} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- Step 1: Phone ----
function PhoneStep({
  phone, setPhone, loading, onLookup, t,
}: {
  phone: string;
  setPhone: (v: string) => void;
  loading: boolean;
  onLookup: () => void;
  t: (k: string) => string;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
            <PhoneCall className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">{t("guardian.enterPhone")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("guardian.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="guardian-phone">{t("guardian.enterPhone")}</Label>
        <Input
          id="guardian-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={t("guardian.phonePlaceholder")}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && onLookup()}
          dir="ltr"
          className="h-11 text-base"
        />
      </div>

      <Button
        className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        onClick={onLookup}
        disabled={loading || !phone.trim()}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        {t("guardian.lookup")}
      </Button>

      <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
        <Heart className="size-3 text-rose-500 fill-rose-500" />
        <span>{t("common.appName")}</span>
      </div>
    </div>
  );
}

// ---- Step 2: List of children ----
function ListStep({
  students, onSelect, t,
}: {
  students: GuardianStudentSummary[];
  onSelect: (id: string) => void;
  t: (k: string) => string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="size-4 text-emerald-600" />
        <h3 className="text-sm font-semibold">{t("guardian.yourChildren")}</h3>
        <span className="ms-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          {students.length}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{t("guardian.selectChild")}</p>

      {students.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center">
          <AlertCircle className="mx-auto mb-2 size-6 text-muted-foreground" />
          <p className="text-sm font-medium">{t("guardian.noStudents")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("guardian.noStudentsDesc")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((s) => (
            <GuardianStudentCard key={s.id} s={s} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}
