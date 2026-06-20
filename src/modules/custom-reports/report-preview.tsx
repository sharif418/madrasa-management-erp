// ReportPreview — first 10 rows of fetched data shown as a table.
"use client";
import { useApp } from "@/store/app-store";
import { Inbox, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type Props = {
  loading: boolean;
  columns: string[];
  rows: Record<string, unknown>[];
};

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

export function ReportPreview({ loading, columns, rows }: Props) {
  const { t } = useApp();
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> {t("customreports.generating")}
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
        <Inbox className="size-6 opacity-50" />
        <span>{t("customreports.noData")}</span>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {t("customreports.previewRows", { count: rows.length })}
      </p>
      <div className="rounded-lg border border-border/60">
        <ScrollArea className="max-h-96">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur">
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c} className="font-mono text-xs">{c}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  {columns.map((c) => (
                    <TableCell key={c} className="text-xs">{fmt(r[c])}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}
