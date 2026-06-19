"use client";
// Income vs Expense — last 6 months bar chart (recharts).
// Pulls data lazily from /api/finance/transactions on a 6-month window.
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/store/app-store";
import { TrendingUp } from "lucide-react";

type Row = { month: string; income: number; expense: number; transfer: number };

export function FinanceChart() {
  const { t, locale } = useApp();
  const [data, setData] = useState<Row[] | null>(null);

  useEffect(() => {
    let alive = true;
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    // Fetch a generous page size; we group client-side per month.
    const url =
      "/api/finance/transactions?from=" +
      from.toISOString().slice(0, 10) +
      "&limit=100&page=1";
    fetch(url, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (!alive || !j?.ok) return;
        const items: { amount: number; type: string; date: string }[] =
          j.data.items ?? [];
        const buckets: Record<string, Row> = {};
        for (const it of items) {
          const d = new Date(it.date);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          if (!buckets[key]) {
            buckets[key] = { month: key, income: 0, expense: 0, transfer: 0 };
          }
          if (it.type === "income") buckets[key].income += it.amount;
          else if (it.type === "expense") buckets[key].expense += it.amount;
          else if (it.type === "transfer") buckets[key].transfer += it.amount;
        }
        // Build last-6-months ordered list
        const out: Row[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          out.push(
            buckets[key] ?? {
              month: key,
              income: 0,
              expense: 0,
              transfer: 0,
            }
          );
        }
        setData(out);
      })
      .catch(() => alive && setData([]));
    return () => {
      alive = false;
    };
  }, []);

  // Locale-friendly month labels
  const fmtMonth = (key: string) => {
    const [y, m] = key.split("-");
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "bn-BD", {
      month: "short",
      year: "2-digit",
    });
  };

  const cur = (n: number) =>
    new Intl.NumberFormat(
      locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US",
      { notation: "compact", maximumFractionDigits: 1 }
    ).format(n || 0);

  return (
    <Card className="border border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          {t("finance.incomeExpense")} · {t("finance.last6months")}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {!data ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : data.every((d) => d.income === 0 && d.expense === 0 && d.transfer === 0) ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            {t("finance.noTransactions")}
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.map((d) => ({ ...d, label: fmtMonth(d.month) }))}
                margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <YAxis
                  tickFormatter={(v) => cur(Number(v))}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={48}
                />
                <Tooltip
                  formatter={(v: number, name: string) => [`৳${cur(v)}`, name]}
                  labelStyle={{ fontSize: 12 }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="income"
                  name={t("finance.income")}
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="expense"
                  name={t("finance.expense")}
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="transfer"
                  name={t("finance.transfer")}
                  fill="#a855f7"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
