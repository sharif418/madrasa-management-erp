// PtmForm — schedule a new PTM session.
// Fields: student (searchable), teacher (searchable), date, time (HH:mm),
// duration (15/30/45/60), topic?. Submit → POST /api/ptm.
"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/store/app-store";
import { DURATION_OPTIONS } from "./ptm-types";

type Lite = { id: string; name: string; sub?: string | null };

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
};

export function PtmForm({ open, onOpenChange, onSaved }: Props) {
  const { t } = useApp();
  const [students, setStudents] = useState<Lite[]>([]);
  const [teachers, setTeachers] = useState<Lite[]>([]);
  const [stuSearch, setStuSearch] = useState("");
  const [teaSearch, setTeaSearch] = useState("");
  const [studentId, setStudentId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState(30);
  const [topic, setTopic] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStuSearch(""); setTeaSearch("");
    setStudentId(""); setTeacherId("");
    setDate(new Date().toISOString().slice(0, 10));
    setTime("10:00"); setDuration(30); setTopic("");
  }, [open]);

  // Debounced student search
  useEffect(() => {
    if (!open) return;
    const h = setTimeout(() => {
      const params = new URLSearchParams({ limit: "30" });
      if (stuSearch.trim()) params.set("search", stuSearch.trim());
      fetch(`/api/students?${params}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => {
          if (j?.ok) {
            setStudents((j.data.items || []).map((s: Record<string, unknown>) => ({
              id: s.id as string,
              name: s.name as string,
              sub: (s.rollNo as string) ?? null,
            })));
          }
        })
        .catch(() => setStudents([]));
    }, 250);
    return () => clearTimeout(h);
  }, [stuSearch, open]);

  // Load teachers (once per open)
  useEffect(() => {
    if (!open) return;
    const params = new URLSearchParams({ limit: "50" });
    if (teaSearch.trim()) params.set("search", teaSearch.trim());
    fetch(`/api/teachers?${params}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok) {
          setTeachers((j.data.items || []).map((tch: Record<string, unknown>) => ({
            id: tch.id as string,
            name: tch.name as string,
            sub: (tch.designation as string) ?? null,
          })));
        }
      })
      .catch(() => setTeachers([]));
  }, [teaSearch, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return toast.error(t("ptm.selectStudent"));
    if (!teacherId) return toast.error(t("ptm.selectTeacher"));
    if (!date) return toast.error(t("ptm.date"));
    if (!/^\d{2}:\d{2}$/.test(time)) return toast.error(t("ptm.time"));
    setSaving(true);
    try {
      const res = await fetch("/api/ptm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId, teacherId, date, time,
          duration, topic: topic.trim() || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Failed");
      toast.success(t("ptm.saved"));
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <LitePicker
        label={t("ptm.student")}
        search={stuSearch}
        onSearch={setStuSearch}
        items={students}
        selectedId={studentId}
        onSelect={setStudentId}
        placeholder={t("ptm.searchStudent")}
      />
      <LitePicker
        label={t("ptm.teacher")}
        search={teaSearch}
        onSearch={setTeaSearch}
        items={teachers}
        selectedId={teacherId}
        onSelect={setTeacherId}
        placeholder={t("ptm.searchTeacher")}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ptm-date">{t("ptm.date")}</Label>
          <Input id="ptm-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ptm-time">{t("ptm.time")}</Label>
          <Input id="ptm-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>{t("ptm.duration")}</Label>
        <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {DURATION_OPTIONS.map((d) => (
              <SelectItem key={d} value={String(d)}>{d} min</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ptm-topic">{t("ptm.topic")}</Label>
        <Textarea
          id="ptm-topic" rows={2} value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={t("ptm.topicPlaceholder")}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
          {t("common.cancel")}
        </Button>
        <Button
          type="submit" disabled={saving}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {t("ptm.schedule")}
        </Button>
      </div>
    </form>
  );
}

function LitePicker({
  label, search, onSearch, items, selectedId, onSelect, placeholder,
}: {
  label: string;
  search: string;
  onSearch: (v: string) => void;
  items: Lite[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder: string;
}) {
  const selected = items.find((i) => i.id === selectedId);
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {!selectedId ? (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={placeholder}
              className="ps-9"
            />
          </div>
          <div className="max-h-36 overflow-y-auto rounded-md border border-border/60 divide-y divide-border/60">
            {items.length === 0 ? (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">{placeholder}</p>
            ) : (
              items.map((s) => (
                <button
                  type="button" key={s.id}
                  onClick={() => onSelect(s.id)}
                  className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent"
                >
                  <span className="truncate">{s.name}</span>
                  {s.sub && <span className="text-[10px] text-muted-foreground truncate ms-2">{s.sub}</span>}
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-md border border-cyan-300/60 bg-cyan-50/50 dark:bg-cyan-950/20 px-3 py-2">
          <span className="text-sm font-medium truncate">{selected?.name}</span>
          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => onSelect("")}>
            <X className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
