"use client";
// LeaveTab — staff leave application + approval workflow.
// Summary cards + Apply Leave dialog + Leave requests table with approve/reject.
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays, CheckCircle2, XCircle, Clock, Plus, Loader2, Inbox,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

type TeacherLite = { id: string; name: string; nameArabic: string | null };

type LeaveRow = {
  id: string;
  teacherId: string;
  teacherName: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  createdAt: string;
};

const TYPES = ["sick", "casual", "annual", "maternity", "emergency"] as const;
const MS_PER_DAY = 86_400_000;

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  if (Number.isNaN(d1) || Number.isNaN(d2)) return 0;
  return Math.max(1, Math.round((d2 - d1) / MS_PER_DAY) + 1);
}

export function LeaveTab() {
  const { t, dir, locale } = useApp();
  const [rows, setRows] = useState<LeaveRow[]>([]);
  const [teachers, setTeachers] = useState<TeacherLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  // Form state
  const [teacherId, setTeacherId] = useState("");
  const [type, setType] = useState<string>("sick");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([
        fetch("/api/teachers/leave?limit=500", { cache: "no-store" }),
        fetch("/api/teachers?limit=300", { cache: "no-store" }),
      ]);
      const j1 = await a.json();
      const j2 = await b.json();
      if (j1?.ok) setRows(j1.data.items as LeaveRow[]);
      if (j2?.ok) {
        const list = (j2.data.items as TeacherLite[]) || [];
        setTeachers(list);
        if (list[0]) setTeacherId(list[0].id);
      }
    } catch {
      toast.error("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const summary = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      pending: rows.filter((r) => r.status === "pending").length,
      approvedThisMonth: rows.filter(
        (r) => r.status === "approved" && new Date(r.startDate) >= monthStart,
      ).length,
      rejected: rows.filter((r) => r.status === "rejected").length,
    };
  }, [rows]);

  const resetForm = () => {
    setType("sick");
    setStartDate("");
    setEndDate("");
    setReason("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId) return toast.error(t("teachers.name"));
    if (!startDate || !endDate) return toast.error(t("teachers.startDate"));
    if (!reason.trim()) return toast.error(t("teachers.reason"));
    if (new Date(endDate) < new Date(startDate)) {
      return toast.error(t("teachers.startDate"));
    }
    setSaving(true);
    try {
      const res = await fetch("/api/teachers/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, type, startDate, endDate, reason: reason.trim() }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Failed");
      toast.success(t("teachers.leaveSaved"));
      setDialogOpen(false);
      resetForm();
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const act = async (row: LeaveRow, status: "approved" | "rejected") => {
    setActingId(row.id);
    try {
      const res = await fetch(`/api/teachers/leave/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Failed");
      toast.success(t(`teachers.${status === "approved" ? "approved" : "rejected"}`));
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setActingId(null);
    }
  };

  const fmtDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat(
        locale === "ar" ? "ar" : locale === "bn" ? "bn-BD" : "en",
        { year: "numeric", month: "short", day: "numeric" },
      ).format(new Date(iso));
    } catch {
      return iso.slice(0, 10);
    }
  };

  const statusTone = (s: string): string => {
    if (s === "approved") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
    if (s === "rejected") return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  };

  return (
    <div className="space-y-4" dir={dir()}>
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard icon={<Clock className="size-5" />} tone="from-amber-500 to-orange-600"
          label={t("teachers.pending")} value={summary.pending} />
        <SummaryCard icon={<CheckCircle2 className="size-5" />} tone="from-emerald-500 to-teal-600"
          label={t("teachers.approved")} value={summary.approvedThisMonth} />
        <SummaryCard icon={<XCircle className="size-5" />} tone="from-rose-500 to-rose-700"
          label={t("teachers.rejected")} value={summary.rejected} />
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{rows.length} {t("teachers.leave")}</p>
        <Button
          onClick={() => { resetForm(); setDialogOpen(true); }}
          className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
        >
          <Plus className="size-4" />
          {t("teachers.applyLeave")}
        </Button>
      </div>

      {/* Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Inbox className="size-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">{t("teachers.leave")}</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("teachers.name")}</TableHead>
                    <TableHead>{t("teachers.leaveType")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("teachers.startDate")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("teachers.endDate")}</TableHead>
                    <TableHead className="text-end">{t("teachers.days")}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t("teachers.reason")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead className="text-end">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.teacherName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                          {t(`teachers.${r.type}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{fmtDate(r.startDate)}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{fmtDate(r.endDate)}</TableCell>
                      <TableCell className="text-end tabular-nums">{daysBetween(r.startDate, r.endDate)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-[200px] truncate" title={r.reason}>
                        {r.reason}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusTone(r.status)}>
                          {t(`teachers.${r.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-end">
                        {r.status === "pending" ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm" variant="outline"
                              disabled={actingId === r.id}
                              onClick={() => act(r, "approved")}
                              className="gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/60 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                            >
                              {actingId === r.id ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
                              {t("teachers.approve")}
                            </Button>
                            <Button
                              size="sm" variant="outline"
                              disabled={actingId === r.id}
                              onClick={() => act(r, "rejected")}
                              className="gap-1 border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/30"
                            >
                              <XCircle className="size-3" />
                              {t("teachers.reject")}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Apply Leave Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="size-5 text-emerald-600" />
              {t("teachers.applyLeave")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("teachers.name")}</Label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger><SelectValue placeholder={t("teachers.name")} /></SelectTrigger>
                <SelectContent>
                  {teachers.map((tch) => (
                    <SelectItem key={tch.id} value={tch.id}>{tch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("teachers.leaveType")}</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((tp) => (
                    <SelectItem key={tp} value={tp}>{t(`teachers.${tp}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("teachers.startDate")}</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("teachers.endDate")}</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("teachers.reason")}</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder={t("teachers.reason")}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={saving}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700">
                {saving && <Loader2 className="size-4 animate-spin" />}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ icon, tone, label, value }: {
  icon: React.ReactNode; tone: string; label: string; value: number;
}) {
  return (
    <Card className="overflow-hidden border-0 text-white bg-gradient-to-br shadow-sm">
      <CardContent className={`p-4 flex items-center justify-between gap-3 ${tone}`}>
        <div>
          <p className="text-xs uppercase tracking-wider opacity-90">{label}</p>
          <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
        </div>
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur-sm">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
