"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Wallet, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/store/app-store";

type TeacherLite = {
  id: string;
  name: string;
  nameArabic: string | null;
  phone: string | null;
  salary: number;
  isActive: boolean;
};

type PayrollRow = {
  id: string;
  teacherId: string;
  month: string;
  baseSalary: number;
  deduction: number;
  bonus: number;
  netPay: number;
  status: string;
  paidAt: string | null;
  teacher: TeacherLite;
};

type PayrollResponse = { items: PayrollRow[] };
type TeacherListResponse = {
  items: TeacherLite[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function TeachersPayrollTab() {
  const { t, dir } = useApp();
  const [month, setMonth] = useState(currentMonth());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [teachers, setTeachers] = useState<TeacherLite[]>([]);

  // Load teachers list (for showing all active teachers even without a payroll record)
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/teachers?limit=200", { cache: "no-store" });
        const json = await res.json();
        if (json.ok) setTeachers((json.data as TeacherListResponse).items);
      } catch { /* ignore */ }
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teachers/payroll?month=${month}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
      setRows((json.data as PayrollResponse).items);
    } catch (err) {
      toast.error(t("teachers.payrollFailed"), {
        description: err instanceof Error ? err.message : "",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [month, t]);

  useEffect(() => { void load(); }, [load]);

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/teachers/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "process", month }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
      toast.success(t("teachers.payrollProcessed", { count: json.data.processed }));
      await load();
    } catch (err) {
      toast.error(t("teachers.payrollFailed"), {
        description: err instanceof Error ? err.message : "",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handlePay = async (row: PayrollRow) => {
    setPayingId(row.id);
    try {
      const res = await fetch("/api/teachers/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay", teacherId: row.teacherId, month }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
      toast.success(t("teachers.payrollPaid"));
      await load();
    } catch (err) {
      toast.error(t("teachers.payrollFailed"), {
        description: err instanceof Error ? err.message : "",
      });
    } finally {
      setPayingId(null);
    }
  };

  // Build a unified view: include all active teachers even if no payroll row yet
  const teacherRowMap = new Map(rows.map((r) => [r.teacherId, r]));
  const mergedRows: (PayrollRow & { missing?: boolean })[] = teachers
    .filter((tch) => tch.isActive)
    .map((tch) => teacherRowMap.get(tch.id) || {
      id: `missing-${tch.id}`,
      teacherId: tch.id,
      month,
      baseSalary: tch.salary,
      deduction: 0,
      bonus: 0,
      netPay: tch.salary,
      status: "missing",
      paidAt: null,
      teacher: tch,
      missing: true,
    });

  const totalNet = mergedRows.reduce((s, r) => s + r.netPay, 0);
  const totalPaid = mergedRows.filter((r) => r.status === "paid").reduce((s, r) => s + r.netPay, 0);
  const totalPending = totalNet - totalPaid;

  return (
    <div className="space-y-4" dir={dir()}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 justify-between">
        <div className="flex items-end gap-3">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">{t("teachers.month")}</label>
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-44"
            />
          </div>
          <Button
            onClick={handleProcess}
            disabled={processing}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
          >
            {processing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {t("teachers.processPayroll")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground max-w-sm">{t("teachers.payrollHint")}</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard label={t("teachers.netPay")} value={totalNet} tint="from-emerald-500 to-teal-600" />
        <SummaryCard label={t("teachers.paid")} value={totalPaid} tint="from-teal-500 to-cyan-600" />
        <SummaryCard label={t("teachers.pending")} value={totalPending} tint="from-amber-500 to-orange-600" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : mergedRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 py-16 text-center">
          <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md ring-1 ring-white/30">
            <Wallet className="size-8" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground max-w-sm">{t("teachers.noPayroll")}</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-start font-medium px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">{t("teachers.name")}</th>
                  <th className="text-end font-medium px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">{t("teachers.baseSalary")}</th>
                  <th className="text-end font-medium px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">{t("teachers.deduction")}</th>
                  <th className="text-end font-medium px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">{t("teachers.bonus")}</th>
                  <th className="text-end font-medium px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">{t("teachers.netPay")}</th>
                  <th className="text-center font-medium px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">{t("common.status")}</th>
                  <th className="text-end font-medium px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {mergedRows.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2">
                      <p className="font-medium">{r.teacher.name}</p>
                      {r.teacher.phone && <p className="text-xs text-muted-foreground" dir="ltr">{r.teacher.phone}</p>}
                    </td>
                    <td className="px-3 py-2 text-end tabular-nums">{r.baseSalary.toLocaleString()}</td>
                    <td className="px-3 py-2 text-end tabular-nums text-rose-600">-{r.deduction.toLocaleString()}</td>
                    <td className="px-3 py-2 text-end tabular-nums text-emerald-600">+{r.bonus.toLocaleString()}</td>
                    <td className="px-3 py-2 text-end tabular-nums font-semibold">{r.netPay.toLocaleString()}</td>
                    <td className="px-3 py-2 text-center">
                      {r.status === "paid" ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300">{t("teachers.paid")}</Badge>
                      ) : r.status === "missing" ? (
                        <Badge variant="outline" className="text-muted-foreground">—</Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300">{t("teachers.pending")}</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 text-end">
                      {(r.status === "pending" || r.status === "missing") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePay(r as PayrollRow)}
                          disabled={payingId === r.id || r.status === "missing"}
                          title={r.status === "missing" ? t("teachers.noPayroll") : ""}
                        >
                          {payingId === r.id && <Loader2 className="size-3 animate-spin" />}
                          {t("teachers.pay")}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, tint }: { label: string; value: number; tint: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`grid size-10 place-items-center rounded-lg bg-gradient-to-br ${tint} text-white shadow-sm`}>
          <Wallet className="size-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold tabular-nums">৳{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
