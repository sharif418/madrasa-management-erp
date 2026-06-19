"use client";
// ProfileFeesTab — summary cards + recent collections table
import { IndianRupee, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useT } from "./i18n";
import { ProfileData, fmtDate } from "./profile-types";

type Props = { data: ProfileData; locale: string };

export function ProfileFeesTab({ data, locale }: Props) {
  const t = useT();
  const { fees } = data;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={<AlertTriangle className="size-5 text-rose-600" />}
          label={t("studentProfile.totalDue")}
          value={fmtMoney(fees.totalDue)}
          tone="rose"
        />
        <SummaryCard
          icon={<CheckCircle2 className="size-5 text-emerald-600" />}
          label={t("studentProfile.totalPaid")}
          value={fmtMoney(fees.totalPaid)}
          tone="emerald"
        />
        <SummaryCard
          icon={<Clock className="size-5 text-amber-500" />}
          label={t("studentProfile.pendingCount")}
          value={String(fees.pendingCount)}
          tone="amber"
        />
      </div>

      {/* Recent collections table */}
      <Card className="py-4">
        <CardContent className="space-y-3">
          <h3 className="px-2 text-sm font-semibold text-muted-foreground">
            {t("studentProfile.recentCollections")}
          </h3>
          {fees.recentCollections.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{t("studentProfile.noData")}</p>
          ) : (
            <ScrollArea className="max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t("hifz.date")}</TableHead>
                    <TableHead className="text-xs">{t("finance.amount")}</TableHead>
                    <TableHead className="text-xs">{paidLabel(t)}</TableHead>
                    <TableHead className="hidden text-xs sm:table-cell">{t("finance.method")}</TableHead>
                    <TableHead className="text-xs">{t("common.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fees.recentCollections.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {fmtDate(f.paidDate ?? f.dueDate ?? f.id, locale)}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{fmtMoney(f.amount)}</TableCell>
                      <TableCell className="text-xs text-emerald-700 dark:text-emerald-400">{fmtMoney(f.paidAmount)}</TableCell>
                      <TableCell className="hidden text-xs sm:table-cell">{f.method ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusBadge(f.status)}>
                          {feeStatusLabel(f.status, t)}
                        </Badge>
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

function SummaryCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "rose" | "emerald" | "amber" }) {
  const toneClass: Record<string, string> = {
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  };
  return (
    <Card className="py-4">
      <CardContent className="flex items-center gap-3">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${toneClass[tone]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className={`text-xl font-semibold leading-tight ${tone === "rose" ? "text-rose-700 dark:text-rose-400" : ""}`}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);
}

function feeStatusLabel(s: string, t: (k: string) => string): string {
  // Prefer finance.* keys if defined globally; otherwise pretty-print the raw status.
  const map: Record<string, string> = {
    paid: t("finance.paid"),
    partial: t("finance.partial"),
    pending: t("finance.pending"),
    overdue: t("finance.overdue"),
  };
  const v = map[s];
  // useT() returns the key unchanged when missing — detect that and fall back.
  if (v && !v.startsWith("finance.")) return v;
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
}

// Returns "Paid" in the active locale — falls back gracefully if finance.paid
// is undefined (uses en/bn/ar literal lookup).
function paidLabel(t: (k: string) => string): string {
  const v = t("finance.paid");
  if (v && !v.startsWith("finance.")) return v;
  return "Paid";
}

function statusBadge(s: string): string {
  if (s === "paid") return "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300";
  if (s === "partial") return "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-300";
  if (s === "overdue") return "border-rose-300 text-rose-700 dark:border-rose-800 dark:text-rose-300";
  return "border-muted-foreground/30 text-muted-foreground";
}
