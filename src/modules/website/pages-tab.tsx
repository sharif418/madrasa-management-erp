"use client";
// PagesTab — list of website pages with create / edit / delete actions
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus, Pencil, Trash2, FileText, Home, Globe, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/store/app-store";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type PageMeta, type PageSection } from "./page-section-types";
import { PageBuilderDialog, toPageMeta } from "./page-builder-dialog";

type PageRow = {
  id: string; title: string; slug: string;
  sections: string; isPublished: boolean; isHomepage: boolean;
  createdAt: string; updatedAt: string;
};

export function PagesTab() {
  const { t } = useApp();
  const [pages, setPages] = React.useState<PageRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PageMeta | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/website/pages", { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) setPages(j.data as PageRow[]);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (row: PageRow) => {
    setEditing(toPageMeta(row));
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/website/pages/${deletingId}`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Delete failed");
      toast.success(t("website.pageDeleted"));
      setDeletingId(null);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {pages.length} {t("website.pages").toLowerCase()}
        </p>
        <Button onClick={openCreate}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
          <Plus className="size-4" /> {t("website.createPage")}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : pages.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <FileText className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("website.noPages")}</p>
            <Button onClick={openCreate} variant="outline" size="sm">
              <Plus className="size-4" /> {t("website.createPage")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {pages.map((p) => {
            const secCount = (() => {
              try { return (JSON.parse(p.sections) as PageSection[]).length; } catch { return 0; }
            })();
            return (
              <Card key={p.id} className="transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30">
                      {p.isHomepage ? <Home className="size-4" /> : <Globe className="size-4" />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{p.title}</h3>
                        {p.isHomepage && (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            <Home className="size-3" /> {t("website.homepageBadge")}
                          </Badge>
                        )}
                        {p.isPublished ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            {t("website.pagePublished")}
                          </Badge>
                        ) : (
                          <Badge variant="outline">{t("website.draft")}</Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        /{p.slug} · {secCount} {t("website.sections").toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                      <Pencil className="size-3.5" /> {t("common.edit")}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-rose-600"
                      onClick={() => setDeletingId(p.id)}>
                      <Trash2 className="size-3.5" /> {t("common.delete")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PageBuilderDialog open={dialogOpen} onOpenChange={setDialogOpen}
        initial={editing} onSaved={() => void load()} />

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("website.deletePage")}</AlertDialogTitle>
            <AlertDialogDescription>{t("website.deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={busy}
              className="bg-rose-600 hover:bg-rose-700">
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
