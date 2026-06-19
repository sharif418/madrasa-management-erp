"use client";
// Allocations tab — table with remove button
import { Trash2, UserPlus } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/store/app-store";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui-patterns";
import type { Allocation } from "./types";

export function AllocationsTab({
  allocations, loading, onAdd, onChanged,
}: {
  allocations: Allocation[];
  loading: boolean;
  onAdd: () => void;
  onChanged: () => void;
}) {
  const { t } = useApp();

  const remove = async (id: string) => {
    if (!confirm(t("transport.deleteAlloc"))) return;
    try {
      const r = await fetch(`/api/transport/${id}`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || "Failed");
      toast.success(t("transport.deleteAlloc"));
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  if (loading) {
    return <Skeleton className="h-64 rounded-xl" />;
  }

  if (allocations.length === 0) {
    return (
      <EmptyState
        icon={<UserPlus className="relative size-6" />}
        title={t("transport.empty")}
        description={t("transport.emptyDesc")}
        gradient="from-emerald-500 to-teal-600"
      />
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="max-h-[28rem] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
            <TableRow>
              <TableHead>{t("transport.student")}</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>{t("transport.pickup")}</TableHead>
              <TableHead className="text-end">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allocations.map((a) => (
              <TableRow key={a.id} className="hover:bg-muted/40">
                <TableCell>
                  <div className="font-medium">{a.student.name}</div>
                  {a.student.rollNo && (
                    <div className="text-xs text-muted-foreground" dir="ltr">{a.student.rollNo}</div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">{a.vehicle.registration}</Badge>
                </TableCell>
                <TableCell>{a.route.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {a.pickupPoint || "—"}
                </TableCell>
                <TableCell className="text-end">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
                    onClick={() => remove(a.id)}
                    aria-label={t("transport.deleteAlloc")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
