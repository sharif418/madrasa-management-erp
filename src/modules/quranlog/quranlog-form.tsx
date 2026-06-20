// QuranLogForm — student selector + date + pages read + surah + para + notes.
// Used inside a Dialog.
"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/store/app-store";

type StudentLite = { id: string; name: string; rollNo: string | null; className: string | null };

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
};

export function QuranLogForm({ open, onOpenChange, onSaved }: Props) {
  const { t } = useApp();
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [search, setSearch] = useState("");
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState("");
  const [pagesRead, setPagesRead] = useState("");
  const [surahName, setSurahName] = useState("");
  const [paraNumber, setParaNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setStudentId("");
    setDate(new Date().toISOString().slice(0, 10));
    setPagesRead("");
    setSurahName("");
    setParaNumber("");
    setNotes("");
  }, [open]);

  // Debounced student search
  useEffect(() => {
    if (!open) return;
    const q = search.trim();
    const handle = setTimeout(() => {
      const params = new URLSearchParams({ limit: "30" });
      if (q) params.set("search", q);
      fetch(`/api/students?${params}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => {
          if (j?.ok) {
            const items: StudentLite[] = (j.data.items || []).map((s: Record<string, unknown>) => ({
              id: s.id as string,
              name: s.name as string,
              rollNo: (s.rollNo as string | null) ?? null,
              className: (s.class as { name?: string } | null)?.name ?? null,
            }));
            setStudents(items);
          }
        })
        .catch(() => setStudents([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [search, open]);

  if (!open) return null;

  const selected = students.find((s) => s.id === studentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return toast.error(t("quranlog.student"));
    const pages = Number(pagesRead);
    if (!Number.isFinite(pages) || pages < 0) return toast.error(t("quranlog.pagesRead"));
    setSaving(true);
    try {
      const res = await fetch("/api/quranlog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          date: date || undefined,
          pagesRead: pages,
          surahName: surahName.trim() || undefined,
          paraNumber: paraNumber || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Failed");
      toast.success(t("quranlog.saved"));
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
      {/* Student selector */}
      <div className="space-y-1.5">
        <Label>{t("quranlog.student")}</Label>
        {!studentId ? (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("quranlog.filterStudent")}
                className="ps-9"
                autoFocus
              />
            </div>
            <div className="max-h-40 overflow-y-auto rounded-md border border-border/60 divide-y divide-border/60">
              {students.length === 0 ? (
                <p className="px-3 py-4 text-xs text-muted-foreground text-center">{t("quranlog.filterStudent")}</p>
              ) : (
                students.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => { setStudentId(s.id); setStudents([]); setSearch(""); }}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent"
                  >
                    <span className="truncate">{s.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate ms-2">
                      {s.rollNo || "—"} · {s.className || "—"}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-md border border-emerald-300/60 bg-emerald-50/50 dark:bg-emerald-950/20 px-3 py-2">
            <span className="text-sm font-medium truncate">{selected?.name}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setStudentId("")}>
              {t("common.edit")}
            </Button>
          </div>
        )}
      </div>

      {/* Date + Pages */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="q-date">{t("quranlog.date")}</Label>
          <Input id="q-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="q-pages">{t("quranlog.pagesRead")}</Label>
          <Input
            id="q-pages" type="number" min="0" step="1"
            value={pagesRead}
            onChange={(e) => setPagesRead(e.target.value)}
            placeholder="5"
          />
        </div>
      </div>

      {/* Surah + Para */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="q-surah">{t("quranlog.surahName")}</Label>
          <Input
            id="q-surah" value={surahName}
            onChange={(e) => setSurahName(e.target.value)}
            placeholder="Al-Baqarah"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="q-para">{t("quranlog.paraNumber")}</Label>
          <Input
            id="q-para" type="number" min="1" max="30"
            value={paraNumber}
            onChange={(e) => setParaNumber(e.target.value)}
            placeholder="1"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="q-notes">{t("quranlog.notes")}</Label>
        <Textarea
          id="q-notes" rows={2} value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="…"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
          {t("common.cancel")}
        </Button>
        <Button
          type="submit" disabled={saving}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {t("common.save")}
        </Button>
      </div>
    </form>
  );
}
