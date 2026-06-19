"use client";
// NoticesList — card list with type chips, expand/collapse content, edit/delete actions
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Megaphone, MoreVertical, Pencil, Trash2, ChevronDown, ChevronUp, Calendar, Clock,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Notice } from "./notice-form";

const TYPE_TINT: Record<Notice["type"], string> = {
  urgent: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  holiday: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  exam: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  event: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  general: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
};

const AUDIENCE_TINT: Record<Notice["audience"], string> = {
  all: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  teachers: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
  students: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
  guardians: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300",
};

export function NoticesList({
  notices,
  loading,
  onEdit,
  onDeleted,
}: {
  notices: Notice[];
  loading: boolean;
  onEdit: (n: Notice) => void;
  onDeleted: () => void;
}) {
  const { t, locale, dir } = useApp();
  const { toast } = useToast();
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [toDelete, setToDelete] = React.useState<Notice | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/notices/${toDelete.id}`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Delete failed");
      toast({ title: t("notices.deleted") });
      setToDelete(null);
      onDeleted();
    } catch {
      toast({ title: t("notices.deleteFailed"), variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const dateFmt = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" });

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
    );
  }

  if (notices.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-card/40 p-12 text-center">
        <Megaphone className="mx-auto mb-3 size-12 opacity-30" />
        <p className="text-sm text-muted-foreground">{t("notices.empty")}</p>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="max-h-[calc(100vh-16rem)] pe-3">
        <div className="grid gap-3 sm:grid-cols-2" dir={dir()}>
          {notices.map((n) => {
            const isLong = n.content.length > 160;
            const isExpanded = expanded.has(n.id);
            return (
              <Card key={n.id} className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
                <CardContent className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className={cn("capitalize", TYPE_TINT[n.type])}>
                        {t(`notices.${n.type}`)}
                      </Badge>
                      <Badge variant="outline" className={cn("capitalize", AUDIENCE_TINT[n.audience])}>
                        {t(`notices.${n.audience}`)}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7" aria-label={t("common.actions")}>
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(n)}>
                          <Pencil className="size-4" /> {t("common.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setToDelete(n)}
                          className="text-rose-600 focus:text-rose-700"
                        >
                          <Trash2 className="size-4" /> {t("common.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div>
                    <h3 className="line-clamp-2 font-semibold leading-tight">{n.title}</h3>
                    <p
                      className={cn(
                        "mt-1.5 whitespace-pre-wrap text-sm text-muted-foreground",
                        !isExpanded && isLong && "line-clamp-2"
                      )}
                    >
                      {n.content}
                    </p>
                    {isLong && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(n.id)}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:underline"
                      >
                        {isExpanded ? (
                          <>{t("notices.readLess")} <ChevronUp className="size-3" /></>
                        ) : (
                          <>{t("notices.readMore")} <ChevronDown className="size-3" /></>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3" />
                      {dateFmt.format(new Date(n.publishedAt))}
                    </span>
                    {n.expiresAt && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        {t("notices.expiresAt")}: {dateFmt.format(new Date(n.expiresAt))}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("notices.delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("notices.deleteConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {deleting ? t("common.loading") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
