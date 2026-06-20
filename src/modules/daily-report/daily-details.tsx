// Daily Details — collapsible cards with per-row tables for each module.
// Sections: attendance-by-class, fees, hifz, finance, notices, visitors.
"use client";
import { useState } from "react";
import {
  ChevronDown, Users, Wallet, BookMarked, Banknote, Bell, DoorOpen, Inbox,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHead, TableHeader, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { DailyReport } from "./daily-report-types";
import { fmtCurrency, fmtTime } from "./daily-report-types";

function Section({
  icon: Icon, title, count, defaultOpen = false, children,
}: {
  icon: typeof Users; title: string; count: number;
  defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (count === 0) return null;
  return (
    <Card className="overflow-hidden border-border/60 print:shadow-none">
      <CardHeader className="p-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-muted/40 print:pointer-events-none"
          aria-expanded={open}
        >
          <div className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 shrink-0">
            <Icon className="size-4" />
          </div>
          <span className="flex-1 text-sm font-semibold">{title}</span>
          <Badge variant="secondary" className="rounded-full">{count}</Badge>
          <ChevronDown
            className={cn("size-4 text-muted-foreground transition-transform print:hidden", open && "rotate-180")}
          />
        </button>
      </CardHeader>
      {open && (
        <CardContent className="border-t p-0 print:block">
          <div className="max-h-96 overflow-y-auto print:max-h-none print:overflow-visible">
            {children}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

const Empty = ({ msg }: { msg: string }) => (
  <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
    <Inbox className="size-6 opacity-50" />
    {msg}
  </div>
);

export function DailyDetails({ data }: { data: DailyReport }) {
  const { t, locale } = useApp();
  const cur = (n: number) => `৳${fmtCurrency(n, locale)}`;

  return (
    <div className="space-y-4">
      {/* Attendance by class */}
      <Section icon={Users} title={t("dailyreport.attendance")} count={data.attendance.byClass.length} defaultOpen>
        {data.attendance.byClass.length === 0 ? (
          <Empty msg={t("dailyreport.noActivity")} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("dailyreport.className")}</TableHead>
                <TableHead className="text-center">{t("dailyreport.present")}</TableHead>
                <TableHead className="text-center">{t("dailyreport.absent")}</TableHead>
                <TableHead className="text-center">{t("dailyreport.late")}</TableHead>
                <TableHead className="text-center">{t("dailyreport.leave")}</TableHead>
                <TableHead className="text-center">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.attendance.byClass.map((c) => (
                <TableRow key={c.classId}>
                  <TableCell className="font-medium">{c.className}</TableCell>
                  <TableCell className="text-center text-emerald-600 dark:text-emerald-400">{c.present}</TableCell>
                  <TableCell className="text-center text-rose-600 dark:text-rose-400">{c.absent}</TableCell>
                  <TableCell className="text-center text-amber-600 dark:text-amber-400">{c.late}</TableCell>
                  <TableCell className="text-center text-sky-600 dark:text-sky-400">{c.leave}</TableCell>
                  <TableCell className="text-center font-semibold">{c.rate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      {/* Fee collections */}
      <Section icon={Wallet} title={t("dailyreport.feesCollected")} count={data.fees.count}>
        {data.fees.count === 0 ? (
          <Empty msg={t("dailyreport.noActivity")} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.method")}</TableHead>
                <TableHead className="text-center">{t("common.count")}</TableHead>
                <TableHead className="text-end">{t("common.amount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.fees.methods.map((m) => (
                <TableRow key={m.method}>
                  <TableCell className="font-medium capitalize">{m.method}</TableCell>
                  <TableCell className="text-center">{m.count}</TableCell>
                  <TableCell className="text-end font-semibold text-emerald-600 dark:text-emerald-400">{cur(m.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      {/* Hifz records */}
      <Section icon={BookMarked} title={t("dailyreport.hifzRecords")} count={data.hifz.items.length}>
        {data.hifz.items.length === 0 ? (
          <Empty msg={t("dailyreport.noActivity")} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("dailyreport.student")}</TableHead>
                <TableHead>{t("common.type")}</TableHead>
                <TableHead className="text-center">{t("hifz.para")}</TableHead>
                <TableHead className="text-center">{t("dailyreport.quality")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.hifz.items.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.student}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{r.type}</Badge></TableCell>
                  <TableCell className="text-center">{r.para}</TableCell>
                  <TableCell className="text-center font-semibold">{r.quality ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      {/* Financial transactions */}
      <Section icon={Banknote} title={t("dailyreport.finance")} count={data.finance.items.length}>
        {data.finance.items.length === 0 ? (
          <Empty msg={t("dailyreport.noActivity")} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("dailyreport.fundName")}</TableHead>
                <TableHead>{t("common.type")}</TableHead>
                <TableHead className="text-end">{t("common.amount")}</TableHead>
                <TableHead>{t("common.description")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.finance.items.map((tx, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{tx.fund}</TableCell>
                  <TableCell>
                    <Badge variant={tx.type === "income" ? "default" : "secondary"} className={tx.type === "income" ? "bg-emerald-500 capitalize" : "capitalize"}>
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn("text-end font-semibold", tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                    {tx.type === "income" ? "+" : "-"}{cur(tx.amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{tx.description ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      {/* Notices */}
      <Section icon={Bell} title={t("dailyreport.noticesPublished")} count={data.notices.items.length}>
        {data.notices.items.length === 0 ? (
          <Empty msg={t("dailyreport.noActivity")} />
        ) : (
          <ul className="divide-y">
            {data.notices.items.map((n, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{n.audience}</p>
                </div>
                <Badge variant="outline" className="capitalize shrink-0">{n.type}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Visitors log */}
      <Section icon={DoorOpen} title={t("dailyreport.visitors")} count={data.visitors.items.length}>
        {data.visitors.items.length === 0 ? (
          <Empty msg={t("dailyreport.noActivity")} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.name")}</TableHead>
                <TableHead>{t("dailyreport.purpose")}</TableHead>
                <TableHead className="text-center">{t("dailyreport.checkIn")}</TableHead>
                <TableHead className="text-center">{t("dailyreport.checkOut")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.visitors.items.map((v, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{v.name}</TableCell>
                  <TableCell className="text-muted-foreground">{v.purpose}</TableCell>
                  <TableCell className="text-center">{fmtTime(v.checkIn, locale)}</TableCell>
                  <TableCell className="text-center">{v.checkOut ? fmtTime(v.checkOut, locale) : <span className="text-amber-600">—</span>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>
    </div>
  );
}
