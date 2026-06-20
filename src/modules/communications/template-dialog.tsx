"use client";
// TemplateDialog — Create/Edit message template form (used by TemplatesTab).
import * as React from "react";
import { useApp } from "@/store/app-store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";

const CHANNELS = ["sms", "whatsapp", "email", "app"] as const;
const CATEGORIES = ["fee_reminder", "absence_alert", "event_notice", "exam_result", "general"] as const;

const catKey: Record<string, string> = {
  fee_reminder: "feeReminder", absence_alert: "absenceAlert",
  event_notice: "eventNotice", exam_result: "examResult", general: "general",
};

function extractVars(body: string): string[] {
  const re = /\{(\w+)\}/g;
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) set.add(m[1]);
  return [...set];
}

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

export function TemplateDialog({
  open, onOpenChange, editing, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Template | null;
  onSaved: () => void;
}) {
  const { t, dir } = useApp();
  const [name, setName] = React.useState("");
  const [channel, setChannel] = React.useState("sms");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [category, setCategory] = React.useState("general");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setChannel(editing?.channel ?? "sms");
      setSubject(editing?.subject ?? "");
      setBody(editing?.body ?? "");
      setCategory(editing?.category ?? "general");
    }
  }, [open, editing]);

  const vars = React.useMemo(() => extractVars(body), [body]);

  const save = async () => {
    if (!name.trim() || !body.trim()) { toast.error("Name and body required"); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/communications/templates/${editing.id}` : "/api/communications/templates";
      const r = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, channel, subject, body, category }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Failed");
      toast.success(t("communications.templateSaved"));
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={dir()} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? t("common.edit") : t("communications.createTemplate")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("communications.templateName")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("communications.channel")}</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("communications.category")}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(`communications.${catKey[c]}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {channel === "email" && (
            <div className="space-y-1.5">
              <Label className="text-xs">{t("communications.subject")}</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">{t("communications.templateBody")}</Label>
            <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} dir={dir()} />
            <p className="text-[10px] text-muted-foreground">{t("communications.varHint")}</p>
            {vars.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {vars.map((v) => (
                  <code key={v} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-300">
                    {`{${v}}`}
                  </code>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button onClick={save} disabled={saving} className="bg-cyan-600 text-white hover:bg-cyan-700">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
