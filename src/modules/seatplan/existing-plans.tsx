// ExistingPlans — list of seat plan cards with View Grid / Generate Admit Cards / Delete.
// Reloads when `reloadKey` changes (parent bumps it after a new plan is created).
"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2, Grid3x3, FileDown, Trash2, Inbox, Armchair, DoorOpen,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SeatGridDialog } from "./seat-grid-dialog";
import type { SeatPlan, StudentOption } from "./seatplan-types";

type Props = { reloadKey: number };

export function ExistingPlans({ reloadKey }: Props) {
  const { t, dir, locale } = useApp();
  const [plans, setPlans] = useState<SeatPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [gridPlan, setGridPlan] = useState<SeatPlan | null>(null);
  const [gridStudents, setGridStudents] = useState<StudentOption[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<SeatPlan | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/seatplan", { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) setPlans((j.data.items as SeatPlan[]) || []);
      else throw new Error(j?.error || "Failed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load, reloadKey]);

  const dateStr = (iso: string) =>
    new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US", {
      day: "2-digit", month: "short", year: "numeric",
    }).format(new Date(iso));

  // Open the visual grid dialog — also fetch student details for the assigned studentIds
  const openGrid = async (p: SeatPlan) => {
    setGridPlan(p);
    const ids = p.assignments.map((a) => a.studentId);
    if (ids.length === 0) { setGridStudents([]); return; }
    try {
      // Use /api/students with search by ID — fallback: fetch all then filter
      const r = await fetch(`/api/students?limit=100&classId=${p.classId ?? ""}`, { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) {
        const all = (j.data.items as StudentOption[]) || [];
        const idSet = new Set(ids);
        setGridStudents(all.filter((s) => idSet.has(s.id)).map((s) => ({
          id: s.id, name: s.name, nameArabic: s.nameArabic ?? null, rollNo: s.rollNo ?? null,
        })));
      }
    } catch {
      setGridStudents([]);
    }
  };

  const generateAdmitCards = async (p: SeatPlan) => {
    const ids = p.assignments.map((a) => a.studentId);
    if (ids.length === 0) return toast.error(t("seatplan.students"));
    setGeneratingId(p.id);
    const tid = toast.loading(t("seatplan.generating"));
    try {
      const r = await fetch("/api/seatplan/admit-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: p.examId, studentIds: ids }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => null);
        throw new Error(j?.error || `Failed (${r.status})`);
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      toast.success(t("seatplan.generated"), { id: tid });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed", { id: tid });
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const r = await fetch(`/api/seatplan/${deleteTarget.id}`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Failed");
      toast.success(t("common.delete"));
      setDeleteTarget(null);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div dir={dir()} className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Armchair className="size-4 text-violet-600" />
          {t("seatplan.existing")}
          {!loading && (
            <Badge variant="outline" className="ms-1">{plans.length}</Badge>
          )}
        </h2>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
              <Inbox className="size-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{t("seatplan.empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((p) => (
            <Card
              key={p.id}
              className="group relative overflow-hidden border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{p.examName}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <DoorOpen className="size-3" />
                      {p.roomName}
                      {p.className && <span className="opacity-70"> · {p.className}</span>}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 shrink-0">
                    {p.rows}×{p.cols}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{dateStr(p.createdAt)}</span>
                  <span className="font-medium text-foreground">
                    {p.studentCount} {t("seatplan.students")}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openGrid(p)}
                    className="gap-1.5 h-8"
                  >
                    <Grid3x3 className="size-3.5" />
                    {t("seatplan.viewGrid")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => generateAdmitCards(p)}
                    disabled={generatingId === p.id}
                    className="gap-1.5 h-8 bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600"
                  >
                    {generatingId === p.id
                      ? <Loader2 className="size-3.5 animate-spin" />
                      : <FileDown className="size-3.5" />}
                    {t("seatplan.generateAdmitCards")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteTarget(p)}
                    className="gap-1.5 h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Visual grid dialog */}
      <SeatGridDialog
        plan={gridPlan}
        students={gridStudents}
        open={!!gridPlan}
        onOpenChange={(v) => !v && setGridPlan(null)}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("seatplan.deleteConfirm")} — <strong>{deleteTarget?.examName} · {deleteTarget?.roomName}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
