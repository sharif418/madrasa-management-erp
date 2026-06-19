"use client";
// NoticesView — top-level shell for the Notices module
// Filter chips + card list + add/edit dialog
import * as React from "react";
import { Megaphone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { NoticesList } from "./notices-list";
import { NoticeForm, type Notice } from "./notice-form";

type Type = "all" | "general" | "urgent" | "holiday" | "exam" | "event";
type Audience = "all" | "teachers" | "students" | "guardians";

const TYPE_CHIPS: { value: Type; tint: string }[] = [
  { value: "all", tint: "data-[active=true]:bg-slate-700 data-[active=true]:text-white" },
  { value: "general", tint: "data-[active=true]:bg-sky-600 data-[active=true]:text-white" },
  { value: "urgent", tint: "data-[active=true]:bg-rose-600 data-[active=true]:text-white" },
  { value: "holiday", tint: "data-[active=true]:bg-amber-500 data-[active=true]:text-white" },
  { value: "exam", tint: "data-[active=true]:bg-violet-600 data-[active=true]:text-white" },
  { value: "event", tint: "data-[active=true]:bg-emerald-600 data-[active=true]:text-white" },
];

const AUDIENCE_CHIPS: { value: Audience; tint: string }[] = [
  { value: "all", tint: "data-[active=true]:bg-slate-700 data-[active=true]:text-white" },
  { value: "teachers", tint: "data-[active=true]:bg-teal-600 data-[active=true]:text-white" },
  { value: "students", tint: "data-[active=true]:bg-cyan-600 data-[active=true]:text-white" },
  { value: "guardians", tint: "data-[active=true]:bg-fuchsia-600 data-[active=true]:text-white" },
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
          <div className="size-10 rounded-xl bg-violet-600/10 text-violet-700 dark:text-violet-400 flex items-center justify-center">
            <Megaphone className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("notices.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {notices.length} {t("notices.title").toLowerCase()}
            </p>
          </div>
        </div>
        <Button onClick={onAdd} className="bg-violet-600 hover:bg-violet-700 self-start sm:self-auto">
          <Plus className="size-4" /> {t("notices.add")}
        </Button>
      </div>

      {/* Filter chips */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="me-1 text-xs font-medium text-muted-foreground">{t("notices.type")}:</span>
            {TYPE_CHIPS.map((chip) => (
              <button
                key={chip.value}
                type="button"
                data-active={typeFilter === chip.value}
                onClick={() => setTypeFilter(chip.value)}
                className={cn(
                  "rounded-full border border-transparent px-3 py-1 text-xs font-medium transition-colors",
                  "bg-muted text-muted-foreground hover:bg-muted/70",
                  chip.tint
                )}
              >
                {chip.value === "all" ? t("common.all") : t(`notices.${chip.value}`)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="me-1 text-xs font-medium text-muted-foreground">{t("notices.audience")}:</span>
            {AUDIENCE_CHIPS.map((chip) => (
              <button
                key={chip.value}
                type="button"
                data-active={audienceFilter === chip.value}
                onClick={() => setAudienceFilter(chip.value)}
                className={cn(
                  "rounded-full border border-transparent px-3 py-1 text-xs font-medium transition-colors",
                  "bg-muted text-muted-foreground hover:bg-muted/70",
                  chip.tint
                )}
              >
                {chip.value === "all" ? t("common.all") : t(`notices.${chip.value}`)}
              </button>
            ))}
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
