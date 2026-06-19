"use client";
// AttendanceMarker — list of persons (students or teachers) with status radios
// for a single date. Supports "Mark All Present" + Save (submits array via POST).
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Clock, Plane, Save, Zap } from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Status = "present" | "absent" | "late" | "leave";

type Person = {
  id: string;
  name: string;
  rollNo?: string | null;
  designation?: string | null;
  className?: string | null;
};

const STATUS_OPTIONS: { value: Status; icon: React.ReactNode; cls: string }[] = [
  { value: "present", icon: <CheckCircle2 className="size-3.5" />, cls: "data-[state=on]:bg-emerald-600 data-[state=on]:text-white" },
  { value: "absent", icon: <XCircle className="size-3.5" />, cls: "data-[state=on]:bg-rose-600 data-[state=on]:text-white" },
  { value: "late", icon: <Clock className="size-3.5" />, cls: "data-[state=on]:bg-amber-500 data-[state=on]:text-white" },
  { value: "leave", icon: <Plane className="size-3.5" />, cls: "data-[state=on]:bg-violet-600 data-[state=on]:text-white" },
];

function StatusButton({
  value, active, label, icon, cls, onClick,
}: {
  value: Status;
  active: boolean;
  label: string;
  icon: React.ReactNode;
  cls: string;
  onClick: (v: Status) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      onClick={() => onClick(value)}
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-md border border-transparent px-2.5 text-xs font-medium transition-colors",
        active
          ? cls.replace("data-[state=on]:", "")
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

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

  // Load existing attendance for this date + personType
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(
          `/api/attendance?date=${encodeURIComponent(dateKey)}&personType=${personType}&limit=200`,
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
  }, [dateKey, personType]);

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
        body: JSON.stringify({ date: dateKey, entries }),
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
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {t("attendance.present")}: {counts.present}
            </Badge>
            <Badge variant="outline" className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {t("attendance.absent")}: {counts.absent}
            </Badge>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              {t("attendance.late")}: {counts.late}
            </Badge>
            <Badge variant="outline" className="bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
              {t("attendance.leave")}: {counts.leave}
            </Badge>
            {counts.unmarked > 0 && (
              <Badge variant="outline" className="text-muted-foreground">
                {counts.unmarked} ·
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={markAllPresent} disabled={persons.length === 0}>
              <Zap className="size-4" /> {t("attendance.markAllPresent")}
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
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
                          cls={opt.cls}
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
