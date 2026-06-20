"use client";
// AttendanceMarker — list of persons (students or teachers) with status radios
// for a single date + session. Supports "Mark All Present" + Save (submits array via POST).
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Zap, Sunrise, Sunset, CalendarDays } from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { STATUS_OPTIONS, StatusButton, type Status } from "./attendance-status";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type Session = "morning" | "afternoon" | "full";

type Person = {
  id: string;
  name: string;
  rollNo?: string | null;
  designation?: string | null;
  className?: string | null;
};

export function AttendanceMarker({
  date,
  personType,
  classId,
  onSaved,
}: {
  date: Date;
  personType: "student" | "teacher";
  classId: string;
  onSaved?: () => void;
}) {
  const { t, dir } = useApp();
  const { toast } = useToast();
  const [persons, setPersons] = React.useState<Person[]>([]);
  const [marks, setMarks] = React.useState<Record<string, Status>>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [session, setSession] = React.useState<Session>("full");

  const dateKey = React.useMemo(() => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }, [date]);

  // Load roster (students or teachers) for this tenant
  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const endpoint = personType === "student"
          ? `/api/students?limit=200${classId ? `&classId=${encodeURIComponent(classId)}` : ""}`
          : "/api/teachers?limit=200";
        const r = await fetch(endpoint, { cache: "no-store" });
        const j = await r.json();
        if (!alive) return;
        const items: Person[] = (j?.data?.items ?? []).map((p: Record<string, unknown>) => ({
          id: p.id as string,
          name: p.name as string,
          rollNo: (p.rollNo as string | null) ?? null,
          designation: (p.designation as string | null) ?? null,
          className:
            p.class && typeof p.class === "object" && "name" in p.class
              ? (p.class as { name: string }).name
              : null,
        }));
        setPersons(items);
      } catch {
        if (alive) setPersons([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [personType, classId]);

  // Load existing attendance for this date + personType + session
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(
          `/api/attendance?date=${encodeURIComponent(dateKey)}&personType=${personType}&session=${session}&limit=200`,
          { cache: "no-store" }
        );
        const j = await r.json();
        if (!alive) return;
        const map: Record<string, Status> = {};
        for (const it of j?.data?.items ?? []) {
          map[it.personId as string] = it.status as Status;
        }
        setMarks(map);
      } catch {
        /* ignore — leave empty */
      }
    })();
    return () => { alive = false; };
  }, [dateKey, personType, session]);

  const setOne = (id: string, s: Status) =>
    setMarks((prev) => ({ ...prev, [id]: s }));

  const markAllPresent = () => {
    const next: Record<string, Status> = {};
    for (const p of persons) next[p.id] = "present";
    setMarks(next);
  };

  const save = async () => {
    const entries = persons
      .filter((p) => marks[p.id])
      .map((p) => ({ personId: p.id, personType, status: marks[p.id] }));
    if (entries.length === 0) {
      toast({ title: t("attendance.failed"), variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const r = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateKey, session, entries }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Save failed");
      toast({ title: t("attendance.saved") });
      onSaved?.();
    } catch {
      toast({ title: t("attendance.failed"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Summary counts
  const counts = React.useMemo(() => {
    const c = { present: 0, absent: 0, late: 0, leave: 0, unmarked: 0 };
    for (const p of persons) {
      const s = marks[p.id];
      if (!s) c.unmarked += 1;
      else c[s] += 1;
    }
    return c;
  }, [persons, marks]);

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        {/* Session selector + Summary bar with colored dots */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 p-2.5">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">{t("attendance.session")}</Label>
            <Select value={session} onValueChange={(v) => setSession(v as Session)}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">
                  <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" /> {t("attendance.fullDay")}</span>
                </SelectItem>
                <SelectItem value="morning">
                  <span className="flex items-center gap-1.5"><Sunrise className="size-3.5" /> {t("attendance.morning")}</span>
                </SelectItem>
                <SelectItem value="afternoon">
                  <span className="flex items-center gap-1.5"><Sunset className="size-3.5" /> {t("attendance.afternoon")}</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="h-4 w-px bg-border" />
          {STATUS_OPTIONS.map((opt) => {
            const c = counts[opt.value];
            return (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium shadow-sm"
              >
                <span className={cn("size-2 rounded-full", opt.dot)} />
                <span className="text-muted-foreground">{t(`attendance.${opt.value}`)}</span>
                <span className="font-semibold tabular-nums">{c}</span>
              </span>
            );
          })}
          {counts.unmarked > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium shadow-sm">
              <span className="size-2 rounded-full bg-muted-foreground/40" />
              <span className="text-muted-foreground">{t("attendance.unmarked")}</span>
              <span className="font-semibold tabular-nums">{counts.unmarked}</span>
            </span>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {t("attendance.markedToday")}:{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {persons.length - counts.unmarked}/{persons.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={markAllPresent}
              disabled={persons.length === 0}
              className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70"
            >
              <Zap className="size-4" /> {t("attendance.markAllPresent")}
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700"
              onClick={save}
              disabled={saving || persons.length === 0}
            >
              <Save className="size-4" />
              {saving ? t("common.loading") : t("attendance.save")}
            </Button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : persons.length === 0 ? (
          <div className="rounded-xl border bg-card/50 p-10 text-center text-sm text-muted-foreground">
            {t("attendance.noPersons")}
          </div>
        ) : (
          <ScrollArea className="max-h-[28rem] pe-3">
            <ul className="space-y-1.5" dir={dir()}>
              {persons.map((p) => {
                const cur = marks[p.id];
                return (
                  <li
                    key={p.id}
                    className="flex flex-col gap-2 rounded-lg border bg-card/40 p-2.5 transition-colors hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{p.name}</span>
                        {p.rollNo && (
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            #{p.rollNo}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {personType === "student"
                          ? p.className ?? "—"
                          : p.designation ?? "—"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1" dir="ltr">
                      {STATUS_OPTIONS.map((opt) => (
                        <StatusButton
                          key={opt.value}
                          value={opt.value}
                          active={cur === opt.value}
                          label={t(`attendance.${opt.value}`)}
                          icon={opt.icon}
                          activeCls={opt.activeCls}
                          idleCls={opt.idleCls}
                          onClick={(v) => setOne(p.id, v)}
                        />
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
