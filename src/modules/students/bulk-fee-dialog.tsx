"use client";
// BulkFeeDialog — fee structure selector + due date → POST /api/students/bulk
import * as React from "react";
import { Loader2, Wallet } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useT } from "./i18n";
import { useBulkMetadata, type BulkFeeStructure } from "./use-bulk-meta";

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount);
}

function feeLabel(f: BulkFeeStructure): string {
  const parts = [f.name];
  if (f.amount) parts.push(`(${formatAmount(f.amount)})`);
  if (f.frequency) parts.push(`· ${f.frequency}`);
  return parts.join(" ");
}

export function BulkFeeDialog({
  open, onOpenChange, studentIds, onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  studentIds: string[];
  onDone?: () => void;
}) {
  const t = useT();
  const { toast } = useToast();
  const { data, isLoading, isError } = useBulkMetadata();
  const [feeStructureId, setFeeStructureId] = React.useState<string>("");
  const [dueDate, setDueDate] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);

  const count = studentIds.length;
  const feeStructures = data?.feeStructures ?? [];

  const submit = async () => {
    if (!feeStructureId) {
      toast({ title: t("students.feeStructure"), description: "Required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "assignFee",
          studentIds,
          data: { feeStructureId, dueDate: dueDate || undefined },
        }),
      });
      const j = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Request failed");
      const r = j.data as { success: number; failed: number };
      toast({
        title: t("students.bulkFeeSuccess", { count: r.success }),
        description: r.failed > 0 ? `${r.failed} failed` : undefined,
        variant: r.failed > 0 ? "destructive" : "default",
      });
      onOpenChange(false);
      onDone?.();
    } catch (e) {
      toast({
        title: t("students.loadError"),
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="size-5 text-emerald-600" />
            {t("students.assignFee")}
          </DialogTitle>
          <DialogDescription>
            {t("students.selected", { count })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t("students.feeStructure")}</Label>
            {isLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : isError ? (
              <p className="text-xs text-destructive">{t("students.loadError")}</p>
            ) : feeStructures.length === 0 ? (
              <p className="rounded-md border border-dashed p-2 text-xs text-muted-foreground">
                No fee structures configured. Add one in Finance.
              </p>
            ) : (
              <Select value={feeStructureId} onValueChange={setFeeStructureId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("students.feeStructure")} />
                </SelectTrigger>
                <SelectContent>
                  {feeStructures.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {feeLabel(f)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bulk-due" className="text-xs font-medium">
              {t("students.dueDate")}
            </Label>
            <Input
              id="bulk-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={submit}
            disabled={saving || count === 0 || !feeStructureId}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
          >
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t("students.assignFee")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
