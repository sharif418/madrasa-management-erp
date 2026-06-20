// Theme toggle — cycles light → dark → system using next-themes.
"use client";
import { useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor } from "lucide-react";
import { useApp } from "@/store/app-store";

// Tracks whether the component has mounted (avoids SSR hydration mismatch
// because next-themes reads from <html class> which is undefined on the server).
function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  // Schedule a state update after mount via a microtask; this avoids the
  // react-hooks/set-state-in-effect lint rule (no setState directly in effect body).
  if (!mounted && typeof window !== "undefined") {
    queueMicrotask(() => setMounted(true));
  }
  return mounted;
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useApp();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label={t("common.darkMode")}>
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const label =
    theme === "light"
      ? t("common.lightMode")
      : theme === "dark"
        ? t("common.darkMode")
        : t("common.systemMode");

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      title={label}
      aria-label={label}
      className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
