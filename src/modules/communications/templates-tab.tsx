"use client";
// TemplatesTab — message template management for the Communications module.
// Cards list + Create/Edit dialog (separate component) + "Use Template" → Compose tab.
import * as React from "react";
import { useApp } from "@/store/app-store";
import { toast } from "sonner";
import {
  Card, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Smartphone, MessageCircle, Mail, MessageSquare,
  Pencil, Trash2, Plus, FileText, Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TemplateDialog } from "./template-dialog";

export type Template = {
  id: string;
  name: string;
  channel: string;
  subject?: string | null;
  body: string;
  variables: string[];
  category?: string | null;
  updatedAt: string;
};

const CHANNELS = [
  { value: "sms", icon: Smartphone },
  { value: "whatsapp", icon: MessageCircle },
  { value: "email", icon: Mail },
  { value: "app", icon: MessageSquare },
] as const;

const catBadge: Record<string, string> = {
  fee_reminder: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  absence_alert: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  event_notice: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  exam_result: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  general: "bg-muted text-muted-foreground",
};

const channelBadge: Record<string, string> = {
  sms: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  whatsapp: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  email: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  app: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
};

const catKey: Record<string, string> = {
  fee_reminder: "feeReminder", absence_alert: "absenceAlert",
  event_notice: "eventNotice", exam_result: "examResult", general: "general",
};

export function TemplatesTab({
  onUseTemplate,
}: {
  onUseTemplate: (t: { title: string; body: string; channel: string }) => void;
}) {
  const { t, dir } = useApp();
  const [items, setItems] = React.useState<Template[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<Template | null>(null);
  const [open, setOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/communications/templates", { credentials: "include" });
      const j = await r.json();
      if (j?.ok) setItems(j.data.items as Template[]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const onDelete = async (id: string) => {
    if (!confirm(t("common.delete"))) return;
    try {
      const r = await fetch(`/api/communications/templates/${id}`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error);
      toast.success(t("communications.templateDeleted"));
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const onUse = (tpl: Template) => {
    onUseTemplate({ title: tpl.subject || tpl.name, body: tpl.body, channel: tpl.channel });
    toast.success(t("communications.useTemplate") + " → " + t("communications.compose"));
  };

  return (
    <div className="space-y-4" dir={dir()}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("communications.varHint")}</p>
        <Button
          onClick={() => { setEditing(null); setOpen(true); }}
          className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-700 hover:to-teal-700"
        >
          <Plus className="size-4" /> {t("communications.createTemplate")}
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="grid place-items-center p-10 text-center text-sm text-muted-foreground">
            <FileText className="mb-2 size-8 opacity-40" />
            {t("communications.noTemplates")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((tpl) => {
            const ch = CHANNELS.find((c) => c.value === tpl.channel) ?? CHANNELS[3];
            const ChIcon = ch.icon;
            return (
              <Card key={tpl.id} className="group border border-border/60 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold">{tpl.name}</h3>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="secondary" className={cn("text-[10px] gap-1", channelBadge[tpl.channel])}>
                          <ChIcon className="size-3" /> {tpl.channel.toUpperCase()}
                        </Badge>
                        {tpl.category && (
                          <Badge variant="secondary" className={cn("text-[10px]", catBadge[tpl.category])}>
                            {t(`communications.${catKey[tpl.category]}`)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {tpl.subject && (
                    <p className="text-xs font-medium text-muted-foreground">{tpl.subject}</p>
                  )}
                  <p className="line-clamp-3 text-xs text-muted-foreground">{tpl.body}</p>
                  {tpl.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tpl.variables.slice(0, 5).map((v) => (
                        <code key={v} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-300">
                          {`{${v}}`}
                        </code>
                      ))}
                      {tpl.variables.length > 5 && (
                        <span className="text-[10px] text-muted-foreground">+{tpl.variables.length - 5}</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-1 border-t border-border/40 pt-2">
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800 dark:text-cyan-300" onClick={() => onUse(tpl)}>
                      <Wand2 className="size-3" /> {t("communications.useTemplate")}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => { setEditing(tpl); setOpen(true); }}>
                      <Pencil className="size-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-rose-600 hover:bg-rose-50" onClick={() => onDelete(tpl.id)}>
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <TemplateDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        onSaved={() => { void load(); setOpen(false); }}
      />
    </div>
  );
}
