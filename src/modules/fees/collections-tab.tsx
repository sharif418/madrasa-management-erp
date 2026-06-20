// CollectionsTab — recent fee collections with filters + summary cards.
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Wallet, TrendingUp, Percent, Inbox, Loader2, Calculator } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { STATUS_TONES, FEE_TYPE_TONES } from "./fees-types";
import type { FeeCollectionItem, CollectionsSummary } from "./fees-types";

type ClassItem = { id: string; name: string };

const STATUSES = ["all", "paid", "partial", "pending", "overdue"] as const;
const TYPES = ["all", "tuition", "admission", "exam", "hostel", "transport"] as const;

export function CollectionsTab() {
  const { t, dir, locale } = useApp();
  const [items, setItems] = useState<FeeCollectionItem[]>([]);
  const [summary, setSummary] = useState<CollectionsSummary>({
    totalCollected: 0, totalOutstanding: 0, collectionRate: 0, count: 0,
  });
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [calcLoading, setCalcLoading] = useState(false);

  const [status, setStatus] = useState<string>("all");
  const [classId, setClassId] = useState<string>("all");
  const [type, setType] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status, classId, type, limit: "200",
      });
      const [a, b] = await Promise.all([
        fetch(`/api/fee-structures/collections?${params}`, { cache: "no-store" }),
        fetch("/api/students/classes", { cache: "no-store" }),
      ]);
      const j1 = await a.json();
      const j2 = await b.json();
      if (j1?.ok) {
        setItems(j1.data.items as FeeCollectionItem[]);
        setSummary(j1.data.summary as CollectionsSummary);
      }
      if (j2?.ok) setClasses((j2.data.items as ClassItem[]) || []);
    } catch {
      toast.error("Failed to load collections");
    } finally {
      setLoading(false);
    }
  }, [status, classId, type]);

  useEffect(() => { void load(); }, [load]);

  const calcLateFees = async () => {
    setCalcLoading(true);
    try {
      const res = await fetch("/api/fees/late-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: classId === "all" ? undefined : classId }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Failed");
      toast.success(t("fees.lateFeesUpdated", { count: j.data.updated }));
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setCalcLoading(false);
    }
  };

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

  const stats = [
    { label: t("fees.totalCollected"), value: summary.totalCollected, icon: Wallet, tone: "from-emerald-600 to-emerald-800" },
    { label: t("fees.totalOutstanding"), value: summary.totalOutstanding, icon: TrendingUp, tone: "from-rose-500 to-rose-700" },
    { label: t("fees.collectionRate"), value: summary.collectionRate, suffix: "%", icon: Percent, tone: "from-teal-600 to-emerald-700" },
  ];

  return (
    <div dir={dir()} className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          stats.map((s) => (
            <Card
              key={s.label}
              className={`overflow-hidden border-0 text-white bg-gradient-to-br ${s.tone} shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
            >
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider opacity-90">{s.label}</p>
                  <p className="text-xl font-bold mt-1 tabular-nums">
                    {s.suffix === "%" ? `${s.value}%` : `৳${cur(s.value)}`}
                  </p>
                </div>
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur-sm">
                  <s.icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue placeholder={t("fees.filterStatus")} /></SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? t("common.all") : t(`fees.status${s.charAt(0).toUpperCase()}${s.slice(1)}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger><SelectValue placeholder={t("fees.filterClass")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("fees.allClasses")}</SelectItem>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue placeholder={t("fees.filterType")} /></SelectTrigger>
          <SelectContent>
            {TYPES.map((tp) => (
              <SelectItem key={tp} value={tp}>
                {tp === "all" ? t("common.all") : t(`fees.${tp}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={calcLateFees}
          disabled={calcLoading}
          variant="outline"
          className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/60 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
        >
          {calcLoading ? <Loader2 className="size-4 animate-spin" /> : <Calculator className="size-4" />}
          {t("fees.calculateLateFees")}
        </Button>
      </div>

      {/* Collections table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Inbox className="size-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">{t("fees.collections")}</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("fees.student")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("fees.feeType")}</TableHead>
                    <TableHead className="text-end">{t("fees.amount")}</TableHead>
                    <TableHead className="text-end hidden sm:table-cell">{t("fees.paidAmount")}</TableHead>
                    <TableHead className="text-end hidden md:table-cell">{t("fees.lateFee")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t("fees.method")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("fees.dueDate")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("fees.paidDate")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="truncate max-w-[140px]">{c.studentName}</span>
                          {c.className && (
                            <span className="text-[10px] text-muted-foreground">{c.className}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {c.feeType && (
                          <Badge variant="secondary" className={FEE_TYPE_TONES[c.feeType] || ""}>
                            {t(`fees.${c.feeType}`)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">৳{cur(c.amount)}</TableCell>
                      <TableCell className="text-end tabular-nums hidden sm:table-cell">
                        ৳{cur(c.paidAmount)}
                      </TableCell>
                      <TableCell className="text-end tabular-nums hidden md:table-cell">
                        {c.lateFee > 0 ? (
                          <Badge variant="outline" className="bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                            +৳{cur(c.lateFee)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={STATUS_TONES[c.status] || ""}>
                          {t(`fees.status${String(c.status).charAt(0).toUpperCase()}${String(c.status).slice(1)}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {c.method || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {fmtDate(c.dueDate)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {fmtDate(c.paidDate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
