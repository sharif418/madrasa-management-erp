"use client";
// EventForm — Add/Edit dialog with title, Arabic title, type, dates, location,
// audience, highlight switch, description.
import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { CalendarPlus, Save } from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { EVENT_TYPES, AUDIENCES, type CalEvent } from "./types";

function toDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function EventForm({
  open, onOpenChange, editing, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: CalEvent | null;
  onSaved: () => void;
}) {
  const { t } = useApp();
  const { toast } = useToast();
  const [title, setTitle] = React.useState("");
  const [titleArabic, setTitleArabic] = React.useState("");
  const [type, setType] = React.useState<string>("event");
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [allDay, setAllDay] = React.useState(true);
  const [location, setLocation] = React.useState("");
  const [audience, setAudience] = React.useState("all");
  const [highlight, setHighlight] = React.useState(false);
  const [desc, setDesc] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setTitle(editing?.title ?? "");
    setTitleArabic(editing?.titleArabic ?? "");
    setType(editing?.type ?? "event");
    setStart(editing?.startDate ? toDateInput(new Date(editing.startDate)) : toDateInput(new Date()));
    setEnd(editing?.endDate ? toDateInput(new Date(editing.endDate)) : "");
    setAllDay(editing?.isAllDay ?? true);
    setLocation(editing?.location ?? "");
    setAudience(editing?.audience ?? "all");
    setHighlight(editing?.isHighlighted ?? false);
    setDesc(editing?.description ?? "");
  }, [open, editing]);

  const submit = async () => {
    if (!title.trim() || !start) {
      toast({ title: t("calendar.eventFailed"), description: t("common.required"), variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        titleArabic: titleArabic.trim(),
        type,
        startDate: new Date(start).toISOString(),
        endDate: end ? new Date(end).toISOString() : null,
        isAllDay: allDay,
        location: location.trim(),
        audience,
        isHighlighted: highlight,
        description: desc.trim(),
      };
      const r = editing
        ? await fetch(`/api/calendar/${editing.id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
          })
        : await fetch("/api/calendar", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
          });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Save failed");
      toast({ title: t("calendar.eventSaved") });
      onOpenChange(false);
      onSaved();
    } catch {
      toast({ title: t("calendar.eventFailed"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="size-5 text-violet-600" />
            {editing ? t("common.edit") : t("calendar.addEvent")}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ef-title">{t("calendar.eventTitle")} *</Label>
              <Input id="ef-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ef-ta">{t("calendar.titleArabic")}</Label>
              <Input id="ef-ta" value={titleArabic} onChange={(e) => setTitleArabic(e.target.value)} dir="rtl" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>{t("calendar.type")}</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((ty) => (
                    <SelectItem key={ty} value={ty}>{t(`calendar.types.${ty}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("calendar.audience")}</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AUDIENCES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a === "all" ? t("calendar.audienceAll")
                        : a === "staff" ? t("calendar.audienceStaff")
                        : a === "parents" ? t("calendar.audienceParents")
                        : t("calendar.audienceStudents")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ef-loc">{t("calendar.location")}</Label>
              <Input id="ef-loc" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ef-start">{t("calendar.startDate")} *</Label>
              <Input id="ef-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ef-end">{t("calendar.endDate")}</Label>
              <Input id="ef-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
              <Label htmlFor="ef-allday" className="cursor-pointer">{t("calendar.allDay")}</Label>
              <Switch id="ef-allday" checked={allDay} onCheckedChange={setAllDay} />
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
              <Label htmlFor="ef-hi" className="cursor-pointer">{t("calendar.highlight")}</Label>
              <Switch id="ef-hi" checked={highlight} onCheckedChange={setHighlight} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ef-desc">{t("calendar.description")}</Label>
            <Textarea id="ef-desc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} maxLength={1000} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>{t("common.cancel")}</Button>
          <Button onClick={submit} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
            <Save className="size-4" /> {saving ? t("common.loading") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
