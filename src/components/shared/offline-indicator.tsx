// OfflineIndicator — fixed bottom banner shown when navigator.onLine is false.
// Dismissible + auto-hides when reconnecting. Toasts "back online".
"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/store/app-store";
import { WifiOff, X } from "lucide-react";

export function OfflineIndicator() {
  const { t } = useApp();
  const [online, setOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online || dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
      <div className="mx-auto flex max-w-3xl items-start gap-3 rounded-xl border border-amber-300/60 bg-amber-50/95 px-4 py-3 text-amber-900 shadow-lg backdrop-blur dark:bg-amber-950/90 dark:text-amber-100 dark:border-amber-700/60">
        <WifiOff className="size-5 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{t("offline.title")}</p>
          <p className="text-xs opacity-90">{t("offline.desc")}</p>
        </div>
        <button
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
          className="rounded-md p-1 hover:bg-amber-200/50 dark:hover:bg-amber-900/50"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
