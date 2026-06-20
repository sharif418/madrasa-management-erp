"use client";
// Audit Timeline — vertical list of audit entries with action-colored icons,
// actor name, action+module+entity, timestamp (relative + absolute), expandable details,
// and before/after diff view when available.
import { useState } from "react";
import { useApp } from "@/store/app-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Plus, Pencil, Trash2, LogIn, LogOut, ChevronDown, ChevronRight, UserCircle, History,
  GitCompare,
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

function TimelineRow({ entry, locale }: { entry: AuditEntry; locale: string }) {
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

  // Extract before/after if present (and strip from "other" details)
  let before: Record<string, unknown> | undefined;
  let after: Record<string, unknown> | undefined;
  let otherDetails: Record<string, unknown> | null = null;
  if (detailsObj) {
    const { before: b, after: a, ...rest } = detailsObj;
    if (b && typeof b === "object") before = b as Record<string, unknown>;
    if (a && typeof a === "object") after = a as Record<string, unknown>;
    if (Object.keys(rest).length) otherDetails = rest;
  }
  const hasDiff = !!(before || after);

  return (
    <li className="relative ps-10" dir={dir()}>
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
              {entry.actorPhone && <span className="font-mono">· {entry.actorPhone}</span>}
              <span>·</span>
              <span title={absolute}>{relative} · {absolute}</span>
              {entry.ip && <span className="font-mono">· {entry.ip}</span>}
            </div>
          </div>
        </div>

        {(hasDiff || otherDetails) && (
          <Collapsible open={open} onOpenChange={setOpen} className="mt-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3 rtl:rotate-180" />}
                {hasDiff ? (
                  <span className="inline-flex items-center gap-1"><GitCompare className="size-3" /> {t("audit.changes")}</span>
                ) : (
                  open ? t("audit.collapseDetails") : t("audit.expandDetails")
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {hasDiff && <ChangesTable before={before} after={after} />}
              {otherDetails && (
                <pre
                  dir="ltr"
                  className="overflow-x-auto rounded-lg bg-muted/60 px-3 py-2 text-[11px] leading-relaxed font-mono"
                >
                  {JSON.stringify(otherDetails, null, 2)}
                </pre>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </li>
  );
}

// --- Before/After Diff Table ---
function ChangesTable({
  before, after,
}: { before?: Record<string, unknown>; after?: Record<string, unknown> }) {
  const { t, dir } = useApp();
  const keys = Array.from(new Set([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ])).sort();

  if (keys.length === 0) {
    return <p className="text-xs text-muted-foreground italic">{t("audit.noChanges")}</p>;
  }

  const rows = keys.map((k) => {
    const b = before?.[k];
    const a = after?.[k];
    let kind: "changed" | "added" | "removed" = "changed";
    if (b === undefined) kind = "added";
    else if (a === undefined) kind = "removed";
    return { k, b, a, kind };
  });

  const TINT: Record<typeof rows[number]["kind"], string> = {
    changed: "bg-amber-50 dark:bg-amber-950/30",
    added: "bg-emerald-50 dark:bg-emerald-950/30",
    removed: "bg-rose-50 dark:bg-rose-950/30",
  };
  const TXT: Record<typeof rows[number]["kind"], string> = {
    changed: "text-amber-800 dark:text-amber-300",
    added: "text-emerald-800 dark:text-emerald-300",
    removed: "text-rose-800 dark:text-rose-300",
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-border/60" dir={dir()}>
      <table className="w-full text-xs">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-2 py-1.5 text-start font-medium text-muted-foreground">{t("audit.field")}</th>
            <th className="px-2 py-1.5 text-start font-medium text-muted-foreground">{t("audit.before")}</th>
            <th className="px-2 py-1.5 text-start font-medium text-muted-foreground">{t("audit.after")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.k} className="border-t border-border/50">
              <td className="px-2 py-1.5 font-medium align-top">{r.k}</td>
              <td className={`px-2 py-1.5 align-top font-mono ${r.kind === "added" ? "text-muted-foreground/40" : TXT[r.kind]} ${TINT[r.kind]}`}>
                {fmtVal(r.b)}
              </td>
              <td className={`px-2 py-1.5 align-top font-mono ${r.kind === "removed" ? "text-muted-foreground/40" : TXT[r.kind]} ${TINT[r.kind]}`}>
                {fmtVal(r.a)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function fmtVal(v: unknown): string {
  if (v === undefined || v === null) return "—";
  if (typeof v === "object") {
    try { return JSON.stringify(v); } catch { return String(v); }
  }
  return String(v);
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
