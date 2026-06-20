"use client";
// SurahTrackerTab — third tab in the Hifz module.
// Shows surah-level (114) memorization progress for a selected student:
//   - Overall progress card (circular X/114 + completion % + total ayahs)
//   - Status filter + grid/list toggle
//   - 114-cell grid (default) or table list view
//   - Click a surah → opens detail dialog with all HifzRecords for that surah
import * as React from "react";
import { LayoutGrid, List, BookOpenCheck, Sparkles, BookOpen } from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { StudentOption } from "./hifz-types";
import { fmtDate } from "./hifz-types";
import type { SurahProgressItem, SurahProgressResponse, SurahStatus } from "@/app/api/hifz/surah-progress/route";
import { SurahGrid, surahStatusDotClass, statusLabelKey } from "./surah-grid";
import { SurahDetailDialog } from "./surah-detail-dialog";

type Props = { students: StudentOption[] };

const STATUS_FILTERS: ({ value: "all" | SurahStatus; key: string })[] = [
  { value: "all", key: "common.all" },
  { value: "completed", key: "hifz.completed" },
  { value: "in_progress", key: "hifz.inProgress" },
  { value: "revision", key: "hifz.revision" },
  { value: "not_started", key: "hifz.notStarted" },
];

export function SurahTrackerTab({ students }: Props) {
  const { t, locale, dir } = useApp();
  const { toast } = useToast();
  const [studentId, setStudentId] = React.useState("");
  const [data, setData] = React.useState<SurahProgressResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [filter, setFilter] = React.useState<"all" | SurahStatus>("all");
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [selected, setSelected] = React.useState<SurahProgressItem | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Auto-pick first student
  React.useEffect(() => {
    if (!studentId && students.length > 0) setStudentId(students[0].id);
  }, [students, studentId]);

  React.useEffect(() => {
    if (!studentId) { setData(null); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/hifz/surah-progress?studentId=${encodeURIComponent(studentId)}`);
        const json = await res.json();
        if (cancelled) return;
        if (!json.ok) throw new Error(json.error);
        setData(json.data);
      } catch {
        if (!cancelled) {
          toast({ title: t("hifz.error"), variant: "destructive" });
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [studentId, t, toast]);

  const handleSelectSurah = (s: SurahProgressItem) => {
    setSelected(s);
    setDialogOpen(true);
  };

  const filtered = React.useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data.surahs;
    return data.surahs.filter((s) => s.status === filter);
  }, [data, filter]);

  return (
    <div className="space-y-4" dir={dir()}>
      {/* Student selector */}
      <Card className="py-4">
        <CardContent className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs text-muted-foreground">{t("hifz.selectStudent")}</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="w-full"><SelectValue placeholder={t("hifz.selectStudent")} /></SelectTrigger>
              <SelectContent className="max-h-72">
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}{s.rollNo ? ` · ${s.rollNo}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!studentId ? (
        <EmptyState label={t("hifz.selectStudentFirst")} />
      ) : loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : data ? (
        <>
          {/* Overall progress card */}
          <OverallProgressCard data={data} />

          {/* Toolbar: status filter + view toggle */}
          <Card className="py-3">
            <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <Label className="text-xs text-muted-foreground me-1">{t("hifz.status")}:</Label>
                {STATUS_FILTERS.map((f) => (
                  <Button
                    key={f.value}
                    size="sm"
                    variant={filter === f.value ? "default" : "outline"}
                    onClick={() => setFilter(f.value)}
                    className={cn(
                      "h-7 px-2.5 text-xs",
                      filter === f.value && "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white",
                    )}
                  >
                    {t(f.key)}
                    {f.value !== "all" && (
                      <span className="ms-1 rounded-full bg-black/10 px-1.5 text-[10px] tabular-nums">
                        {data.byStatus[f.value as SurahStatus]}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
              <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as "grid" | "list")} size="sm">
                <ToggleGroupItem value="grid" aria-label={t("hifz.gridView")}>
                  <LayoutGrid className="size-4" /> <span className="hidden sm:inline ms-1">{t("hifz.gridView")}</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label={t("hifz.listView")}>
                  <List className="size-4" /> <span className="hidden sm:inline ms-1">{t("hifz.listView")}</span>
                </ToggleGroupItem>
              </ToggleGroup>
            </CardContent>
          </Card>

          {/* Grid or list view */}
          <Card className="py-4">
            <CardContent>
              {filtered.length === 0 ? (
                <EmptyState label={t("hifz.noRecords")} />
              ) : view === "grid" ? (
                <SurahGrid surahs={filtered} onSelect={handleSelectSurah} />
              ) : (
                <SurahListView surahs={filtered} onSelect={handleSelectSurah} locale={locale} />
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      <SurahDetailDialog
        surah={selected}
        studentId={studentId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

// ---------- Overall progress card ----------
function OverallProgressCard({ data }: { data: SurahProgressResponse }) {
  const { t } = useApp();
  const pct = data.completionPercent;
  const r = 70;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <Card className="overflow-hidden border-emerald-600/20 bg-gradient-to-br from-emerald-50/80 to-teal-50/60 py-4 dark:from-emerald-950/30 dark:to-teal-950/20">
      <CardContent className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="relative mx-auto flex h-44 w-44 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 160 160" aria-hidden>
            <circle cx="80" cy="80" r={r} fill="none" className="stroke-muted" strokeWidth="10" />
            <circle cx="80" cy="80" r={r} fill="none" stroke="#0d9488" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.7s ease" }} />
          </svg>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{pct}%</div>
            <div className="mt-1 px-3 text-xs text-muted-foreground">{t("hifz.completionPercent")}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <BigStat icon={<BookOpenCheck className="size-5 text-emerald-600" />} value={`${data.totalSurahsMemorized}/114`} label={t("hifz.totalSurahs")} />
          <BigStat icon={<Sparkles className="size-5 text-amber-500" />} value={String(data.totalAyahsMemorized)} label={t("hifz.totalAyahs")} />
          <BigStat icon={<BookOpen className="size-5 text-sky-500" />} value={`${data.parasFullyCovered.length}/30`} label={t("hifz.parasCovered")} />
        </div>
      </CardContent>
    </Card>
  );
}

function BigStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card/60 p-3 backdrop-blur">
      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted/60">{icon}</div>
      <div>
        <p className="text-xl font-bold tabular-nums leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <Card className="py-12"><CardContent className="text-center text-muted-foreground">
      <BookOpenCheck className="mx-auto mb-3 size-10 opacity-40" />
      <p>{label}</p>
    </CardContent></Card>
  );
}

// ---------- List view ----------
function SurahListView({
  surahs, onSelect, locale,
}: { surahs: SurahProgressItem[]; onSelect: (s: SurahProgressItem) => void; locale: string }) {
  const { t } = useApp();
  return (
    <ScrollArea className="max-h-[28rem]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">{t("hifz.surahNumber")}</TableHead>
            <TableHead>{t("hifz.surahName")}</TableHead>
            <TableHead className="text-end">{t("hifz.ayahsMemorized")}</TableHead>
            <TableHead>{t("hifz.status")}</TableHead>
            <TableHead className="text-end">{t("hifz.lastPracticed")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {surahs.map((s) => (
            <TableRow
              key={s.surahNumber}
              onClick={() => onSelect(s)}
              className="cursor-pointer hover:bg-muted/50"
            >
              <TableCell className="font-mono text-xs">{s.surahNumber}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{s.surahName}</span>
                  <span dir="rtl" lang="ar" className="text-sm text-muted-foreground"
                    style={{ fontFamily: "'Scheherazade New', 'Amiri', serif" }}>
                    {s.surahNameArabic}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-end tabular-nums text-sm">
                {s.memorizedAyahs}/{s.totalAyahs}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="gap-1.5">
                  <span className={cn("inline-block h-2 w-2 rounded-full", surahStatusDotClass[s.status])} />
                  {t(statusLabelKey(s.status))}
                </Badge>
              </TableCell>
              <TableCell className="text-end text-xs text-muted-foreground">
                {s.lastPracticed ? fmtDate(s.lastPracticed, locale) : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}


