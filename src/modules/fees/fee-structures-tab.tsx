// FeeStructuresTab — grid of fee structure cards with add/edit/delete + generate.
"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Sparkles, Receipt, Inbox } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FeeStructureForm } from "./fee-structure-form";
import { GenerateDialog } from "./generate-dialog";
import { FEE_TYPE_TONES } from "./fees-types";
import type { FeeStructure } from "./fees-types";

type ClassItem = { id: string; name: string };

export function FeeStructuresTab() {
  const { t, dir, locale } = useApp();
  const [items, setItems] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FeeStructure | null>(null);
  const [genOpen, setGenOpen] = useState(false);
  const [genTarget, setGenTarget] = useState<FeeStructure | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeeStructure | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([
        fetch("/api/fee-structures", { cache: "no-store" }),
        fetch("/api/students/classes", { cache: "no-store" }),
      ]);
      const j1 = await a.json();
      const j2 = await b.json();
      if (j1?.ok) setItems(j1.data.items as FeeStructure[]);
      if (j2?.ok) setClasses((j2.data.items as ClassItem[]) || []);
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const cur = (n: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US", {
      maximumFractionDigits: 0,
    }).format(n || 0);

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (s: FeeStructure) => { setEditing(s); setFormOpen(true); };
  const openGen = (s: FeeStructure) => { setGenTarget(s); setGenOpen(true); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/fee-structures/${deleteTarget.id}`, { method: "DELETE" });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Failed");
      toast.success(t("common.delete"));
      setDeleteTarget(null);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div dir={dir()} className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} {t("fees.structures")}
        </p>
        <Button
          onClick={openAdd}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
        >
          <Plus className="size-4" />
          {t("fees.addStructure")}
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState onAdd={openAdd} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <Card
              key={s.id}
              className="group relative overflow-hidden border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{s.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.className || t("fees.allClasses")}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7 shrink-0">
                        <Receipt className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(s)}>
                        <Pencil className="size-4" /> {t("common.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openGen(s)}>
                        <Sparkles className="size-4" /> {t("fees.generateCollections")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(s)}
                        className="text-rose-600 focus:text-rose-700"
                      >
                        <Trash2 className="size-4" /> {t("common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className={FEE_TYPE_TONES[s.type] || ""}>
                    {t(`fees.${s.type}`)}
                  </Badge>
                  <Badge variant="outline">
                    {s.frequency === "one_time" ? t("fees.oneTime") : t(`fees.${s.frequency}`)}
                  </Badge>
                </div>

                <div className="flex items-end justify-between pt-1">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("fees.amount")}</p>
                    <p className="text-xl font-bold tabular-nums">৳{cur(s.amount)}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-xs text-muted-foreground">{t("fees.collections")}</p>
                    <p className="text-sm font-medium tabular-nums">{s.collectionsCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("fees.editStructure") : t("fees.addStructure")}
            </DialogTitle>
            <DialogDescription>{t("fees.subtitle")}</DialogDescription>
          </DialogHeader>
          <FeeStructureForm
            open={formOpen}
            onOpenChange={setFormOpen}
            initial={editing}
            classes={classes}
            onSaved={load}
          />
        </DialogContent>
      </Dialog>

      {/* Generate dialog */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("fees.generateCollections")}</DialogTitle>
            <DialogDescription>{t("fees.subtitle")}</DialogDescription>
          </DialogHeader>
          <GenerateDialog
            open={genOpen}
            onOpenChange={setGenOpen}
            structure={genTarget}
            classes={classes}
            onGenerated={load}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("fees.deleteConfirm")} — <strong>{deleteTarget?.name}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const { t, dir } = useApp();
  return (
    <div dir={dir()} className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="grid size-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
        <Inbox className="size-8" />
      </div>
      <p className="text-muted-foreground">{t("fees.empty")}</p>
      <Button
        onClick={onAdd}
        className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
      >
        <Plus className="size-4" />
        {t("fees.addStructure")}
      </Button>
    </div>
  );
}
