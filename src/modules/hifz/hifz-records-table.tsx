"use client";
// HifzRecordsTable — list with filters + delete action
import * as React from "react";
import { Star, Trash2, Search, BookOpen, Plus, Loader2 } from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogFooter, AlertDialogTitle, AlertDialogDescription,
  AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  HIFZ_TYPES, type HifzRecord, type HifzListResponse, type StudentOption,
  typeAccent, typeLabelKey, statusLabelKey, statusBadgeClass, fmtDate,
} from "./hifz-types";

type Props = {
  students: StudentOption[];
  onAddClick: () => void;
  refreshKey: number;
};

export function HifzRecordsTable({ students, onAddClick, refreshKey }: Props) {
  const { t, locale, dir } = useApp();
  const { toast } = useToast();

  const [studentId, setStudentId] = React.useState("all");
  const [type, setType] = React.useState("all");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [page, setPage] = React.useState(1);
  const limit = 10;

  const [data, setData] = React.useState<HifzListResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const qs = React.useMemo(() => {
    const p = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (studentId !== "all") p.set("studentId", studentId);
    if (type !== "all") p.set("type", type);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    return p.toString();
  }, [studentId, type, from, to, page]);

  // Reset to page 1 when filters change
  React.useEffect(() => { setPage(1); }, [studentId, type, from, to]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hifz?${qs}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setData(json.data);
    } catch {
      toast({ title: t("hifz.error"), variant: "destructive" });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [qs, t, toast]);

  React.useEffect(() => { load(); }, [load, refreshKey]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/hifz/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast({ title: t("hifz.deleteSuccess") });
      load();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Error", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4" dir={dir()}>
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-xl border bg-card">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t("hifz.student")}</Label>
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">{t("hifz.allStudents")}</SelectItem>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t("hifz.type")}</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("hifz.allTypes")}</SelectItem>
              {HIFZ_TYPES.map((ty) => (
                <SelectItem key={ty} value={ty}>{t(typeLabelKey(ty))}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t("hifz.fromDate")}</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t("hifz.toDate")}</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button
            onClick={onAddClick}
            className="w-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm shadow-emerald-900/20 transition-all hover:from-emerald-600 hover:to-emerald-800 hover:shadow-md hover:-translate-y-0.5"
          >
            <Plus className="size-4" /> {t("hifz.add")}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="text-start">{t("hifz.student")}</TableHead>
              <TableHead className="text-start">{t("hifz.type")}</TableHead>
              <TableHead className="text-start">{t("hifz.para")}</TableHead>
              <TableHead className="text-start">{t("hifz.surahAyah")}</TableHead>
              <TableHead className="text-start">{t("hifz.quality")}</TableHead>
              <TableHead className="text-start">{t("hifz.mistakes")}</TableHead>
              <TableHead className="text-start">{t("hifz.status")}</TableHead>
              <TableHead className="text-start">{t("hifz.date")}</TableHead>
              <TableHead className="text-end">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                  <BookOpen className="size-10 mx-auto mb-3 opacity-40" />
                  <p>{t("hifz.noRecords")}</p>
                </TableCell>
              </TableRow>
            ) : (
              items.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{r.studentName}</span>
                      {r.rollNo && <span className="text-xs text-muted-foreground">{r.rollNo}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ background: typeAccent[r.type] }} />
                      {t(typeLabelKey(r.type))}
                    </span>
                  </TableCell>
                  <TableCell><Badge variant="outline">{r.paraNumber}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.surahName ? (
                      <span>
                        {r.surahName}
                        {r.ayahFrom ? ` · ${r.ayahFrom}${r.ayahTo ? `–${r.ayahTo}` : ""}` : ""}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <QualityStars value={r.qualityRating} />
                  </TableCell>
                  <TableCell className="text-sm">{r.mistakesCount}</TableCell>
                  <TableCell>
                    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", statusBadgeClass[r.status])}>
                      {t(statusLabelKey(r.status))}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {fmtDate(r.recordedAt, locale)}
                  </TableCell>
                  <TableCell className="text-end">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("hifz.deleteConfirmTitle")}</AlertDialogTitle>
                          <AlertDialogDescription>{t("hifz.deleteConfirm")}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(r.id)}
                            disabled={deletingId === r.id}
                            className="bg-destructive text-white hover:bg-destructive/90"
                          >
                            {deletingId === r.id ? <Loader2 className="size-4 animate-spin" /> : t("common.delete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && items.length > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">
            {data ? `${(data.page - 1) * data.limit + 1}–${Math.min(data.page * data.limit, data.total)} / ${data.total}` : ""}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
              {t("common.previous")}
            </Button>
            <span className="text-sm self-center px-2">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
              {t("common.next")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function QualityStars({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground text-sm">—</span>;
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "size-3.5 transition-colors",
            n <= value
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted-foreground/40"
          )}
        />
      ))}
    </div>
  );
}
