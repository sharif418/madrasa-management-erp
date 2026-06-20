// PtmUpcomingTab — list scheduled + cancelled upcoming meetings as cards.
// Includes "Schedule Meeting" button (opens PtmForm dialog) and per-card
// Mark Complete / Cancel actions. RTL-aware.
"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus, CalendarCheck, Clock, CheckCircle2, XCircle, Inbox,
  User, GraduationCap, Tag, Loader2,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PtmForm } from "./ptm-form";
import { PtmCompleteDialog } from "./ptm-complete-dialog";
import {
  type PtmItem, type PtmStatus,
  PTM_STATUS_TONE, PTM_STATUS_KEY, initialsOf,
} from "./ptm-types";

export function PtmUpcomingTab() {
  const { t, dir, locale } = useApp();
  const [items, setItems] = useState<PtmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<PtmItem | null>(null);
  const [cancelTarget, setCancelTarget] = useState<PtmItem | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ptm?status=scheduled", { cache: "no-store" });
      const j = await res.json();
      if (j?.ok) setItems(j.data.items as PtmItem[]);
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const fmtDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "bn" ? "bn-BD" : "en", {
        weekday: "short", year: "numeric", month: "short", day: "numeric",
      }).format(new Date(iso));
    } catch {
      return iso.slice(0, 10);
    }
  };

  const fmtTime = (t24: string) => {
    const [hStr, m] = t24.split(":");
    const h = Number(hStr);
    if (!Number.isFinite(h)) return t24;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${m} ${ampm}`;
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/ptm/${cancelTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Failed");
      toast.success(t("common.save"));
      setCancelTarget(null);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div dir={dir()} className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-end">
        <Button
          onClick={() => setFormOpen(true)}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600"
        >
          <Plus className="size-4" />
          {t("ptm.schedule")}
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Inbox className="size-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t("ptm.empty")}</p>
            <Button
              onClick={() => setFormOpen(true)}
              className="mt-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600"
            >
              <Plus className="size-4" />
              {t("ptm.schedule")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((m) => (
            <PtmCard
              key={m.id}
              m={m}
              fmtDate={fmtDate}
              fmtTime={fmtTime}
              onMarkComplete={() => setCompleteTarget(m)}
              onCancel={() => setCancelTarget(m)}
            />
          ))}
        </div>
      )}

      {/* Schedule dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("ptm.schedule")}</DialogTitle>
            <DialogDescription>{t("ptm.subtitle")}</DialogDescription>
          </DialogHeader>
          <PtmForm open={formOpen} onOpenChange={setFormOpen} onSaved={load} />
        </DialogContent>
      </Dialog>

      {/* Mark complete dialog */}
      <PtmCompleteDialog
        target={completeTarget}
        onClose={() => setCompleteTarget(null)}
        onSaved={load}
      />

      {/* Cancel confirm */}
      <AlertDialog open={!!cancelTarget} onOpenChange={(v) => !v && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("ptm.confirmCancel")}</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget?.studentName} ↔ {cancelTarget?.teacherName}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {cancelling && <Loader2 className="size-4 animate-spin" />}
              {t("common.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PtmCard({
  m, fmtDate, fmtTime, onMarkComplete, onCancel,
}: {
  m: PtmItem;
  fmtDate: (s: string) => string;
  fmtTime: (s: string) => string;
  onMarkComplete: () => void;
  onCancel: () => void;
}) {
  const { t } = useApp();
  const status = m.status as PtmStatus;
  return (
    <Card className="border-border/60 transition-all hover:shadow-md hover:-translate-y-0.5">
      <CardContent className="p-4 space-y-3">
        {/* Student row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-sm font-semibold">
              {initialsOf(m.studentName)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate">{m.studentName}</p>
              {m.className && (
                <p className="text-xs text-muted-foreground truncate">{m.className}</p>
              )}
            </div>
          </div>
          <Badge variant="secondary" className={PTM_STATUS_TONE[status]}>
            {t(PTM_STATUS_KEY[status])}
          </Badge>
        </div>

        {/* Teacher */}
        <div className="flex items-center gap-2 text-sm">
          <GraduationCap className="size-4 text-muted-foreground shrink-0" />
          <span className="truncate">{m.teacherName}</span>
          {m.teacherDesignation && (
            <span className="text-xs text-muted-foreground truncate">· {m.teacherDesignation}</span>
          )}
        </div>

        {/* Date + time + duration */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <CalendarCheck className="size-3.5 text-muted-foreground" />
            <span className="truncate">{fmtDate(m.date)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-muted-foreground" />
            <span>{fmtTime(m.time)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="size-3.5 text-muted-foreground" />
            <span>{m.duration} min</span>
          </div>
        </div>

        {/* Topic */}
        {m.topic && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/40 rounded-md px-2 py-1.5">
            <Tag className="size-3.5 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{m.topic}</span>
          </div>
        )}

        {/* Actions */}
        {status === "scheduled" && (
          <div className="flex justify-end gap-2 pt-1 border-t border-border/40">
            <Button size="sm" variant="outline" onClick={onCancel}>
              <XCircle className="size-3.5 text-rose-500" />
              {t("ptm.cancel")}
            </Button>
            <Button
              size="sm"
              onClick={onMarkComplete}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
            >
              <CheckCircle2 className="size-3.5" />
              {t("ptm.markComplete")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
