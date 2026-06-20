"use client";
// Saved searches bar — chips for reapplying saved filter combos + save-current dialog.
import { useEffect, useState } from "react";
import { Bookmark, BookmarkPlus, RotateCcw, X } from "lucide-react";
import { useApp } from "@/store/app-store";
import { useSavedSearches } from "@/store/saved-searches";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  module: string;
  currentFilters: Record<string, unknown>;
  onApply: (filters: Record<string, unknown>) => void;
  onReset?: () => void;
};

export function SavedSearchesBar({ module, currentFilters, onApply, onReset }: Props) {
  const { t, dir } = useApp();
  const { savedSearches, addSearch, removeSearch } = useSavedSearches();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [mounted, setMounted] = useState(false);

  // Avoid SSR/hydration mismatch — persisted store hydrates after mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const moduleSearches = savedSearches.filter((s) => s.module === module);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (moduleSearches.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(t("search.alreadyExists"));
      return;
    }
    addSearch(trimmed, module, currentFilters);
    toast.success(t("search.savedSuccess"));
    setName("");
    setOpen(false);
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeSearch(id);
    toast.success(t("search.deleted"));
  };

  return (
    <div dir={dir()} className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Bookmark className="size-3.5 text-emerald-600" />
        <span className="hidden sm:inline">{t("search.saved")}:</span>
      </div>

      {mounted && moduleSearches.length === 0 ? (
        <span className="text-xs italic text-muted-foreground/70">
          {t("search.noSaved")}
        </span>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {mounted && moduleSearches.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onApply(s.filters)}
              title={s.name}
              className="group inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition-colors hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
            >
              <span className="max-w-[160px] truncate">{s.name}</span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => handleRemove(s.id, e)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleRemove(s.id, e as unknown as React.MouseEvent);
                  }
                }}
                aria-label={t("search.delete")}
                className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full text-emerald-500/70 opacity-0 transition-opacity hover:bg-emerald-200 hover:text-emerald-800 group-hover:opacity-100 dark:hover:bg-emerald-800"
              >
                <X className="size-3" />
              </span>
            </button>
          ))}
        </div>
      )}

      <Button
        type="button" size="sm" variant="outline"
        onClick={() => setOpen(true)}
        className="h-7 gap-1 border-emerald-200 px-2 text-xs text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
      >
        <BookmarkPlus className="size-3.5" />
        {t("search.saveCurrent")}
      </Button>

      {onReset && (
        <Button
          type="button" size="sm" variant="ghost"
          onClick={onReset}
          className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="size-3.5" />
          {t("search.resetFilters")}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir={dir()} className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookmarkPlus className="size-4 text-emerald-600" />
              {t("search.saveCurrent")}
            </DialogTitle>
            <DialogDescription>{t("search.searchName")}</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("search.namePlaceholder")}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim()}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {t("search.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
