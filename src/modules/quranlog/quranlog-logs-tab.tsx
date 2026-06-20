// QuranLogLogsTab — KPI strip + filters + table + Add dialog + delete confirm.
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Inbox, BookOpen, Users, TrendingUp, CheckCircle2 } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuranLogForm } from "./quranlog-form";
import type { QuranLogItem, QuranLogStats } from "./quranlog-types";

type StudentLite = { id: string; name: string };

export function QuranLogLogsTab() {
  const { t, dir, locale } = useApp();
  const [items, setItems] = useState<QuranLogItem[]>([]);
  const [stats, setStats] = useState<QuranLogStats | null>(null);
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStudent, setFilterStudent] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<QuranLogItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (filterStudent !== "all") params.set("studentId", filterStudent);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/quranlog?${params}`, { cache: "no-store" });
      const j = await res.json();
      if (j?.ok) {
        setItems(j.data.items as QuranLogItem[]);
        setStats(j.data.stats as QuranLogStats);
      }
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  }, [filterStudent, from, to]);

  useEffect(() => { void load(); }, [load]);

  // Load student list for filter
  useEffect(() => {
    fetch("/api/students?limit=200", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok) {
          setStudents((j.data.items || []).map((s: Record<string, unknown>) => ({
            id: s.id as string, name: s.name as string,
          })));
        }
      })
      .catch(() => setStudents([]));
  }, []);

  const cur = useMemo(
    () => (n: number) =>
      new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US", {
        maximumFractionDigits: 0,
      }).format(n || 0),
    [locale]
  );

  const fmtDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "bn" ? "bn-BD" : "en", {
        year: "numeric", month: "short", day: "numeric",
      }).format(new Date(iso));
    } catch {
      return iso.slice(0, 10);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/quranlog/${deleteTarget.id}`, { method: "DELETE" });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Failed");
      toast.success(t("common.delete"));
      setDeleteTarget(null);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const kpis = [
    { label: t("quranlog.totalPages"), value: cur(stats?.totalPages30 ?? 0), icon: BookOpen, tone: "from-emerald-500 to-teal-600" },
    { label: t("quranlog.activeReaders"), value: cur(stats?.activeReaders ?? 0), icon: Users, tone: "from-sky-500 to-cyan-600" },
    { label: t("quranlog.dailyAvg"), value: cur(stats?.dailyAvg ?? 0), icon: TrendingUp, tone: "from-amber-500 to-orange-600" },
    { label: t("quranlog.khatmCompletions"), value: cur(stats?.khatmCompletions ?? 0), icon: CheckCircle2, tone: "from-violet-500 to-purple-600" },
  ];

  return (
    <div dir={dir()} className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="border-border/60 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`grid size-10 place-items-center rounded-xl bg-gradient-to-br ${k.tone} text-white shadow-sm shrink-0`}>
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground truncate">{k.label}</p>
                  <p className="text-xl font-bold tabular-nums truncate">{k.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters + Add */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <Select value={filterStudent} onValueChange={setFilterStudent}>
          <SelectTrigger className="sm:max-w-[220px]">
            <SelectValue placeholder={t("quranlog.filterStudent")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("quranlog.allStudents")}</SelectItem>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="sm:max-w-[160px]" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="sm:max-w-[160px]" />
        <div className="sm:ms-auto">
          <Button
            onClick={() => setFormOpen(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
          >
            <Plus className="size-4" />
            {t("quranlog.logReading")}
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Inbox className="size-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">{t("quranlog.empty")}</p>
              <Button
                onClick={() => setFormOpen(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
              >
                <Plus className="size-4" />
                {t("quranlog.logReading")}
              </Button>
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("quranlog.student")}</TableHead>
                    <TableHead>{t("quranlog.date")}</TableHead>
                    <TableHead className="text-end">{t("quranlog.pages")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("quranlog.surah")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("quranlog.para")}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t("quranlog.notes")}</TableHead>
                    <TableHead className="text-end">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="truncate max-w-[160px]">{it.studentName}</span>
                          {it.className && (
                            <Badge variant="outline" className="w-fit mt-0.5 text-[10px]">{it.className}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(it.date)}</TableCell>
                      <TableCell className="text-end tabular-nums font-semibold">{cur(it.pagesRead)}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs">{it.surahName || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs">{it.paraNumber || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground truncate max-w-[200px]">{it.notes || "—"}</TableCell>
                      <TableCell className="text-end">
                        <Button
                          variant="ghost" size="icon" className="size-7 text-rose-600 hover:text-rose-700"
                          onClick={() => setDeleteTarget(it)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Add dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("quranlog.logReading")}</DialogTitle>
            <DialogDescription>{t("quranlog.subtitle")}</DialogDescription>
          </DialogHeader>
          <QuranLogForm open={formOpen} onOpenChange={setFormOpen} onSaved={load} />
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("quranlog.student")}: <strong>{deleteTarget?.studentName}</strong>
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
