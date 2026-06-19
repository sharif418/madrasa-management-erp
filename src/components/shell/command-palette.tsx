"use client";
// Command Palette — Cmd+K quick navigation + global cross-entity search.
// Controlled component: parent passes { open, onOpenChange } from useCommandPalette hook.
// Search results are rendered by the <SearchResults /> sub-component (debounced fetch
// to /api/search across students, teachers, donors, books, transactions).
import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import {
  Search, LayoutDashboard, Users, GraduationCap, BookOpen,
  BookMarked, ClipboardList, Banknote, Wallet, Bell, Settings, History,
  FileBarChart, UserPlus, Receipt, ClipboardCheck, BellPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useApp, type ViewKey } from "@/store/app-store";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Command, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { SearchResults } from "@/components/shell/search-results";

type NavItem = { key: ViewKey; icon: LucideIcon };
const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", icon: LayoutDashboard },
  { key: "students", icon: Users },
  { key: "teachers", icon: GraduationCap },
  { key: "academic", icon: BookOpen },
  { key: "hifz", icon: BookMarked },
  { key: "finance", icon: Banknote },
  { key: "wallet", icon: Wallet },
  { key: "attendance", icon: ClipboardList },
  { key: "exams", icon: FileBarChart },
  { key: "notices", icon: Bell },
  { key: "settings", icon: Settings },
  { key: "audit", icon: History },
  { key: "reports", icon: FileBarChart },
];

type QuickAction = { id: string; icon: LucideIcon; view: ViewKey; key: string };
const QUICK_ACTIONS: QuickAction[] = [
  { id: "addStudent", icon: UserPlus, view: "students", key: "command.addStudent" },
  { id: "recordHifz", icon: BookMarked, view: "hifz", key: "command.recordHifz" },
  { id: "collectFee", icon: Receipt, view: "finance", key: "command.collectFee" },
  { id: "markAttendance", icon: ClipboardCheck, view: "attendance", key: "command.markAttendance" },
  { id: "addNotice", icon: BellPlus, view: "notices", key: "command.addNotice" },
];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t, setView, dir } = useApp();
  const [query, setQuery] = React.useState("");

  // Reset query when palette closes so next open starts fresh.
  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const go = (v: ViewKey) => {
    setView(v);
    onOpenChange(false);
  };

  // When an active search (>=2 chars) is in progress, the SearchResults
  // component owns the empty state — suppress the cmdk CommandEmpty.
  const hasActiveSearch = query.trim().length >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden p-0 sm:max-w-[560px] gap-0"
        dir={dir()}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{t("command.title")}</DialogTitle>
          <DialogDescription>{t("command.placeholder")}</DialogDescription>
        </DialogHeader>
        <Command
          className={cn(
            "rounded-none",
            "[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-3",
            "[&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1",
            "[&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold",
            "[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider",
            "[&_[cmdk-item]]:gap-2.5 [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-2",
            "[&_[cmdk-item][data-selected=true]]:bg-emerald-50 [&_[cmdk-item][data-selected=true]]:text-emerald-900",
            "dark:[&_[cmdk-item][data-selected=true]]:bg-emerald-950/50 dark:[&_[cmdk-item][data-selected=true]]:text-emerald-100"
          )}
        >
          {/* Gradient search header */}
          <div className="relative flex h-14 items-center gap-2.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-4">
            <Search className="h-5 w-5 shrink-0 text-white" />
            <CommandPrimitive.Input
              placeholder={t("command.placeholder")}
              value={query}
              onValueChange={setQuery}
              className="flex h-9 w-full bg-transparent text-sm text-white placeholder:text-white/80 outline-none"
            />
          </div>

          <CommandList className="max-h-[60vh]">
            {!hasActiveSearch && (
              <CommandEmpty>
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t("command.noResults")}
                </div>
              </CommandEmpty>
            )}

            {/* Global search results — debounced fetch to /api/search */}
            <SearchResults query={query} onNavigate={go} />

            {/* Navigation */}
            <CommandSeparator />
            <CommandGroup heading={t("command.navigation")}>
              {NAV_ITEMS.map(({ key, icon: Icon }) => (
                <CommandItem
                  key={key}
                  value={`nav ${key} ${t(`nav.${key}`)}`}
                  onSelect={() => go(key)}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-medium">{t(`nav.${key}`)}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            {/* Quick Actions */}
            <CommandGroup heading={t("command.actions")}>
              {QUICK_ACTIONS.map(({ id, icon: Icon, view, key }) => (
                <CommandItem
                  key={id}
                  value={`act ${id} ${t(key)}`}
                  onSelect={() => go(view)}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-medium">{t(key)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>

          {/* Footer hint */}
          <div className="flex items-center justify-between gap-2 border-t bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px] shadow-sm">↑↓</kbd>
              <span className="hidden sm:inline">{t("command.navigation").toLowerCase()}</span>
              <kbd className="ms-2 rounded bg-background px-1.5 py-0.5 font-mono text-[10px] shadow-sm">↵</kbd>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px] shadow-sm">esc</kbd>
              <span className="hidden sm:inline">×</span>
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
