// App header — mobile menu, page title, prayer widget on the left;
// command-palette search, language, theme, notifications, logout on the right.
// Subtle vertical dividers separate logical action groups; consistent icon
// sizing throughout. Sticky + backdrop-blur; adapts to light/dark.
"use client";
import { usePathname } from "next/navigation";
import { useApp } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { NotificationBell } from "@/components/shell/notification-bell";
import { PrayerTimeWidget } from "@/components/shell/prayer-time-widget";
import { Menu, LogOut, Moon, Search } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export function AppHeader({
  onOpenCommandPalette,
}: {
  onOpenCommandPalette?: () => void;
}) {
  const { t, setSidebarOpen, logout } = useApp();
  const pathname = usePathname();
  const view = pathname.replace(/^\//, "").split("/")[0] || "dashboard";

  const onLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      logout();
      toast.success("Logged out successfully");
    } catch {
      logout();
    }
  };

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-white/80 dark:bg-background/80 backdrop-blur-md">
      <div className="flex h-full items-center justify-between gap-3 px-4 lg:px-6">
        {/* Left: mobile menu + title/date + prayer widget */}
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex min-w-0 flex-col leading-tight">
            <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Moon className="hidden h-4 w-4 text-emerald-600 dark:text-emerald-400 sm:inline" />
              <span className="truncate">{t(`nav.${view}`)}</span>
            </h1>
            <p className="hidden text-xs text-muted-foreground sm:block truncate">
              {today}
            </p>
          </div>

          {/* Prayer widget — separated with a subtle divider */}
          <div className="hidden h-10 border-l border-border/60 ps-3 sm:flex sm:items-center">
            <PrayerTimeWidget />
          </div>
        </div>

        {/* Right: search | language + theme | notifications | logout */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCommandPalette}
            className="gap-2 border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
            title={t("command.hint")}
          >
            <Search className="h-3.5 w-3.5" />
            <kbd className="hidden items-center gap-0.5 font-mono text-[10px] font-semibold tracking-wide sm:inline-flex">
              ⌘K
            </kbd>
            <span className="sr-only">{t("command.hint")}</span>
          </Button>

          <div className="mx-1 h-6 w-px bg-border/60" aria-hidden="true" />

          <LanguageSwitcher compact />
          <ThemeToggle />

          <div className="mx-1 h-6 w-px bg-border/60" aria-hidden="true" />

          <NotificationBell />

          <div className="mx-1 h-6 w-px bg-border/60" aria-hidden="true" />

          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            title={t("auth.logout")}
            aria-label={t("auth.logout")}
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
