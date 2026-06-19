"use client";
// SearchResults — global cross-entity search results rendered inside the Command Palette.
// Self-contained: receives the live `query` from the parent palette, debounces 300ms,
// fetches from /api/search, and renders grouped results with entity-colored icons.
import * as React from "react";
import { Loader2, Users, GraduationCap, Heart, BookOpen, Banknote } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useApp, type ViewKey } from "@/store/app-store";
import {
  CommandGroup, CommandItem, CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

type Entity = "student" | "teacher" | "donor" | "book" | "transaction";

type StudentHit = { id: string; name: string; nameArabic: string | null; rollNo: string | null; class: { name: string | null } | null; type: "student" };
type TeacherHit = { id: string; name: string; nameArabic: string | null; phone: string | null; designation: string | null; type: "teacher" };
type DonorHit = { id: string; name: string; country: string | null; type: "donor" };
type BookHit = { id: string; title: string; titleArabic: string | null; author: string | null; category: string | null; type: "book" };
type TxnHit = { id: string; description: string | null; amount: number; txnType: string; type: "transaction"; date: string };

type SearchResponse = {
  students: StudentHit[];
  teachers: TeacherHit[];
  donors: DonorHit[];
  books: BookHit[];
  transactions: TxnHit[];
  total: number;
};

type EntityConfig = {
  icon: LucideIcon;
  view: ViewKey;
  labelKey: string;
  tile: string;
};

const ENTITY_ORDER: Entity[] = ["student", "teacher", "donor", "book", "transaction"];

const ENTITY_CONFIG: Record<Entity, EntityConfig> = {
  student:     { icon: Users,         view: "students", labelKey: "search.students",     tile: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" },
  teacher:     { icon: GraduationCap, view: "teachers", labelKey: "search.teachers",     tile: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300" },
  donor:       { icon: Heart,         view: "donors",   labelKey: "search.donors",       tile: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300" },
  book:        { icon: BookOpen,      view: "library",  labelKey: "search.books",        tile: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" },
  transaction: { icon: Banknote,      view: "finance",  labelKey: "search.transactions", tile: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300" },
};

function primaryOf(hit: StudentHit | TeacherHit | DonorHit | BookHit | TxnHit, entity: Entity): string {
  if (entity === "book") return (hit as BookHit).title || "(untitled)";
  if (entity === "transaction") return (hit as TxnHit).description || "(no description)";
  return (hit as StudentHit | TeacherHit | DonorHit).name || "(unnamed)";
}

function sublabelOf(hit: StudentHit | TeacherHit | DonorHit | BookHit | TxnHit, entity: Entity, locale: string): string {
  if (entity === "student") {
    const s = hit as StudentHit;
    const parts: string[] = [];
    if (s.rollNo) parts.push(`#${s.rollNo}`);
    if (s.class?.name) parts.push(s.class.name);
    return parts.join(" · ");
  }
  if (entity === "teacher") {
    const t = hit as TeacherHit;
    return [t.designation, t.phone].filter(Boolean).join(" · ");
  }
  if (entity === "donor") {
    return (hit as DonorHit).country || "";
  }
  if (entity === "book") {
    const b = hit as BookHit;
    return [b.author, b.category].filter(Boolean).join(" · ");
  }
  // transaction
  const t = hit as TxnHit;
  const sign = t.txnType === "expense" ? "-" : "+";
  const localeTag = locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-GB";
  const amt = new Intl.NumberFormat(localeTag, { maximumFractionDigits: 0 }).format(Math.abs(t.amount));
  return `${sign}৳${amt}`;
}

function getItems(res: SearchResponse, entity: Entity) {
  switch (entity) {
    case "student": return res.students;
    case "teacher": return res.teachers;
    case "donor": return res.donors;
    case "book": return res.books;
    case "transaction": return res.transactions;
  }
}

export function SearchResults({
  query,
  onNavigate,
}: {
  query: string;
  onNavigate: (v: ViewKey) => void;
}) {
  const { t, locale } = useApp();
  const [results, setResults] = React.useState<SearchResponse | null>(null);
  const [loading, setLoading] = React.useState(false);

  const q = query.trim();
  const hasQuery = q.length >= 2;

  // Debounced fetch (300ms). Aborts in-flight on query change.
  React.useEffect(() => {
    if (!hasQuery) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}`,
          { signal: ctrl.signal, credentials: "same-origin" }
        );
        if (!res.ok) { setResults(null); return; }
        const json = await res.json();
        setResults((json?.data ?? null) as SearchResponse | null);
      } catch {
        /* aborted or network error — ignore */
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [q, hasQuery]);

  if (!hasQuery) return null;

  return (
    <>
      <CommandSeparator />

      {/* Header strip — total count badge */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>{t("search.results")}</span>
        {results && !loading && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            {t("search.totalResults", { count: results.total })}
          </span>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
          {t("search.searching")}
        </div>
      )}

      {/* Empty state */}
      {!loading && results && results.total === 0 && (
        <div className="px-3 py-6 text-center text-sm text-muted-foreground">
          {t("search.noResults")}
        </div>
      )}

      {/* Grouped results — one CommandGroup per non-empty entity type */}
      {!loading && results && results.total > 0 && (
        <>
          {ENTITY_ORDER.map((entity) => {
            const items = getItems(results, entity);
            if (items.length === 0) return null;
            const cfg = ENTITY_CONFIG[entity];
            const Icon = cfg.icon;
            return (
              <CommandGroup
                key={entity}
                heading={`${t(cfg.labelKey)} · ${items.length}`}
              >
                {items.map((item) => {
                  const title = primaryOf(item, entity);
                  const sub = sublabelOf(item, entity, locale);
                  return (
                    <CommandItem
                      key={`${entity}-${item.id}`}
                      value={`${entity} ${item.id} ${title} ${sub}`}
                      onSelect={() => onNavigate(cfg.view)}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                          cfg.tile
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium leading-tight">
                          {title}
                        </span>
                        {sub && (
                          <span className="truncate text-xs text-muted-foreground">
                            {sub}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            );
          })}
        </>
      )}
    </>
  );
}
