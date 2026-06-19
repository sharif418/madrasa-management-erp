"use client";
// Guardian detail cards part 2 — Fees, Exams, Notices.
// Re-uses shared helpers (fmtDate, fmtMoney, MiniStat) from ./guardian-student-cards.
import { Wallet, Award, Megaphone, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtDate, fmtMoney, MiniStat } from "./guardian-student-cards";

// ---- Fees card ----
export function FeesCard({
  fees, t, locale,
}: {
  fees: {
    totalDue: number; totalPaid: number; pendingCount: number;
    nextDue: { dueDate: string | null; amount: number; paidAmount: number } | null;
  };
  t: (k: string) => string;
  locale: string;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="size-4 text-rose-600" />
          {t("guardian.feeStatus")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <MiniStat label={t("guardian.totalDue")} value={`৳${fmtMoney(fees.totalDue, locale)}`} tone="rose" />
          <MiniStat label={t("guardian.paid")} value={`৳${fmtMoney(fees.totalPaid, locale)}`} tone="emerald" />
          <MiniStat label={t("guardian.pending")} value={fees.pendingCount} tone="amber" />
        </div>
        {fees.nextDue && fees.nextDue.dueDate && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm dark:bg-rose-950/30">
            <Calendar className="size-4 shrink-0 text-rose-600" />
            <span className="text-muted-foreground">{t("guardian.nextDue")}:</span>
            <span className="font-medium text-rose-700 dark:text-rose-300">{fmtDate(fees.nextDue.dueDate, locale)}</span>
            <span className="ms-auto text-muted-foreground">৳{fmtMoney(fees.nextDue.amount - fees.nextDue.paidAmount, locale)}</span>
          </div>
        )}
        {fees.totalDue === 0 && fees.pendingCount === 0 && (
          <p className="py-2 text-center text-sm text-muted-foreground">{t("guardian.noFees")}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Exams card ----
export function ExamsCard({
  exams, t,
}: {
  exams: { subject: string; marks: number; total: number; grade: string | null; exam: { name: string; term: string | null } }[];
  t: (k: string) => string;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="size-4 text-violet-600" />
          {t("guardian.recentExams")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {exams.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{t("guardian.noExams")}</p>
        ) : (
          <div className="space-y-1.5">
            {exams.map((e, i) => {
              const pct = e.total > 0 ? Math.round((e.marks / e.total) * 100) : 0;
              return (
                <div key={i} className="flex items-center gap-3 rounded-md bg-muted/40 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.subject}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {e.exam.name}{e.exam.term ? ` · ${e.exam.term}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-end">
                    <p className="text-sm font-semibold">{e.marks}/{e.total}</p>
                    {e.grade && (
                      <Badge variant="secondary" className="mt-0.5 bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                        {e.grade} · {pct}%
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Notices card ----
export function NoticesCard({
  notices, t, locale,
}: {
  notices: { id: string; title: string; content: string; type: string; publishedAt: string }[];
  t: (k: string) => string;
  locale: string;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Megaphone className="size-4 text-cyan-600" />
          {t("guardian.recentNotices")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notices.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{t("guardian.noNotices")}</p>
        ) : (
          <div className="space-y-2">
            {notices.map((n) => (
              <div key={n.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{fmtDate(n.publishedAt, locale)}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
