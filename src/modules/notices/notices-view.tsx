"use client";
// NoticesView — top-level shell for the Notices module
// Filter chips + card list + add/edit dialog
import * as React from "react";
import {
  Megaphone, Plus, Info, AlertTriangle, CalendarOff, BookOpen, PartyPopper,
  Users, GraduationCap, UserCog, type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { NoticesList } from "./notices-list";
import { NoticeForm, type Notice } from "./notice-form";

type Type = "all" | "general" | "urgent" | "holiday" | "exam" | "event";
type Audience = "all" | "teachers" | "students" | "guardians";

const TYPE_CHIPS: {
  value: Type;
  tint: string;
  icon: LucideIcon;
  dot: string;
}[] = [
  { value: "all", tint: "data-[active=true]:bg-slate-700 data-[active=true]:text-white data-[active=true]:border-slate-700", icon: Info, dot: "bg-slate-400" },
  { value: "general", tint: "data-[active=true]:bg-sky-600 data-[active=true]:text-white data-[active=true]:border-sky-600", icon: Info, dot: "bg-sky-500" },
  { value: "urgent", tint: "data-[active=true]:bg-rose-600 data-[active=true]:text-white data-[active=true]:border-rose-600", icon: AlertTriangle, dot: "bg-rose-500" },
  { value: "holiday", tint: "data-[active=true]:bg-amber-500 data-[active=true]:text-white data-[active=true]:border-amber-500", icon: CalendarOff, dot: "bg-amber-500" },
  { value: "exam", tint: "data-[active=true]:bg-violet-600 data-[active=true]:text-white data-[active=true]:border-violet-600", icon: BookOpen, dot: "bg-violet-500" },
  { value: "event", tint: "data-[active=true]:bg-emerald-600 data-[active=true]:text-white data-[active=true]:border-emerald-600", icon: PartyPopper, dot: "bg-emerald-500" },
];

const AUDIENCE_CHIPS: {
  value: Audience;
  tint: string;
  icon: LucideIcon;
}[] = [
  { value: "all", tint: "data-[active=true]:bg-slate-700 data-[active=true]:text-white data-[active=true]:border-slate-700", icon: Users },
  { value: "teachers", tint: "data-[active=true]:bg-teal-600 data-[active=true]:text-white data-[active=true]:border-teal-600", icon: UserCog },
  { value: "students", tint: "data-[active=true]:bg-cyan-600 data-[active=true]:text-white data-[active=true]:border-cyan-600", icon: GraduationCap },
  { value: "guardians", tint: "data-[active=true]:bg-fuchsia-600 data-[active=true]:text-white data-[active=true]:border-fuchsia-600", icon: Users },
];

export function NoticesView() {
  const { t, dir } = useApp();
  const [notices, setNotices] = React.useState<Notice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [typeFilter, setTypeFilter] = React.useState<Type>("all");
  const [audienceFilter, setAudienceFilter] = React.useState<Audience>("all");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Notice | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (audienceFilter !== "all") params.set("audience", audienceFilter);
      const r = await fetch(`/api/notices?${params.toString()}`, { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) setNotices(j.data.items as Notice[]);
      else setNotices([]);
    } catch {
      setNotices([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, audienceFilter]);

  React.useEffect(() => { load(); }, [load]);

  const onAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const onEdit = (n: Notice) => {
    setEditing(n);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6" dir={dir()}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-600/20 ring-1 ring-white/30">
            {/* Islamic geometric pattern overlay */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.15]"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='white' stroke-width='1'><polygon points='20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14'/></g></svg>\")",
                backgroundSize: "40px 40px",
                backgroundRepeat: "repeat",
              }}
            />
            <Megaphone className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("notices.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("notices.subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!loading && notices.length > 0 && (
            <Badge variant="outline" className="px-2.5 py-1 text-xs">
              {t("notices.count", { count: notices.length })}
            </Badge>
          )}
          <Button
            onClick={onAdd}
            className="bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-600/20 hover:from-violet-700 hover:to-purple-700"
          >
            <Plus className="size-4" /> {t("notices.add")}
          </Button>
        </div>
      </div>

      {/* Filter chips */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="me-1 text-xs font-medium text-muted-foreground">{t("notices.type")}:</span>
            {TYPE_CHIPS.map((chip) => {
              const Icon = chip.icon;
              const active = typeFilter === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  data-active={active}
                  onClick={() => setTypeFilter(chip.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
                    "bg-muted/50 text-muted-foreground hover:bg-muted",
                    active && "shadow-sm ring-1 ring-white/30",
                    chip.tint
                  )}
                >
                  <Icon className="size-3" />
                  {chip.value === "all" ? t("common.all") : t(`notices.${chip.value}`)}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="me-1 text-xs font-medium text-muted-foreground">{t("notices.audience")}:</span>
            {AUDIENCE_CHIPS.map((chip) => {
              const Icon = chip.icon;
              const active = audienceFilter === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  data-active={active}
                  onClick={() => setAudienceFilter(chip.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
                    "bg-muted/50 text-muted-foreground hover:bg-muted",
                    active && "shadow-sm ring-1 ring-white/30",
                    chip.tint
                  )}
                >
                  <Icon className="size-3" />
                  {chip.value === "all" ? t("common.all") : t(`notices.${chip.value}`)}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {!loading && notices.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/40 p-12 text-center">
          <Megaphone className="mx-auto mb-3 size-12 opacity-30" />
          <p className="text-sm text-muted-foreground">
            {typeFilter !== "all" || audienceFilter !== "all"
              ? t("notices.emptyFiltered")
              : t("notices.empty")}
          </p>
        </div>
      ) : (
        <NoticesList
          notices={notices}
          loading={loading}
          onEdit={onEdit}
          onDeleted={load}
        />
      )}

      <NoticeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSaved={load}
      />
    </div>
  );
}
