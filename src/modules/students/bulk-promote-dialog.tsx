"use client";
// BulkPromoteDialog — class selector → POST /api/students/bulk
import * as React from "react";
import { Loader2, ArrowUpCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useT } from "./i18n";
import { useBulkMetadata } from "./use-bulk-meta";

export function BulkPromoteDialog({
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
  const [toClassId, setToClassId] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);

  const count = studentIds.length;
  const classes = data?.classes ?? [];

  const submit = async () => {
    if (!toClassId) {
      toast({ title: t("students.toClass"), description: "Required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "promote",
          studentIds,
          data: { toClassId },
        }),
      });
      const j = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Request failed");
      const r = j.data as { success: number; failed: number };
      toast({
        title: t("students.bulkPromoteSuccess", { count: r.success }),
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
            <ArrowUpCircle className="size-5 text-emerald-600" />
            {t("students.promoteClass")}
          </DialogTitle>
          <DialogDescription>
            {t("students.selected", { count })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t("students.toClass")}</Label>
            {isLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : isError ? (
              <p className="text-xs text-destructive">{t("students.loadError")}</p>
            ) : classes.length === 0 ? (
              <p className="rounded-md border border-dashed p-2 text-xs text-muted-foreground">
                No classes available. Create one in Academic.
              </p>
            ) : (
              <Select value={toClassId} onValueChange={setToClassId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("students.toClass")} />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.code ? ` (${c.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            All {count} selected students will be moved to the chosen class.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={submit}
            disabled={saving || count === 0 || !toClassId}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
          >
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t("students.promoteClass")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
