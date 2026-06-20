"use client";
// AttendanceView — top-level shell for the Attendance module
// Date picker + person type tabs (students/teachers) + QR Scan + class filter + marker + stats
import * as React from "react";
import { CalendarCheck, GraduationCap, Users, QrCode } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { AttendanceMarker } from "./attendance-marker";
import { AttendanceStats } from "./attendance-stats";
import { QrScanner } from "./qr-scanner";

type TabKey = "student" | "teacher" | "qr";

type ClassOption = { id: string; name: string };

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function AttendanceView() {
  const { t, dir, locale } = useApp();
  const today = React.useMemo(() => new Date(), []);
  const [dateStr, setDateStr] = React.useState(toDateInputValue(today));
  const [tab, setTab] = React.useState<TabKey>("student");
  const [classId, setClassId] = React.useState<string>("all");
  const [classes, setClasses] = React.useState<ClassOption[]>([]);
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Load classes list for the student filter
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/students/classes", { cache: "no-store" });
        const j = await r.json();
        if (alive && j?.ok) setClasses(j.data.items as ClassOption[]);
      } catch {
        if (alive) setClasses([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  const selectedDate = React.useMemo(() => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? today : d;
  }, [dateStr, today]);

  const bumpStats = React.useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <div className="space-y-6" dir={dir()}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/20 ring-1 ring-white/30">
          {/* Islamic geometric pattern overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.15]"
            aria-hidden="true"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='white' stroke-width='1'><polygon points='20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14'/></g></svg>\")",
              backgroundSize: "40px 40px",
              backgroundRepeat: "repeat",
            }}
          />
          <CalendarCheck className="relative size-6 drop-shadow-sm" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("attendance.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("attendance.subtitle")}</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="att-date" className="text-xs font-medium text-muted-foreground">
              {t("attendance.date")}
            </Label>
            <Input
              id="att-date"
              type="date"
              value={dateStr}
              max={toDateInputValue(today)}
              onChange={(e) => setDateStr(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("attendance.class")}
            </Label>
            <Select
              value={classId}
              onValueChange={setClassId}
              disabled={tab !== "student"}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("attendance.all")}</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("attendance.summary")}
            </Label>
            <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
              {new Intl.DateTimeFormat(locale, {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              }).format(selectedDate)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Person type tabs + marker */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList>
          <TabsTrigger value="student">
            <GraduationCap className="size-4" /> {t("attendance.students")}
          </TabsTrigger>
          <TabsTrigger value="teacher">
            <Users className="size-4" /> {t("attendance.teachers")}
          </TabsTrigger>
          <TabsTrigger value="qr">
            <QrCode className="size-4" /> {t("attendance.qrScan")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="student" className="mt-4">
          <AttendanceMarker
            date={selectedDate}
            personType="student"
            classId={classId === "all" ? "" : classId}
            onSaved={bumpStats}
            key={`student-${dateStr}-${classId}`}
          />
        </TabsContent>
        <TabsContent value="teacher" className="mt-4">
          <AttendanceMarker
            date={selectedDate}
            personType="teacher"
            classId=""
            onSaved={bumpStats}
            key={`teacher-${dateStr}`}
          />
        </TabsContent>
        <TabsContent value="qr" className="mt-4">
          <QrScanner />
        </TabsContent>
      </Tabs>

      {/* Stats */}
      <AttendanceStats refreshKey={refreshKey} />
    </div>
  );
}
