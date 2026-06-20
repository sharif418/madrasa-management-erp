"use client";
// QrScanner — manual/paste student ID + "Mark Present" action.
// Calls /api/attendance/qr-scan, plays a beep, shows a success card + today list.
import * as React from "react";
import { QrCode, CheckCircle2, XCircle, ScanLine, GraduationCap } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ScanResult = {
  name: string; rollNo: string | null; className: string | null;
  photoUrl: string | null; status: string; time: string;
};

function useBeep() {
  const ctxRef = React.useRef<AudioContext | null>(null);
  return React.useCallback((ok: boolean) => {
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const ctx = ctxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = ok ? 880 : 220;
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (ok ? 0.18 : 0.35));
      osc.start();
      osc.stop(ctx.currentTime + (ok ? 0.18 : 0.35));
    } catch { /* no-op */ }
  }, []);
}

function initials(name: string) {
  const p = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export function QrScanner() {
  const { t, dir } = useApp();
  const [id, setId] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [last, setLast] = React.useState<ScanResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState<ScanResult[]>([]);
  const beep = useBeep();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const todayStr = React.useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const sid = id.trim();
    if (!sid || busy) return;
    setBusy(true); setError(null);
    try {
      const r = await fetch("/api/attendance/qr-scan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: sid, date: todayStr, status: "present" }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Scan failed");
      const d = j.data;
      const now = new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
      const result: ScanResult = {
        name: d.student.name, rollNo: d.student.rollNo,
        className: d.student.className, photoUrl: d.student.photoUrl,
        status: d.status, time: now,
      };
      setLast(result);
      setHistory((h) => [result, ...h].slice(0, 30));
      beep(true);
      setId("");
      setTimeout(() => inputRef.current?.focus(), 0);
    } catch {
      setError(t("attendance.scanFailed"));
      setLast(null);
      beep(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4" dir={dir()}>
      <Card className="border-emerald-200 dark:border-emerald-900/50">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow">
              <ScanLine className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">{t("attendance.qrScan")}</h3>
              <p className="text-xs text-muted-foreground">{t("attendance.scanForAttendance")}</p>
            </div>
          </div>

          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                autoFocus
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder={t("attendance.scanStudentId")}
                className="pl-9 font-mono"
                disabled={busy}
              />
            </div>
            <Button
              type="submit" disabled={busy || !id.trim()}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
            >
              {busy ? t("common.loading") : t("attendance.markPresent")}
            </Button>
          </form>

          {/* Last result / error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              <XCircle className="size-4" />
              <span>{error}</span>
            </div>
          )}
          {last && (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/30">
              <div className="grid size-12 place-items-center rounded-full bg-white text-emerald-700 ring-2 ring-emerald-300 dark:bg-emerald-900 dark:text-emerald-200 dark:ring-emerald-700">
                <span className="text-sm font-bold">{initials(last.name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-emerald-800 dark:text-emerald-200">{last.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[last.rollNo, last.className].filter(Boolean).join(" · ")} · {last.time}
                </p>
              </div>
              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
                <CheckCircle2 className="size-3 mr-1" />
                {t("attendance.present")}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's scans */}
      {history.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <GraduationCap className="size-4 text-emerald-600" />
                {t("attendance.scanned")}
              </h4>
              <Badge variant="secondary">{history.length}</Badge>
            </div>
            <ul className="max-h-72 overflow-y-auto space-y-1 pr-1">
              {history.map((r, i) => (
                <li key={`${r.name}-${r.time}-${i}`} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="grid size-7 place-items-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                      {initials(r.name)}
                    </div>
                    <span className="truncate font-medium">{r.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">{r.time}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
