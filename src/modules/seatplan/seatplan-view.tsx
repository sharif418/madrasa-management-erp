// SeatPlanView — main shell for the Exam Seat Plan module.
// Violet→purple gradient header tile (matches Exams theme) + Islamic 8-point star pattern.
// Fetches exams + classes once; renders 2 sections: Create Seat Plan + Existing Plans.
"use client";
import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/store/app-store";
import { Armchair } from "lucide-react";
import { toast } from "sonner";
import { CreateSeatPlan } from "./create-seat-plan";
import { ExistingPlans } from "./existing-plans";
import type { ExamOption, ClassOption } from "./seatplan-types";

const ISLAMIC_PATTERN: React.CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='white' stroke-width='1'><polygon points='20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14'/></g></svg>\")",
  backgroundSize: "40px 40px",
  backgroundRepeat: "repeat",
};

export function SeatPlanView() {
  const { t, dir } = useApp();
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // Load exams + classes once on mount (used by the create form)
  useEffect(() => {
    (async () => {
      try {
        const [e, c] = await Promise.all([
          fetch("/api/exams?limit=100", { cache: "no-store" }),
          fetch("/api/students/classes", { cache: "no-store" }),
        ]);
        const ej = await e.json();
        const cj = await c.json();
        if (ej?.ok) {
          setExams((ej.data.items as ExamOption[]).map((x) => ({
            id: x.id, name: x.name, term: x.term ?? null,
            startDate: x.startDate ?? null, endDate: x.endDate ?? null,
            classId: x.classId ?? null, className: x.className ?? null,
          })));
        }
        if (cj?.ok) {
          setClasses(((cj.data.items as ClassOption[]) || []).map((c) => ({ id: c.id, name: c.name })));
        }
      } catch {
        toast.error("Failed to load exams / classes");
      } finally {
        setMetaLoading(false);
      }
    })();
  }, []);

  const onCreated = useCallback(() => setReloadKey((k) => k + 1), []);

  return (
    <div dir={dir()} className="space-y-6">
      {/* Header — violet→purple gradient tile (matches Exams theme) */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-600/20 ring-1 ring-white/30">
            <div className="pointer-events-none absolute inset-0 opacity-[0.15]" aria-hidden="true" style={ISLAMIC_PATTERN} />
            <Armchair className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("seatplan.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("seatplan.subtitle")}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <CreateSeatPlan exams={exams} classes={classes} loading={metaLoading} onCreated={onCreated} />
        </div>
        <div className="lg:col-span-3">
          <ExistingPlans reloadKey={reloadKey} />
        </div>
      </div>
    </div>
  );
}
