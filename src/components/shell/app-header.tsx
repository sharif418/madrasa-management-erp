// App header — mobile menu button, page title, prayer widget, language switcher, logout
"use client";
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
  const { t, setSidebarOpen, view, logout } = useApp();

  const onLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      logout();
      toast.success("Logged out successfully");
    } catch {
      logout();
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-white/80 dark:bg-background/80 backdrop-blur-md">
      <div className="flex h-full items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Moon className="h-4 w-4 text-emerald-600 hidden sm:inline" />
              {t(`nav.${view}`)}
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          </div>
          <PrayerTimeWidget />
        </div>

        <div className="flex items-center gap-1">
          {/* ⌘K command palette trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCommandPalette}
            className="gap-2 border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
            title={t("command.hint")}
          >
            <Search className="h-3.5 w-3.5" />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 font-mono text-[10px] font-semibold tracking-wide">
              ⌘K
            </kbd>
            <span className="sr-only">{t("command.hint")}</span>
          </Button>
          <LanguageSwitcher compact />
          <ThemeToggle />
          <NotificationBell />
          <Button variant="ghost" size="icon" onClick={onLogout} title={t("auth.logout")}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
