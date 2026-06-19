"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/store/app-store";
import { LandingPage } from "@/components/landing/landing-page";
import { AppShell } from "@/components/shell/app-shell";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, locale, dir, setUser, setLocale } = useApp();
  const [bootstrapped, setBootstrapped] = useState(false);

  // On mount: check if user has a valid session
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!alive) return;
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.data) {
            setUser(json.data.user, json.data.tenant?.name ?? null);
            if (json.data.tenant?.language) {
              setLocale(json.data.tenant.language as "bn" | "en" | "ar");
            }
          }
        }
      } catch {
        // ignore
      } finally {
        if (alive) setBootstrapped(true);
      }
    })();
    return () => { alive = false; };
  }, [setUser, setLocale]);

  // Sync <html lang> + dir with current locale
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir();
  }, [locale, dir]);

  if (!bootstrapped) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <AppShell /> : <LandingPage />;
}
