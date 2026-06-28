"use client";
// NotificationBell — header bell icon with dropdown showing recent notifications + upcoming events.
// Fetches /api/notifications on mount + every 60s. Marks all read via POST /api/notifications/read.
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bell, CalendarClock, Megaphone, MessageSquare, Users, CheckCheck, Inbox, Loader2,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type NotifItem = {
  id: string;
  kind: "notification" | "event";
  title: string;
  body: string;
  channel?: string;
  audience?: string;
  eventType?: string;
  location?: string | null;
  timestamp: string;
  isRead: boolean;
};

function channelIcon(n: NotifItem) {
  if (n.kind === "event") return CalendarClock;
  if (n.channel === "sms" || n.channel === "whatsapp") return MessageSquare;
  if (n.audience === "parents" || n.audience === "students") return Users;
  return Megaphone;
}

function channelTint(n: NotifItem) {
  if (n.kind === "event") return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300";
  if (n.channel === "whatsapp") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
  if (n.channel === "sms") return "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300";
  if (n.audience === "parents") return "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300";
  if (n.audience === "staff") return "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300";
  return "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300";
}

export function NotificationBell() {
  const { t, dir } = useApp();
  const router = useRouter();
  const [items, setItems] = React.useState<NotifItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/notifications", { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) {
        const d = j.data as { items: NotifItem[]; upcoming: NotifItem[] };
        setItems([...d.items, ...d.upcoming]);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try { await fetch("/api/notifications/read", { method: "POST" }); } catch { /* ignore */ }
  };

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t("notifications.title")}>
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span
              className="absolute top-1.5 end-1.5 grid size-4 place-items-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-background"
              aria-label={`${unread} unread`}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className={cn("w-[min(92vw,24rem)] p-0", dir() === "rtl" && "text-end")}>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
              <Bell className="size-3.5" />
            </span>
            <h3 className="text-sm font-semibold">{t("notifications.title")}</h3>
            {unread > 0 && (
              <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                {unread}
              </span>
            )}
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={markAllRead}>
              <CheckCheck className="size-3.5" /> {t("notifications.markAllRead")}
            </Button>
          )}
        </div>

        {/* Body */}
        <div className="max-h-96 overflow-y-auto" dir={dir()}>
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> {t("notifications.loading")}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Inbox className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">{t("notifications.empty")}</p>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => {
                const Icon = channelIcon(n);
                const isEvent = n.kind === "event";
                return (
                  <li key={`${n.kind}-${n.id}`} className="flex gap-3 px-3 py-2.5 transition-colors hover:bg-muted/40">
                    <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg", channelTint(n))}>
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="line-clamp-1 text-sm font-medium">{n.title}</p>
                        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                          {fmtRelative(n.timestamp, t)}
                        </span>
                      </div>
                      {isEvent && (
                        <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                          {t("notifications.upcomingEvent")}
                        </span>
                      )}
                      {n.body && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{n.body}</p>
                      )}
                      {isEvent && n.location && (
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">📍 {n.location}</p>
                      )}
                    </div>
                    {!n.isRead && (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-rose-500" aria-label="unread" />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-xs font-medium text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
            onClick={() => { setOpen(false); router.push("/notices"); }}
          >
            {t("notifications.viewAll")}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function fmtRelative(iso: string, t: (k: string, p?: Record<string, string | number>) => string): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return t("notifications.justNow");
  if (min < 60) return t("notifications.minutesAgo", { count: min });
  const hr = Math.floor(min / 60);
  if (hr < 24) return t("notifications.hoursAgo", { count: hr });
  const day = Math.floor(hr / 24);
  return t("notifications.daysAgo", { count: day });
}
