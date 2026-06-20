// WaiversListTab — summary cards + filter + table of waivers + Add/Edit/Delete.
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Inbox, Gift, TrendingDown, Users, Percent } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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
import { WaiverForm } from "./waiver-form";
import { WaiverSummaryCards } from "./waiver-summary-cards";
import { WAIVER_TYPES, WAIVER_TYPE_KEYS, type WaiverItem, type WaiverType } from "./waivers-types";

export function WaiversListTab() {
  const { t, dir, locale } = useApp();
  const [items, setItems] = useState<WaiverItem[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WaiverItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WaiverItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/waivers", { cache: "no-store" });
      const j = await res.json();
      if (j?.ok) {
        setItems(j.data.items as WaiverItem[]);
        setActiveCount(j.data.activeCount as number);
      }
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const cur = useMemo(
    () => (n: number) =>
      new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US", {
        maximumFractionDigits: 0,
      }).format(n || 0),
    [locale]
  );

  const fmtDate = (iso: string | null) => {
    if (!iso) return "—";
    try {
      return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "bn" ? "bn-BD" : "en", {
        year: "numeric", month: "short", day: "numeric",
      }).format(new Date(iso));
    } catch {
      return iso.slice(0, 10);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (filterType !== "all" && it.type !== filterType) return false;
      if (!q) return true;
      return (
        it.studentName.toLowerCase().includes(q) ||
        (it.rollNo ?? "").toLowerCase().includes(q) ||
        (it.className ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, filterType, search]);

  const totalFixed = filtered.reduce((acc, w) => acc + (w.fixedAmount || 0), 0);
  const pctItems = filtered.filter((w) => w.discountType === "percentage");
  const avgPct = pctItems.length > 0
    ? pctItems.reduce((acc, w) => acc + (w.percentage || 0), 0) / pctItems.length
    : 0;
  const uniqueStudents = new Set(filtered.map((w) => w.studentId)).size;

  const summary = [
    { label: t("waivers.totalActive"), value: String(activeCount), icon: Gift, tone: "from-emerald-500 to-teal-600" },
    { label: t("waivers.totalDiscount"), value: `৳${cur(totalFixed)}`, icon: TrendingDown, tone: "from-rose-500 to-pink-600" },
    { label: t("waivers.studentsWithWaivers"), value: String(uniqueStudents), icon: Users, tone: "from-sky-500 to-cyan-600" },
    { label: t("waivers.avgDiscount"), value: `${cur(avgPct)}%`, icon: Percent, tone: "from-amber-500 to-orange-600" },
  ];

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (w: WaiverItem) => { setEditing(w); setFormOpen(true); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/waivers/${deleteTarget.id}`, { method: "DELETE" });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Failed");
      toast.success(t("common.delete"));
      setDeleteTarget(null);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div dir={dir()} className="space-y-4">
      <WaiverSummaryCards loading={loading} stats={summary} />

      {/* Filters + Add */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <Input
          placeholder={t("waivers.searchStudent")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="sm:max-w-[200px]"><SelectValue placeholder={t("waivers.waiverType")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {WAIVER_TYPE_KEYS.map((k) => (
              <SelectItem key={k} value={k}>{t(WAIVER_TYPES[k].labelKey)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="sm:ms-auto">
          <Button
            onClick={openAdd}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
          >
            <Plus className="size-4" />
            {t("waivers.addWaiver")}
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Inbox className="size-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">{t("waivers.empty")}</p>
              <Button
                onClick={openAdd}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
              >
                <Plus className="size-4" />
                {t("waivers.addWaiver")}
              </Button>
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("waivers.student")}</TableHead>
                    <TableHead>{t("waivers.waiverType")}</TableHead>
                    <TableHead className="text-end">{t("waivers.discount")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("waivers.validPeriod")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead className="text-end">{t("waivers.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((w) => {
                    const meta = WAIVER_TYPES[w.type as WaiverType] || WAIVER_TYPES.scholarship;
                    const Icon = meta.icon;
                    return (
                      <TableRow key={w.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="truncate max-w-[160px]">{w.studentName}</span>
                            {w.className && (
                              <Badge variant="outline" className="w-fit mt-0.5 text-[10px]">{w.className}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`gap-1 ${meta.tone}`}>
                            <Icon className="size-3" />
                            {t(meta.labelKey)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-end tabular-nums font-semibold">
                          {w.discountType === "percentage"
                            ? `${cur(w.percentage)}%`
                            : `৳${cur(w.fixedAmount)}`}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {fmtDate(w.validFrom)} → {fmtDate(w.validUntil)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={w.expired ? "outline" : "secondary"}
                            className={w.expired
                              ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"}
                          >
                            {w.expired ? t("waivers.expired") : t("waivers.active")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-end">
                          <div className="inline-flex gap-1">
                            <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(w)}>
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="size-7 text-rose-600 hover:text-rose-700"
                              onClick={() => setDeleteTarget(w)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t("waivers.editWaiver") : t("waivers.addWaiver")}</DialogTitle>
            <DialogDescription>{t("waivers.subtitle")}</DialogDescription>
          </DialogHeader>
          <WaiverForm
            open={formOpen}
            onOpenChange={setFormOpen}
            initial={editing}
            onSaved={load}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("waivers.waiverType")} — <strong>{deleteTarget?.studentName}</strong>
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
