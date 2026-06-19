"use client";
// LibraryCatalogTab — KPI strip + search + category filter + book grid + Lend dialog.
import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  BookMarked, Library as LibraryIcon, BookCheck, ArrowUpRight, Search, Plus, HandCoins, Layers, AlertTriangle,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LIST, CATEGORY_META, availabilityState, type Book, type LibraryKpis,
} from "./types";
import { BookForm } from "./book-form";

const KPI_TILES = [
  { key: "totalTitles", icon: BookMarked, tone: "from-amber-500 to-orange-600" },
  { key: "totalCopies", icon: Layers, tone: "from-orange-500 to-amber-600" },
  { key: "available", icon: BookCheck, tone: "from-emerald-500 to-teal-600" },
  { key: "borrowed", icon: ArrowUpRight, tone: "from-sky-500 to-cyan-600" },
  { key: "overdue", icon: AlertTriangle, tone: "from-rose-500 to-rose-700" },
] as const;

export function LibraryCatalogTab() {
  const { t, dir } = useApp();
  const [books, setBooks] = React.useState<Book[]>([]);
  const [kpis, setKpis] = React.useState<LibraryKpis | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<string>("");
  const [editing, setEditing] = React.useState<Book | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [lendFor, setLendFor] = React.useState<Book | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (search.trim()) params.set("search", search.trim());
      if (category) params.set("category", category);
      const r = await fetch(`/api/library?${params.toString()}`, { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) {
        setBooks(j.data.items as Book[]);
        setKpis(j.data.kpis as LibraryKpis);
      }
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  React.useEffect(() => {
    const id = setTimeout(() => { load(); }, 300);
    return () => clearTimeout(id);
  }, [load]);

  const kpiValues: Record<string, number> = kpis
    ? {
        totalTitles: kpis.totalTitles,
        totalCopies: kpis.totalCopies,
        available: kpis.availableCopies,
        borrowed: kpis.borrowed,
        overdue: kpis.overdue,
      }
    : { totalTitles: 0, totalCopies: 0, available: 0, borrowed: 0, overdue: 0 };

  return (
    <div className="space-y-4" dir={dir()}>
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {KPI_TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <Card key={tile.key} className={cn("border-0 text-white bg-gradient-to-br shadow-sm", tile.tone)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider opacity-90">{t(`library.${tile.key}`)}</p>
                    <p className="text-2xl font-bold tabular-nums">{kpiValues[tile.key]}</p>
                  </div>
                  <Icon className="size-5 opacity-80" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="ps-9"
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategory("")}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition",
              !category ? "border-amber-600 bg-amber-600 text-white" : "border-border bg-muted/50 hover:bg-muted"
            )}
          >
            {t("library.allCategories")}
          </button>
          {CATEGORY_LIST.map((c) => {
            const meta = CATEGORY_META[c];
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-medium capitalize transition",
                  active ? "border-amber-600 bg-amber-600 text-white" : "border-border bg-muted/50 hover:bg-muted"
                )}
                title={c}
              >
                <span className={cn("inline-block size-1.5 rounded-full me-1.5", meta.dot)} />
                {c}
              </button>
            );
          })}
        </div>
        <Button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md hover:from-amber-700 hover:to-orange-700"
        >
          <Plus className="size-4" /> {t("library.addBook")}
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : books.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/40 p-12 text-center">
          <LibraryIcon className="mx-auto mb-3 size-12 opacity-30" />
          <p className="font-medium">{t("library.empty")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("library.emptyDesc")}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((b, idx) => {
            const cat = CATEGORY_META[b.category] || CATEGORY_META.other;
            const CatIcon = cat.icon;
            const avail = availabilityState(b);
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.3) }}
              >
                <Card className="h-full overflow-hidden border-s-4 border-s-amber-500/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="grid size-7 shrink-0 place-items-center rounded-md text-white bg-gradient-to-br from-amber-500 to-orange-600">
                          <CatIcon className="size-3.5" />
                        </span>
                        <Badge variant="outline" className={cn("capitalize", cat.tint)}>{b.category}</Badge>
                      </div>
                      <Badge variant="outline" className={cn("capitalize", avail.tint)}>
                        {t(`library.${avail.label}`)}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="line-clamp-2 font-semibold leading-tight">{b.title}</h3>
                      {b.titleArabic && (
                        <p className="mt-0.5 line-clamp-1 text-sm text-amber-700 dark:text-amber-300" dir="rtl">{b.titleArabic}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">{b.author || "—"}</p>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
                      <span>{t("library.copies")}: <span className="font-semibold text-foreground">{b.availableCopies}/{b.totalCopies}</span></span>
                      {b.shelfLocation && <span>{t("library.shelfLocation")}: {b.shelfLocation}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => { setEditing(b); setFormOpen(true); }}
                      >
                        {t("common.edit")}
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                        disabled={b.availableCopies <= 0}
                        onClick={() => setLendFor(b)}
                      >
                        <HandCoins className="size-3.5" /> {t("library.lend")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <BookForm open={formOpen} onOpenChange={setFormOpen} editing={editing} onSaved={load} />
      <LendDialog book={lendFor} onClose={() => setLendFor(null)} onLent={load} />
    </div>
  );
}

function LendDialog({ book, onClose, onLent }: {
  book: Book | null; onClose: () => void; onLent: () => void;
}) {
  const { t } = useApp();
  const { toast } = useToast();
  const [borrower, setBorrower] = React.useState("");
  const [due, setDue] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (book) {
      setBorrower("");
      const d = new Date(); d.setDate(d.getDate() + 14);
      setDue(d.toISOString().slice(0, 10));
    }
  }, [book]);

  const submit = async () => {
    if (!book) return;
    if (!borrower.trim() || !due) {
      toast({ title: t("library.lendFailed"), description: t("common.required"), variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const r = await fetch("/api/library/lend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id, borrowerName: borrower.trim(), dueDate: new Date(due).toISOString() }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Lend failed");
      toast({ title: t("library.lent") });
      onClose();
      onLent();
    } catch {
      toast({ title: t("library.lendFailed"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!book} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="size-5 text-amber-600" />
            {t("library.lendBook")}
          </DialogTitle>
          <DialogDescription className="line-clamp-1">{book?.title}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ld-b">{t("library.borrower")} *</Label>
            <Input id="ld-b" value={borrower} onChange={(e) => setBorrower(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ld-d">{t("library.dueDate")} *</Label>
            <Input id="ld-d" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>{t("common.cancel")}</Button>
          <Button onClick={submit} disabled={saving} className="bg-amber-600 hover:bg-amber-700">
            {saving ? t("common.loading") : t("library.lend")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
