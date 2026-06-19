"use client";
// LibraryLendingsTab — table of borrow records with status filter + return action.
import * as React from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeftRight, CheckCircle2, Library } from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Lending } from "./types";

const STATUS_META: Record<string, { tint: string; dot: string }> = {
  borrowed: {
    tint: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  returned: {
    tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  overdue: {
    tint: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    dot: "bg-rose-500",
  },
};

function asStatus(l: Lending): "borrowed" | "returned" | "overdue" {
  if (l.status === "returned" || l.returnedAt) return "returned";
  if (new Date(l.dueDate) < new Date()) return "overdue";
  return "borrowed";
}

export function LibraryLendingsTab() {
  const { t, locale, dir } = useApp();
  const { toast } = useToast();
  const [lendings, setLendings] = React.useState<Lending[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [status, setStatus] = React.useState<string>("");
  const [returning, setReturning] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/library?limit=1", { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) setLendings((j.data.recentLendings as Lending[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const fmtDate = (s: string | null) => {
    if (!s) return "—";
    return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(new Date(s));
  };

  const filtered = lendings.filter((l) => !status || asStatus(l) === status);

  const handleReturn = async (id: string) => {
    setReturning(id);
    try {
      const r = await fetch("/api/library/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lendingId: id }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Return failed");
      const fine = j.data?.fine || 0;
      toast({
        title: t("library.returnedOk"),
        description: fine > 0 ? `${t("library.fine")}: ৳${fine}` : undefined,
      });
      load();
    } catch {
      toast({ title: t("library.returnFailed"), variant: "destructive" });
    } finally {
      setReturning(null);
    }
  };

  const statusOptions = [
    { value: "", label: t("library.allStatus") },
    { value: "borrowed", label: t("library.borrowed") },
    { value: "overdue", label: t("library.overdue") },
    { value: "returned", label: t("library.returned") },
  ];

  return (
    <div className="space-y-4" dir={dir()}>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {statusOptions.map((s) => {
          const active = status === s.value;
          return (
            <button
              key={s.value || "all"}
              type="button"
              onClick={() => setStatus(s.value)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition",
                active ? "border-amber-600 bg-amber-600 text-white" : "border-border bg-muted/50 hover:bg-muted"
              )}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/40 p-12 text-center">
          <Library className="mx-auto mb-3 size-12 opacity-30" />
          <p className="text-sm text-muted-foreground">{t("library.noLendings")}</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <ScrollArea className="max-h-[calc(100vh-16rem)]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="ps-4">{t("library.borrower")}</TableHead>
                  <TableHead>{t("library.bookTitle")}</TableHead>
                  <TableHead>{t("library.borrowedOn")}</TableHead>
                  <TableHead>{t("library.dueDate")}</TableHead>
                  <TableHead>{t("library.returnedAt")}</TableHead>
                  <TableHead>{t("library.status")}</TableHead>
                  <TableHead className="text-end">{t("library.fine")}</TableHead>
                  <TableHead className="text-end pe-4">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => {
                  const st = asStatus(l);
                  const meta = STATUS_META[st];
                  const canReturn = st !== "returned";
                  return (
                    <TableRow key={l.id} className="hover:bg-muted/30">
                      <TableCell className="ps-4 font-medium">{l.borrowerName}</TableCell>
                      <TableCell className="max-w-[180px] truncate">{l.book?.title || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(l.borrowedAt)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(l.dueDate)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(l.returnedAt)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("capitalize", meta.tint)}>
                          <span className={cn("size-1.5 rounded-full me-1", meta.dot)} />
                          {t(`library.${st}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        {l.fine > 0 ? <span className="text-rose-600">৳{l.fine}</span> : "—"}
                      </TableCell>
                      <TableCell className="text-end pe-4">
                        {canReturn ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={returning === l.id}
                            onClick={() => handleReturn(l.id)}
                          >
                            {returning === l.id
                              ? <ArrowLeftRight className="size-3.5 animate-spin" />
                              : <CheckCircle2 className="size-3.5" />}
                            {t("library.return")}
                          </Button>
                        ) : (
                          <CheckCircle2 className="ms-auto size-4 text-emerald-500" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
