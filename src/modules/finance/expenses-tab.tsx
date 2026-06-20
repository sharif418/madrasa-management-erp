"use client";
// ExpensesTab — dedicated expense tracking UI for the Finance module.
// Summary cards + Add Expense dialog + expenses table + category pie chart.
import * as React from "react";
import { useApp } from "@/store/app-store";
import { toast } from "sonner";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import {
  Plus, Trash2, ArrowDownCircle, TrendingUp, TrendingDown,
  Briefcase, Zap, Wrench, Utensils, Bus, PartyPopper, MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AddExpenseDialog } from "./expense-dialog";

type ExpenseItem = {
  id: string;
  amount: number;
  category: string;
  description?: string | null;
  paymentMethod?: string | null;
  date: string;
  fund: { name: string; type: string };
};

type ExpenseData = {
  items: ExpenseItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  categoryBreakdown: { category: string; amount: number }[];
  total30d: number;
  totalPrev30d: number;
};

const CATEGORIES = [
  { value: "salary", icon: Briefcase, color: "#10b981" },
  { value: "utilities", icon: Zap, color: "#f59e0b" },
  { value: "maintenance", icon: Wrench, color: "#64748b" },
  { value: "food", icon: Utensils, color: "#f43f5e" },
  { value: "transport", icon: Bus, color: "#14b8a6" },
  { value: "event", icon: PartyPopper, color: "#a855f7" },
  { value: "other", icon: MoreHorizontal, color: "#94a3b8" },
] as const;

const catBadge: Record<string, string> = {
  salary: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  utilities: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  maintenance: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  food: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  transport: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  event: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  other: "bg-muted text-muted-foreground",
};

const catLabelKey = (c: string) => (c === "transport" ? "transportExp" : c);

export function ExpensesTab({ reloadOverview }: { reloadOverview: () => void }) {
  const { t, dir, locale } = useApp();
  const [data, setData] = React.useState<ExpenseData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [addOpen, setAddOpen] = React.useState(false);

  const cur = (n: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US", {
      maximumFractionDigits: 0,
    }).format(n || 0);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/finance/expenses?limit=50", { credentials: "include" });
      const j = await r.json();
      if (j?.ok) setData(j.data as ExpenseData);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const onDelete = async (id: string) => {
    if (!confirm(t("common.delete"))) return;
    try {
      const r = await fetch(`/api/finance/transactions/${id}`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error);
      toast.success(t("finance.expenseDeleted"));
      void load();
      reloadOverview();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const total30d = data?.total30d ?? 0;
  const prev30d = data?.totalPrev30d ?? 0;
  const trendPct = prev30d > 0 ? Math.round(((total30d - prev30d) / prev30d) * 100) : 0;
  const topCats = (data?.categoryBreakdown ?? []).slice(0, 3);

  return (
    <div className="space-y-4" dir={dir()}>
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-0 bg-gradient-to-br from-rose-500 to-rose-700 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider opacity-90">{t("finance.totalExpenses")}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">৳{cur(total30d)}</p>
                <p className="mt-0.5 text-[10px] opacity-80">{t("finance.lastMonth")}</p>
              </div>
              <div className="grid size-10 place-items-center rounded-xl bg-white/15">
                <ArrowDownCircle className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("finance.byCategory")}</p>
            <ul className="mt-2 space-y-1.5">
              {topCats.length === 0 && <li className="text-sm text-muted-foreground">—</li>}
              {topCats.map((c) => {
                const cat = CATEGORIES.find((x) => x.value === c.category) ?? CATEGORIES[6];
                const Icon = cat.icon;
                return (
                  <li key={c.category} className="flex items-center gap-2 text-sm">
                    <Icon className="size-3.5" style={{ color: cat.color }} />
                    <span className="flex-1 truncate">{t(`finance.${catLabelKey(c.category)}`)}</span>
                    <span className="font-semibold tabular-nums">৳{cur(c.amount)}</span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card className="border border-border/60">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("finance.expenseTrend")}</p>
            <div className="mt-2 flex items-center gap-2">
              {trendPct === 0 ? (
                <span className="text-sm text-muted-foreground">—</span>
              ) : trendPct > 0 ? (
                <TrendingUp className="size-5 text-rose-500" />
              ) : (
                <TrendingDown className="size-5 text-emerald-500" />
              )}
              <span className={cn("text-2xl font-bold tabular-nums", trendPct > 0 ? "text-rose-600" : "text-emerald-600")}>
                {trendPct > 0 ? "+" : ""}{trendPct}%
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              ৳{cur(prev30d)} → ৳{cur(total30d)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{t("finance.expenses")}</h2>
        <Button onClick={() => setAddOpen(true)} className="bg-gradient-to-r from-rose-600 to-rose-700 text-white hover:from-rose-700 hover:to-rose-800">
          <Plus className="size-4" /> {t("finance.addExpense")}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Table */}
        <Card className="lg:col-span-2 border border-border/60">
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : !data || data.items.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">{t("finance.noExpenses")}</div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-start">{t("finance.date")}</th>
                      <th className="px-3 py-2 text-start">{t("finance.expenseCategory")}</th>
                      <th className="px-3 py-2 text-start">{t("finance.description")}</th>
                      <th className="px-3 py-2 text-end">{t("finance.amount")}</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((it) => (
                      <tr key={it.id} className="border-t border-border/40 hover:bg-muted/30">
                        <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(it.date).toLocaleDateString(locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US", { day: "2-digit", month: "short" })}
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="secondary" className={cn("text-[10px]", catBadge[it.category] ?? catBadge.other)}>
                            {t(`finance.${catLabelKey(it.category)}`)}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 max-w-[14rem]">
                          <p className="truncate text-xs">{it.description || "—"}</p>
                          {it.paymentMethod && (
                            <p className="text-[10px] text-muted-foreground capitalize">{it.paymentMethod}</p>
                          )}
                        </td>
                        <td className="px-3 py-2 text-end font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                          ৳{cur(it.amount)}
                        </td>
                        <td className="px-3 py-2 text-end">
                          <Button size="icon" variant="ghost" className="size-7 text-muted-foreground hover:text-rose-600" onClick={() => onDelete(it.id)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie chart */}
        <Card className="border border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("finance.byCategory")}</CardTitle>
          </CardHeader>
          <CardContent>
            {!data || data.categoryBreakdown.length === 0 ? (
              <div className="grid h-64 place-items-center text-sm text-muted-foreground">{t("finance.noExpenses")}</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryBreakdown.map((c) => ({
                        name: t(`finance.${catLabelKey(c.category)}`),
                        value: c.amount,
                      }))}
                      dataKey="value" nameKey="name"
                      innerRadius={45} outerRadius={80} paddingAngle={2} stroke="none"
                    >
                      {data.categoryBreakdown.map((c) => (
                        <Cell key={c.category} fill={CATEGORIES.find((x) => x.value === c.category)?.color ?? "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`৳${cur(v)}`, ""]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddExpenseDialog open={addOpen} onOpenChange={setAddOpen} onSaved={() => { void load(); reloadOverview(); }} />
    </div>
  );
}
