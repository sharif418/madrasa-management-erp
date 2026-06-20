// PtmCompleteDialog — Mark Complete + add meeting outcome notes.
// PUT /api/ptm/[id] with status=completed + notes.
"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApp } from "@/store/app-store";
import type { PtmItem } from "./ptm-types";

type Props = {
  target: PtmItem | null;
  onClose: () => void;
  onSaved: () => void;
};

export function PtmCompleteDialog({ target, onClose, onSaved }: Props) {
  const { t } = useApp();
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNotes(target?.notes ?? "");
  }, [target]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/ptm/${target.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", notes: notes.trim() || null }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Failed");
      toast.success(t("ptm.completed"));
      onClose();
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!target} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-500" />
            {t("ptm.markComplete")}
          </DialogTitle>
          <DialogDescription>
            {target?.studentName} ↔ {target?.teacherName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ptm-notes">{t("ptm.outcomeNotes")}</Label>
            <Textarea
              id="ptm-notes" rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("ptm.notesPlaceholder")}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit" disabled={saving}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {t("ptm.markComplete")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
