// Daily Summary Cards — 6 KPI tiles for the daily report.
// Each card has an icon, primary metric, and a small contextual breakdown.
"use client";
import {
  CheckCircle2, Wallet, BookMarked, Banknote, DoorOpen, Activity,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { DailyReport } from "./daily-report-types";
import { fmtCurrency } from "./daily-report-types";

type CardDef = {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  label: string;
  primary: string;
  sub?: React.ReactNode;
  progress?: number;
  progressColor?: string;
};

export function DailySummaryCards({ data }: { data: DailyReport }) {
  const { t, locale } = useApp();

  const cards: CardDef[] = [
    {
      icon: CheckCircle2,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      label: t("dailyreport.attendance"),
      primary: `${data.attendance.rate}%`,
      sub: (
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between"><span>{t("dailyreport.present")}</span><span className="font-medium text-emerald-600 dark:text-emerald-400">{data.attendance.present}</span></div>
          <div className="flex justify-between"><span>{t("dailyreport.absent")}</span><span className="font-medium text-rose-600 dark:text-rose-400">{data.attendance.absent}</span></div>
          <div className="flex justify-between"><span>{t("dailyreport.late")}</span><span className="font-medium text-amber-600 dark:text-amber-400">{data.attendance.late}</span></div>
          <div className="flex justify-between"><span>{t("dailyreport.leave")}</span><span className="font-medium text-sky-600 dark:text-sky-400">{data.attendance.leave}</span></div>
        </div>
      ),
      progress: data.attendance.rate,
      progressColor: "bg-emerald-500",
    },
    {
      icon: Wallet,
      iconBg: "bg-teal-50 dark:bg-teal-950/40",
      iconColor: "text-teal-600 dark:text-teal-400",
      label: t("dailyreport.feesCollected"),
      primary: `৳${fmtCurrency(data.fees.collected, locale)}`,
      sub: (
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>{t("common.count")}</span>
            <span className="font-medium">{data.fees.count}</span>
          </div>
          {data.fees.methods.slice(0, 3).map((m) => (
            <div key={m.method} className="flex justify-between">
              <span className="capitalize">{m.method}</span>
              <span className="font-medium">৳{fmtCurrency(m.amount, locale)} · {m.count}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: BookMarked,
      iconBg: "bg-violet-50 dark:bg-violet-950/40",
      iconColor: "text-violet-600 dark:text-violet-400",
      label: t("dailyreport.hifzRecords"),
      primary: String(data.hifz.records),
      sub: (
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>{t("dailyreport.avgQuality")}</span>
            <span className="font-medium">{data.hifz.avgQuality || "—"} / 5</span>
          </div>
          {data.hifz.byType.slice(0, 3).map((b) => (
            <div key={b.type} className="flex justify-between">
              <span className="capitalize">{b.type}</span>
              <span className="font-medium">{b.count}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: Banknote,
      iconBg: "bg-amber-50 dark:bg-amber-950/40",
      iconColor: "text-amber-600 dark:text-amber-400",
      label: t("dailyreport.finance"),
      primary: `৳${fmtCurrency(data.finance.net, locale)}`,
      sub: (
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span className="text-emerald-600 dark:text-emerald-400">{t("dailyreport.income")}</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">+৳{fmtCurrency(data.finance.income, locale)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-rose-600 dark:text-rose-400">{t("dailyreport.expense")}</span>
            <span className="font-medium text-rose-600 dark:text-rose-400">-৳{fmtCurrency(data.finance.expense, locale)}</span>
          </div>
          <div className="flex justify-between border-t pt-1 mt-1">
            <span>{t("dailyreport.net")}</span>
            <span className={`font-semibold ${data.finance.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              ৳{fmtCurrency(data.finance.net, locale)}
            </span>
          </div>
        </div>
      ),
    },
    {
      icon: DoorOpen,
      iconBg: "bg-sky-50 dark:bg-sky-950/40",
      iconColor: "text-sky-600 dark:text-sky-400",
      label: t("dailyreport.visitors"),
      primary: String(data.visitors.checkedIn),
      sub: (
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>{t("dailyreport.gatePasses")}</span>
            <span className="font-medium">{data.gatePasses.issued}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("common.used")}</span>
            <span className="font-medium">{data.gatePasses.used}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("common.pending")}</span>
            <span className="font-medium text-amber-600 dark:text-amber-400">{data.gatePasses.pending}</span>
          </div>
        </div>
      ),
    },
    {
      icon: Activity,
      iconBg: "bg-rose-50 dark:bg-rose-950/40",
      iconColor: "text-rose-600 dark:text-rose-400",
      label: t("dailyreport.activities"),
      primary: String(data.admissions.newApplications + data.notices.published + data.library.booksLent),
      sub: (
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>{t("dailyreport.newAdmissions")}</span>
            <span className="font-medium">{data.admissions.newApplications}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("dailyreport.noticesPublished")}</span>
            <span className="font-medium">{data.notices.published}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("dailyreport.booksLent")}</span>
            <span className="font-medium">{data.library.booksLent}</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3">
      {cards.map((c) => (
        <Card
          key={c.label}
          className="group overflow-hidden border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-900/5 print:shadow-none"
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {c.label}
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{c.primary}</p>
              </div>
              <div className={`grid size-10 place-items-center rounded-xl ${c.iconBg} ${c.iconColor} shrink-0`}>
                <c.icon className="size-5" />
              </div>
            </div>
            {c.progress != null && (
              <div className="mt-3">
                <Progress value={c.progress} className="h-1.5" />
              </div>
            )}
            {c.sub && <div className="mt-3">{c.sub}</div>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
