"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2, Filter, Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/store/app-store";

import {
  fmtDate, SALAH_FIELDS, SALAH_TINT,
  type MuhasabaListResponse, type MuhasabaRecord, type MuhasabaStudent, type SalahField, type SalahStatus,
} from "./types";
import { MuhasabaForm } from "./muhasaba-form";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function MuhasabaRecordsTab() {
  const { t, dir } = useApp();
  const [students, setStudents] = useState<MuhasabaStudent[]>([]);
  const [studentId, setStudentId] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MuhasabaListResponse | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/students?limit=200", { cache: "no-store" });
        const json = await res.json();
        if (json.ok) setStudents(json.data.items.map((s: { id: string; name: string; rollNo: string | null }) => ({ id: s.id, name: s.name, rollNo: s.rollNo })));
      } catch { /* ignore */ }
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", limit: "30" });
      if (studentId !== "all") params.set("studentId", studentId);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/muhasaba?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
      setData(json.data as MuhasabaListResponse);
    } catch (err) {
      toast.error(t("muhasaba.loadFailed"), { description: err instanceof Error ? err.message : "" });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [studentId, from, to, t]);

  useEffect(() => { void load(); }, [load]);

  const records = data?.items ?? [];

  return (
    <div className="space-y-4" dir={dir()}>
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
          <Filter className="size-4" />
          <span>Filters</span>
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger><SelectValue placeholder={t("muhasaba.allStudents")} /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">{t("muhasaba.allStudents")}</SelectItem>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} placeholder={t("muhasaba.fromDate")} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} placeholder={t("muhasaba.toDate")} />
        </div>
        <Button
          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
          onClick={() => setFormOpen(true)}
        >
          <Plus className="size-4" />
          {t("muhasaba.logMuhasaba")}
        </Button>
      </div>

      {loading ? (
        <RecordsSkeleton />
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 py-16 text-center">
          <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md ring-1 ring-white/30">
            <Heart className="size-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">{t("muhasaba.empty")}</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">{t("muhasaba.emptyDesc")}</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-start font-medium px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">{t("muhasaba.student")}</th>
                  <th className="text-start font-medium px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">{t("muhasaba.date")}</th>
                  <th className="text-start font-medium px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">{t("muhasaba.salah")}</th>
                  <th className="text-start font-medium px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">{t("muhasaba.akhlaqRating")}</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <RecordRow key={r.id} r={r} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <MuhasabaForm open={formOpen} onOpenChange={setFormOpen} onSaved={load} />
    </div>
  );
}

function RecordRow({ r }: { r: MuhasabaRecord }) {
  const { t } = useApp();
  return (
    <tr className="border-t hover:bg-muted/30 transition-colors">
      <td className="px-3 py-2">
        <p className="font-medium">{r.student.name}</p>
        {r.student.rollNo && <p className="text-xs text-muted-foreground">#{r.student.rollNo}</p>}
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(r.date)}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1.5">
          {SALAH_FIELDS.map((f) => (
            <SalahDot key={f} field={f} status={r[f]} />
          ))}
          <span className="text-[10px] text-muted-foreground ms-2">
            {SALAH_FIELDS.map((f) => t(`muhasaba.${cap(f)}`)[0]).join(" · ")}
          </span>
        </div>
      </td>
      <td className="px-3 py-2">
        <AkhlaqStars rating={r.akhlaqRating} />
      </td>
    </tr>
  );
}

function SalahDot({ field, status }: { field: SalahField; status: SalahStatus }) {
  const { t } = useApp();
  return (
    <div
      className={`size-4 rounded-full ${SALAH_TINT[status]}`}
      title={`${t(`muhasaba.${cap(field)}`)}: ${t(`muhasaba.${status}`)}`}
      aria-label={`${t(`muhasaba.${cap(field)}`)}: ${t(`muhasaba.${status}`)}`}
    />
  );
}

function AkhlaqStars({ rating }: { rating: number }) {
  const safe = Math.max(0, Math.min(5, rating));
  return (
    <div className="flex items-center gap-0.5" aria-label={`Akhlaq ${rating}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < safe ? "text-amber-400" : "text-muted-foreground/30"}>★</span>
      ))}
    </div>
  );
}

function RecordsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
      <div className="sr-only" aria-live="polite">
        <Loader2 className="size-4 animate-spin" />
        Loading muhasaba records...
      </div>
    </div>
  );
}
