"use client";
// NoticeForm — Add/Edit dialog with title, content, type, audience, expiresAt
import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Megaphone, Save } from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";

export type Notice = {
  id: string;
  title: string;
  content: string;
  type: "general" | "urgent" | "holiday" | "exam" | "event";
  audience: "all" | "teachers" | "students" | "guardians";
  publishedAt: string;
  expiresAt: string | null;
};

const TYPES = ["general", "urgent", "holiday", "exam", "event"] as const;
const AUDIENCES = ["all", "teachers", "students", "guardians"] as const;

function toDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function NoticeForm({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Notice | null;
  onSaved: () => void;
}) {
  const { t } = useApp();
  const { toast } = useToast();
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [type, setType] = React.useState<(typeof TYPES)[number]>("general");
  const [audience, setAudience] = React.useState<(typeof AUDIENCES)[number]>("all");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  // Reset form whenever dialog target changes
  React.useEffect(() => {
    if (!open) return;
    setTitle(editing?.title ?? "");
    setContent(editing?.content ?? "");
    setType(editing?.type ?? "general");
    setAudience(editing?.audience ?? "all");
    setExpiresAt(editing?.expiresAt ? toDateInput(new Date(editing.expiresAt)) : "");
  }, [open, editing]);

  const submit = async () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: t("notices.failed"), description: t("common.required"), variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        type,
        audience,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      };
      const r = editing
        ? await fetch(`/api/notices/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/notices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Save failed");
      toast({ title: t("notices.saved") });
      onOpenChange(false);
      onSaved();
    } catch {
      toast({ title: t("notices.failed"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="size-5 text-violet-600" />
            {editing ? t("notices.edit") : t("notices.add")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="nf-title">{t("notices.titleField")} *</Label>
            <Input
              id="nf-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("notices.titleField")}
              maxLength={200}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nf-content">{t("notices.content")} *</Label>
            <Textarea
              id="nf-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("notices.content")}
              rows={5}
              maxLength={4000}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>{t("notices.type")}</Label>
              <Select value={type} onValueChange={(v) => setType(v as (typeof TYPES)[number])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((ty) => (
                    <SelectItem key={ty} value={ty}>{t(`notices.${ty}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("notices.audience")}</Label>
              <Select value={audience} onValueChange={(v) => setAudience(v as (typeof AUDIENCES)[number])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCES.map((a) => (
                    <SelectItem key={a} value={a}>{t(`notices.${a}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nf-expires">{t("notices.expiresAt")}</Label>
              <Input
                id="nf-expires"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
            <Save className="size-4" />
            {saving ? t("common.loading") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
