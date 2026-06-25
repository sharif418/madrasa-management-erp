// Dashboard layout — wraps all authenticated views with sidebar + header.
// Uses Next.js App Router route group (dashboard) for URL-based navigation.
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/store/app-store";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { AppHeader } from "@/components/shell/app-header";
import { CommandPalette } from "@/components/shell/command-palette";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { OfflineIndicator } from "@/components/shared/offline-indicator";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, setUser, setLocale, locale, dir } = useApp();
  const { open, setOpen } = useCommandPalette();
  const router = useRouter();
  const [bootstrapped, setBootstrapped] = useState(false);

  // On mount: verify session is still valid
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
          } else {
            // No valid session → redirect to landing
            router.replace("/");
            return;
          }
        } else {
          router.replace("/");
          return;
        }
      } catch {
        router.replace("/");
        return;
      } finally {
        if (alive) setBootstrapped(true);
      }
    })();
    return () => { alive = false; };
  }, [setUser, setLocale, router]);

  // Sync <html lang> + dir with current locale
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir();
  }, [locale, dir]);

  // Show loader while checking auth
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

  // If no user after bootstrap, redirect handled above
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/30 via-background to-background dark:from-emerald-950/10">
      <AppSidebar />
      <div className="lg:ps-72">
        <AppHeader onOpenCommandPalette={() => setOpen(true)} />
        <main className="p-4 lg:p-6 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
      {/* Global Cmd+K command palette — always mounted, controlled by hook */}
      <CommandPalette open={open} onOpenChange={setOpen} />
      <OfflineIndicator />
    </div>
  );
}
