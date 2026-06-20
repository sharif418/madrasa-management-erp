// PtmHistoryTab — summary stats + completed meetings table.
// Pulls all PTM sessions (regardless of status) to compute totals and
// completion rate. RTL-aware.
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarCheck, CheckCircle2, TrendingUp, Inbox } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PtmItem } from "./ptm-types";

type Summary = { label: string; value: string; icon: typeof CalendarCheck; tone: string };

export function PtmHistoryTab() {
  const { t, dir, locale } = useApp();
  const [items, setItems] = useState<PtmItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ptm", { cache: "no-store" });
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
        year: "numeric", month: "short", day: "numeric",
      }).format(new Date(iso));
    } catch {
      return iso.slice(0, 10);
    }
  };

  const stats = useMemo(() => {
    const total = items.length;
    const completed = items.filter((i) => i.status === "completed").length;
    const cancelled = items.filter((i) => i.status === "cancelled").length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, cancelled, rate };
  }, [items]);

  const completedItems = useMemo(
    () => items
      .filter((i) => i.status === "completed")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [items]
  );

  const summary: Summary[] = [
    { label: t("ptm.totalMeetings"), value: String(stats.total), icon: CalendarCheck, tone: "from-cyan-500 to-blue-600" },
    { label: t("ptm.completed"), value: String(stats.completed), icon: CheckCircle2, tone: "from-emerald-500 to-teal-600" },
    { label: t("ptm.completionRate"), value: `${stats.rate}%`, icon: TrendingUp, tone: "from-amber-500 to-orange-600" },
    { label: t("ptm.cancelled"), value: String(stats.cancelled), icon: Inbox, tone: "from-rose-500 to-pink-600" },
  ];

  return (
    <div dir={dir()} className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          summary.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`grid size-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${s.tone} text-white`}>
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                      <p className="text-xl font-bold tabular-nums">{s.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Completed meetings table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : completedItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Inbox className="size-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">{t("ptm.noHistory")}</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("ptm.date")}</TableHead>
                    <TableHead>{t("ptm.student")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("ptm.teacher")}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t("ptm.topic")}</TableHead>
                    <TableHead>{t("ptm.outcome")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedItems.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {fmtDate(m.date)}
                        <div className="text-[10px] text-muted-foreground">{m.time}</div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="truncate max-w-[140px]">{m.studentName}</div>
                        {m.className && (
                          <Badge variant="outline" className="mt-0.5 text-[10px]">{m.className}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm truncate max-w-[140px]">
                        {m.teacherName}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-[200px]">
                        <span className="line-clamp-2">{m.topic || "—"}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[260px]">
                        <span className="line-clamp-2">{m.notes || "—"}</span>
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
