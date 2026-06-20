// ID Cards module — generate printable ID cards for students and teachers.
// Tabs: Students / Teachers. Each tab: filter, search, grid of preview cards,
// bulk select, and "Generate Selected PDF" / "Generate All" actions.
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { IdCard, Loader2, Search, FileDown, Users, GraduationCap, CheckSquare } from "lucide-react";
import { useApp } from "@/store/app-store";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { IdCardPreview, type IdCardPerson, type IdCardTenant } from "./idcard-preview";

type ClassItem = { id: string; name: string };
type ApiResponse = {
  tenant: IdCardTenant | null;
  students: IdCardPerson[];
  teachers: IdCardPerson[];
  classes: ClassItem[];
};

export function IdCardsView() {
  const { t, dir } = useApp();
  const isRtl = dir() === "rtl";
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"students" | "teachers">("students");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/idcards", { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) setData(j.data as ApiResponse);
      else throw new Error(j?.error || "Failed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filteredStudents = useMemo(() => {
    if (!data) return [];
    const s = search.trim().toLowerCase();
    return data.students.filter((p) => {
      if (classFilter !== "all" && p.classId !== classFilter) return false;
      if (!s) return true;
      return (
        p.name.toLowerCase().includes(s) ||
        (p.nameArabic || "").toLowerCase().includes(s) ||
        (p.rollNo || "").toLowerCase().includes(s)
      );
    });
  }, [data, search, classFilter]);

  const filteredTeachers = useMemo(() => {
    if (!data) return [];
    const s = search.trim().toLowerCase();
    if (!s) return data.teachers;
    return data.teachers.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        (p.nameArabic || "").toLowerCase().includes(s) ||
        (p.designation || "").toLowerCase().includes(s),
    );
  }, [data, search]);

  const visible = tab === "students" ? filteredStudents : filteredTeachers;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const selectAllVisible = () => {
    setSelected(new Set(visible.map((p) => p.id)));
  };

  const generatePdf = async (type: "student" | "teacher", ids: string[]) => {
    if (ids.length === 0) {
      toast.error(t("idcards.selectAtLeastOne"));
      return;
    }
    setGenerating(true);
    const tid = toast.loading(t("idcards.generating"));
    try {
      const r = await fetch("/api/idcards/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ids }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => null);
        throw new Error(j?.error || `Failed (${r.status})`);
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      toast.success(t("idcards.generated"), { id: tid });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed", { id: tid });
    } finally {
      setGenerating(false);
    }
  };

  const selectedCount = selected.size;

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header — emerald→teal gradient tile with Islamic 8-point star pattern */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/20 ring-1 ring-white/30">
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
            <IdCard className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("idcards.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("idcards.subtitle")}</p>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v as typeof tab); clearSelection(); setClassFilter("all"); }}>
        <TabsList>
          <TabsTrigger value="students" className="gap-1.5">
            <Users className="size-4" /> {t("idcards.students")}
            {data && <span className="text-xs text-muted-foreground">({data.students.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="teachers" className="gap-1.5">
            <GraduationCap className="size-4" /> {t("idcards.teachers")}
            {data && <span className="text-xs text-muted-foreground">({data.teachers.length})</span>}
          </TabsTrigger>
        </TabsList>

        {/* Filters + actions bar — shared */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none start-2.5" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("idcards.search")}
                className="ps-8"
              />
            </div>
            {tab === "students" && data && (
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("idcards.filterClass")}</SelectItem>
                  {data.classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedCount > 0 && (
              <span className="text-xs font-medium text-emerald-700">
                {t("idcards.selected", { count: selectedCount })}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllVisible}
              disabled={loading || visible.length === 0}
              className="gap-1.5"
            >
              <CheckSquare className="size-4" /> {t("common.all")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generatePdf(tab === "students" ? "student" : "teacher", visible.map((p) => p.id))}
              disabled={loading || generating || visible.length === 0}
              className="gap-1.5"
            >
              {generating ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
              {t("idcards.generateAll")}
            </Button>
            <Button
              size="sm"
              onClick={() => generatePdf(tab === "students" ? "student" : "teacher", [...selected])}
              disabled={loading || generating || selectedCount === 0}
              className="gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
            >
              {generating ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
              {t("idcards.generateSelected")}
            </Button>
          </div>
        </div>

        <TabsContent value="students">
          {renderGrid(loading, filteredStudents, data?.tenant || null, "student", selected, toggle, t)}
        </TabsContent>
        <TabsContent value="teachers">
          {renderGrid(loading, filteredTeachers, data?.tenant || null, "teacher", selected, toggle, t)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function renderGrid(
  loading: boolean,
  people: IdCardPerson[],
  tenant: IdCardTenant | null,
  type: "student" | "teacher",
  selected: Set<string>,
  onToggle: (id: string) => void,
  t: (k: string) => string,
) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (people.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <IdCard className="size-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">{t("idcards.empty")}</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-h-[calc(100vh-22rem)] overflow-y-auto pe-1 pb-2">
      {people.map((p) => (
        <IdCardPreview
          key={p.id}
          person={p}
          tenant={tenant}
          type={type}
          selected={selected.has(p.id)}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}
