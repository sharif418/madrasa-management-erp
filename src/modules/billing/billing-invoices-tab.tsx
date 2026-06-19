// Billing Invoices Tab — table of invoices + summary
"use client";
import { FileText, Download, CalendarClock, Wallet, CheckCircle2, Clock } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import type { BillingData } from "./types";

type Props = { data: BillingData };

function fmtDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function BillingInvoicesTab({ data }: Props) {
  const { t, locale, dir } = useApp();
  const currencySymbol = data.currency === "BDT" ? "৳" : data.currency === "SAR" ? "﷼" : "$";

  function handleDownload(number: string) {
    toast.success(t("billing.invoiceSent"));
  }

  const hasInvoices = data.invoices.length > 0;

  return (
    <div className="space-y-6" dir={dir()}>
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="overflow-hidden transition-all hover:shadow-md">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
              <Wallet className="size-6" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("billing.totalPaid")}
              </p>
              <p className="text-2xl font-bold tracking-tight">
                {currencySymbol}{data.totalPaid.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden transition-all hover:shadow-md">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-md">
              <CalendarClock className="size-6" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("billing.nextBilling")}
              </p>
              <p className="text-2xl font-bold tracking-tight">
                {data.nextBilling ? fmtDate(data.nextBilling, locale) : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices table */}
      {hasInvoices ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("billing.invoiceNumber")}</TableHead>
                  <TableHead>{t("billing.date")}</TableHead>
                  <TableHead>{t("billing.plans")}</TableHead>
                  <TableHead className="text-end">{t("billing.amount")}</TableHead>
                  <TableHead className="text-center">{t("billing.status")}</TableHead>
                  <TableHead className="text-end">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.invoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-accent/50">
                    <TableCell className="font-mono text-xs font-medium">{inv.number}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fmtDate(inv.date, locale)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {t(`billing.${inv.plan}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end font-semibold">
                      {currencySymbol}{inv.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {inv.status === "paid" ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300">
                          <CheckCircle2 className="mr-1 size-3" /> {t("billing.paid")}
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300">
                          <Clock className="mr-1 size-3" /> {t("billing.pending")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(inv.number)}
                        className="gap-1.5"
                      >
                        <Download className="size-3.5" /> {t("billing.download")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-muted">
              <FileText className="size-7 text-muted-foreground" />
            </span>
            <div className="space-y-1">
              <p className="font-medium">{t("billing.noInvoices")}</p>
              <p className="text-sm text-muted-foreground">{t("billing.subtitle")}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
