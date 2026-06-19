"use client";
// Audit Timeline — vertical list of audit entries with action-colored icons,
// actor name, action+module+entity, timestamp (relative + absolute), expandable details.
import { useState } from "react";
import { useApp } from "@/store/app-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Plus, Pencil, Trash2, LogIn, LogOut, ChevronDown, ChevronRight, UserCircle, History,
} from "lucide-react";
import { auditActionColors, type AuditEntry, type AuditAction } from "./audit-types";

const ICONS: Record<AuditAction, typeof Plus> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
  login: LogIn,
  logout: LogOut,
};

type Props = {
  items: AuditEntry[];
  loading: boolean;
  hasFilters?: boolean;
};

export function AuditTimeline({ items, loading, hasFilters = false }: Props) {
  const { t, locale } = useApp();

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    const title = hasFilters ? t("audit.noLogs") : t("audit.emptyTitle");
    const desc = hasFilters ? t("audit.noLogsDesc") : t("audit.emptyDesc");
    return (
      <div className="rounded-xl border border-dashed py-14 text-center">
        <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-600/10 text-amber-700 dark:text-amber-400">
          <History className="h-5 w-5" />
        </div>
        <p className="text-base font-medium">{title}</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{desc}</p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-3 ps-2">
      {/* gradient vertical spine — emerald → amber */}
      <div
        className="pointer-events-none absolute inset-y-2 start-[18px] w-px bg-gradient-to-b from-emerald-400 via-amber-400 to-amber-600 opacity-60"
        aria-hidden="true"
      />
      {items.map((e) => (
        <TimelineRow key={e.id} entry={e} locale={locale} />
      ))}
    </ol>
  );
}

function TimelineRow({
  entry, locale,
}: { entry: AuditEntry; locale: string }) {
  const { t, dir } = useApp();
  const [open, setOpen] = useState(false);
  const action = entry.action;
  const colors = auditActionColors[action];
  const Icon = ICONS[action];
  const localeStr = locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US";

  const absolute = new Date(entry.createdAt).toLocaleString(localeStr, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const relative = fmtRelative(entry.createdAt);

  let detailsObj: Record<string, unknown> | null = null;
  if (entry.details) {
    try { detailsObj = JSON.parse(entry.details); } catch { /* ignore */ }
  }

  return (
    <li className="relative ps-10" dir={dir()}>
      {/* icon node — distinct tinted background per action */}
      <span
        className={`absolute start-0 top-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background ring-2 shadow-sm ${colors.ring} ${colors.icon}`}
      >
        <Icon className="h-4 w-4" />
      </span>

      <div className="rounded-xl border border-border/60 bg-card px-4 py-3 transition-colors hover:bg-muted/30">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={colors.badge}>
                <span className={`me-1 size-1.5 rounded-full ${colors.dot}`} />
                {t(`audit.${action}`)}
              </Badge>
              <span className="text-sm font-semibold">{entry.module}</span>
              {entry.entityName && (
                <span className="text-sm text-muted-foreground truncate">
                  · {entry.entityName}
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <span className="inline-flex items-center gap-1">
                <UserCircle className="h-3.5 w-3.5" />
                {entry.actorName || t("audit.unknownActor")}
              </span>
              {entry.actorPhone && (
                <span className="font-mono">· {entry.actorPhone}</span>
              )}
              <span>·</span>
              <span title={absolute}>
                {relative} · {absolute}
              </span>
              {entry.ip && (
                <span className="font-mono">· {entry.ip}</span>
              )}
            </div>
          </div>
        </div>

        {detailsObj && (
          <Collapsible open={open} onOpenChange={setOpen} className="mt-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3 rtl:rotate-180" />}
                {open ? t("audit.collapseDetails") : t("audit.expandDetails")}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <pre
                dir="ltr"
                className="overflow-x-auto rounded-lg bg-muted/60 px-3 py-2 text-[11px] leading-relaxed font-mono"
              >
                {JSON.stringify(detailsObj, null, 2)}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </li>
  );
}

function fmtRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo`;
  return `${Math.floor(mo / 12)}y`;
}
