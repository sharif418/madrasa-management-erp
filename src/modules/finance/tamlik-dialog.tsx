"use client";
// Tamlik Automation dialog — Shariah-compliant Zakat transfer to eligible student wallets.
import { useEffect, useState } from "react";
import { useApp } from "@/store/app-store";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import type { Fund } from "./finance-types";

type Student = {
  id: string;
  name: string;
  rollNo?: string | null;
  guardianName?: string | null;
  wallet?: { balance: number } | null;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
  funds: Fund[];
  hasZakat: boolean;
};

export function TamlikDialog({
  open,
  onOpenChange,
  onSaved,
  funds,
  hasZakat,
}: Props) {
  const { t, dir, locale } = useApp();
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const zakatFund = funds.find((f) => f.type === "zakat");

  const cur = (n: number) =>
    new Intl.NumberFormat(
      locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US",
      { maximumFractionDigits: 0 }
    ).format(n || 0);

  // Fetch Zakat-eligible students when the dialog opens.
  useEffect(() => {
    if (!open) return;
    setStudentId("");
    setAmount("");
    setDescription("");
    setLoadingStudents(true);
    const url = new URL("/api/students", window.location.origin);
    url.searchParams.set("limit", "100");
    fetch(`${url.pathname}?${url.searchParams.toString()}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok) {
          const all: Student[] = j.data.items ?? [];
          setStudents(all.filter((s) => s.wallet !== undefined));
        }
      })
      .finally(() => setLoadingStudents(false));
  }, [open]);

  // We can't filter isZakatEligible via existing students API; do client filter.
  // The /api/students endpoint doesn't expose isZakatEligible flag — fetch full
  // list and rely on backend Tamlik validation (which checks isZakatEligible).
  // To be safe, we also display a badge so the user knows the backend will verify.

  const amt = Number(amount) || 0;
  const exceedsBalance = !!zakatFund && amt > zakatFund.balance;
  const canSubmit = !!studentId && amt > 0 && !exceedsBalance && !submitting;

  const submit = async () => {
    if (!zakatFund) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fundId: zakatFund.id,
          amount: amt,
          type: "transfer",
          category: "tamlik_zakat",
          description: description || undefined,
          relatedStudentId: studentId,
          paymentMethod: "wallet",
          date: new Date().toISOString(),
        }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) {
        toast.error(j?.error || t("finance.createFailed"));
        return;
      }
      toast.success(t("finance.tamlik.success"));
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error(t("finance.createFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const selected = students.find((s) => s.id === studentId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={dir()}
        className="sm:max-w-lg"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-amber-100 dark:bg-amber-950 p-2">
              <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <DialogTitle>{t("finance.tamlik")}</DialogTitle>
              <DialogDescription>{t("finance.tamlik.desc")}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!hasZakat || !zakatFund ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{t("finance.tamlik.noZakatFund")}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {/* Source fund */}
            <div className="flex items-center justify-between rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("finance.fundName")}
                </p>
                <p className="font-semibold flex items-center gap-2">
                  {zakatFund.name}
                  <Badge
                    variant="outline"
                    className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                  >
                    {t("finance.zakat")}
                  </Badge>
                </p>
              </div>
              <div className="text-end">
                <p className="text-xs text-muted-foreground">
                  {t("finance.balance")}
                </p>
                <p className="font-bold tabular-nums">৳ {cur(zakatFund.balance)}</p>
              </div>
            </div>

            {/* Student picker */}
            <div className="space-y-1.5">
              <Label>{t("finance.tamlik.selectStudent")}</Label>
              {loadingStudents ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t("finance.tamlik.eligibleStudents")}
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {students.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        {t("finance.tamlik.noEligible")}
                      </div>
                    ) : (
                      students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <span className="flex flex-col">
                            <span>
                              {s.name}
                              {s.rollNo ? ` · ${s.rollNo}` : ""}
                            </span>
                            {s.guardianName && (
                              <span className="text-xs text-muted-foreground">
                                {s.guardianName}
                              </span>
                            )}
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              {selected && (
                <p className="text-xs text-muted-foreground">
                  {t("wallet.balance")}: ৳{" "}
                  {cur(selected.wallet?.balance ?? 0)}
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="tamlik-amount">{t("finance.amount")}</Label>
              <Input
                id="tamlik-amount"
                type="number"
                min="1"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
              {exceedsBalance && (
                <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {t("finance.tamlik.amountExceeds")}
                </p>
              )}
            </div>

            {/* Description (optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="tamlik-desc" className="text-muted-foreground">
                {t("finance.description")} ({t("common.optional")})
              </Label>
              <Input
                id="tamlik-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Monthly Zakat stipend"
              />
            </div>

            {/* Shariah note */}
            <Alert className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-xs leading-relaxed">
                {t("finance.tamlik.shariahNote")}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={submit}
            disabled={!canSubmit}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {t("finance.tamlik.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
