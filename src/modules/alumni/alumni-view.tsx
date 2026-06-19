// Alumni view
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GraduationCap, Plus, Search, MapPin, Briefcase, Award, Linkedin, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/store/app-store";
import { toast } from "sonner";
import { ModuleHeader, KpiCard, EmptyState } from "@/components/ui-patterns";
import { Card, CardContent } from "@/components/ui/card";
import { AlumniForm } from "./forms";
import type { AlumniData, Alumni } from "./types";

export function AlumniView() {
  const { t, dir } = useApp();
  const [data, setData] = useState<AlumniData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (year) params.set("year", year);
      const r = await fetch(`/api/alumni?${params.toString()}`, { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) setData(j.data as AlumniData);
      else throw new Error(j?.error || "Failed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [search, year]);

  useEffect(() => {
    const id = setTimeout(() => void load(), 350);
    return () => clearTimeout(id);
  }, [load]);

  const remove = async (a: Alumni) => {
    if (!confirm(`Remove ${a.name} from alumni?`)) return;
    try {
      const r = await fetch(`/api/alumni/${a.id}`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || "Failed");
      toast.success("Alumni removed");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const kpis = data?.kpis;

  return (
    <div className="space-y-6" dir={dir()}>
      <ModuleHeader
        icon={<GraduationCap className="relative size-6 drop-shadow-sm" />}
        title={t("alumni.title")}
        subtitle={t("alumni.subtitle")}
        gradient="from-violet-500 to-purple-600"
        shadow="shadow-violet-600/20"
      >
        <Button
          onClick={() => setFormOpen(true)}
          className="bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-600/20 hover:from-violet-700 hover:to-purple-700"
        >
          <Plus className="me-2 size-4" /> {t("alumni.add")}
        </Button>
      </ModuleHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label={t("alumni.kpi.total")} value={kpis?.total ?? 0} icon={<GraduationCap className="size-5" />} gradient="from-violet-500 to-purple-600" />
        <KpiCard label={t("alumni.kpi.mentors")} value={kpis?.mentors ?? 0} icon={<Award className="size-5" />} gradient="from-amber-500 to-orange-600" />
        <KpiCard label={t("alumni.kpi.countries")} value={kpis?.countries ?? 0} icon={<MapPin className="size-5" />} gradient="from-teal-500 to-emerald-600" />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("common.search")}
            className="ps-9"
          />
        </div>
        <Input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="Graduation year"
          className="sm:w-44"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="relative size-6" />}
          title={t("alumni.empty")}
          description={t("alumni.emptyDesc")}
          gradient="from-violet-500 to-purple-600"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((a) => (
            <Card key={a.id} className="overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="h-1.5 bg-gradient-to-r from-violet-500 to-purple-600" />
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold tracking-tight">{a.name}</p>
                      {a.isMentor && (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" variant="secondary">
                          <Award className="me-1 size-3" />
                          {t("alumni.mentor")}
                        </Badge>
                      )}
                    </div>
                    {a.nameArabic && (
                      <p className="text-sm text-muted-foreground" dir="rtl">{a.nameArabic}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Class of {a.graduationYear}
                      {a.rollNumber ? ` · ${a.rollNumber}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(a)}
                    className="grid size-8 flex-shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                    aria-label="Remove"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                {a.currentOccupation && (
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="size-4 text-violet-600" />
                    <span className="truncate">{a.currentOccupation}</span>
                  </div>
                )}
                {a.organization && (
                  <p className="text-xs text-muted-foreground truncate">at {a.organization}</p>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" />
                  <span className="truncate">
                    {[a.currentCity, a.currentCountry].filter(Boolean).join(", ") || "—"}
                  </span>
                </div>

                {a.achievements && (
                  <p className="text-xs text-muted-foreground line-clamp-2 italic">&ldquo;{a.achievements}&rdquo;</p>
                )}

                <div className="flex items-center gap-2 border-t pt-2 text-xs">
                  {a.phone && <span dir="ltr" className="text-muted-foreground">{a.phone}</span>}
                  {a.linkedin && (
                    <a href={a.linkedin} target="_blank" rel="noopener noreferrer" className="ms-auto text-violet-600 hover:underline">
                      <Linkedin className="size-4" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlumniForm open={formOpen} onOpenChange={setFormOpen} onSaved={load} />
    </div>
  );
}
