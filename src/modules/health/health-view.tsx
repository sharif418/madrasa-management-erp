// Health & Wellness view
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HeartPulse, Plus, Activity, Syringe, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/store/app-store";
import { toast } from "sonner";
import { ModuleHeader, KpiCard, EmptyState } from "@/components/ui-patterns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthRecordForm, VaccinationForm } from "./forms";
import type { HealthData, HealthRecord, Vaccination } from "./types";

const TYPE_TINT: Record<string, string> = {
  checkup: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  illness: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  allergy: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  injury: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  dental: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
  vision: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  vaccination: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
};

const SEVERITY_TINT: Record<string, string> = {
  mild: "bg-emerald-500",
  moderate: "bg-amber-500",
  severe: "bg-rose-500",
};

export function HealthView() {
  const { t, dir } = useApp();
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [recordForm, setRecordForm] = useState(false);
  const [vaccForm, setVaccForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/health", { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) setData(j.data as HealthData);
      else throw new Error(j?.error || "Failed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filteredRecords = useMemo(() => {
    if (!data) return [];
    if (typeFilter === "all") return data.records;
    return data.records.filter((r) => r.recordType === typeFilter);
  }, [data, typeFilter]);

  const kpis = data?.kpis;

  return (
    <div className="space-y-6" dir={dir()}>
      <ModuleHeader
        icon={<HeartPulse className="relative size-6 drop-shadow-sm" />}
        title={t("health.title")}
        subtitle={t("health.subtitle")}
        gradient="from-rose-500 to-pink-600"
        shadow="shadow-rose-600/20"
      >
        <Button
          onClick={() => setVaccForm(true)}
          variant="outline"
          className="border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-950 dark:text-rose-300"
        >
          <Syringe className="me-2 size-4" /> {t("health.addVaccination")}
        </Button>
        <Button
          onClick={() => setRecordForm(true)}
          className="bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-600/20 hover:from-rose-700 hover:to-pink-700"
        >
          <Plus className="me-2 size-4" /> {t("health.addRecord")}
        </Button>
      </ModuleHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label={t("health.kpi.records")} value={kpis?.totalRecords ?? 0} icon={<Activity className="size-5" />} gradient="from-rose-500 to-pink-600" />
        <KpiCard label={t("health.kpi.vaccinated")} value={`${kpis?.vaccinationRate ?? 0}%`} icon={<Syringe className="size-5" />} gradient="from-teal-500 to-emerald-600" />
        <KpiCard label={t("health.kpi.followups")} value={kpis?.followupsDue ?? 0} icon={<CalendarClock className="size-5" />} gradient="from-amber-500 to-orange-600" />
      </div>

      <Tabs defaultValue="records">
        <TabsList>
          <TabsTrigger value="records">{t("health.records")}</TabsTrigger>
          <TabsTrigger value="vaccinations">{t("health.vaccinations")}</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Filter by type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="checkup">Checkup</SelectItem>
              <SelectItem value="illness">Illness</SelectItem>
              <SelectItem value="allergy">Allergy</SelectItem>
              <SelectItem value="injury">Injury</SelectItem>
              <SelectItem value="dental">Dental</SelectItem>
              <SelectItem value="vision">Vision</SelectItem>
            </SelectContent>
          </Select>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
            </div>
          ) : filteredRecords.length === 0 ? (
            <EmptyState icon={<HeartPulse className="relative size-6" />} title={t("health.empty")} description={t("health.emptyDesc")} gradient="from-rose-500 to-pink-600" />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRecords.map((r) => <RecordCard key={r.id} r={r} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="vaccinations">
          {loading ? <Skeleton className="h-64 rounded-xl" /> : (
            data!.vaccinations.length === 0 ? (
              <EmptyState icon={<Syringe className="relative size-6" />} title={t("health.empty")} description={t("health.emptyDesc")} gradient="from-teal-500 to-emerald-600" />
            ) : (
              <VaccTable rows={data!.vaccinations} />
            )
          )}
        </TabsContent>
      </Tabs>

      <HealthRecordForm open={recordForm} onOpenChange={setRecordForm} onSaved={load} />
      <VaccinationForm open={vaccForm} onOpenChange={setVaccForm} onSaved={load} />
    </div>
  );
}

function RecordCard({ r }: { r: HealthRecord }) {
  const { t } = useApp();
  return (
    <Card className="overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="h-1.5 bg-gradient-to-r from-rose-500 to-pink-600" />
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold">{r.student.name}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(r.date).toLocaleDateString()} {r.student.rollNo ? `· ${r.student.rollNo}` : ""}
            </p>
          </div>
          <Badge className={TYPE_TINT[r.recordType] || TYPE_TINT.checkup} variant="secondary">{r.recordType}</Badge>
        </div>
        <p className="text-sm line-clamp-2">{r.description}</p>
        {r.diagnosis && (
          <p className="text-xs text-muted-foreground"><span className="font-medium">Diagnosis:</span> {r.diagnosis}</p>
        )}
        {r.treatment && (
          <p className="text-xs text-muted-foreground"><span className="font-medium">Treatment:</span> {r.treatment}</p>
        )}
        <div className="flex items-center justify-between border-t pt-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`inline-block size-2 rounded-full ${SEVERITY_TINT[r.severity] || SEVERITY_TINT.mild}`} />
            <span className="capitalize">{r.severity}</span>
            <span className="text-muted-foreground">·</span>
            <span className="capitalize">{r.status}</span>
          </div>
          {r.followUpDate && (
            <Badge variant="outline" className="text-amber-700 dark:text-amber-400">
              <CalendarClock className="me-1 size-3" />
              {new Date(r.followUpDate).toLocaleDateString()}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function VaccTable({ rows }: { rows: Vaccination[] }) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="max-h-[28rem] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
            <tr>
              <th className="px-4 py-3 text-start font-medium">Student</th>
              <th className="px-4 py-3 text-start font-medium">Vaccine</th>
              <th className="px-4 py-3 text-start font-medium">Dose</th>
              <th className="px-4 py-3 text-start font-medium">Date</th>
              <th className="px-4 py-3 text-start font-medium">Next Due</th>
              <th className="px-4 py-3 text-start font-medium">By</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id} className="border-t hover:bg-muted/40">
                <td className="px-4 py-3 font-medium">{v.student.name}</td>
                <td className="px-4 py-3">{v.vaccineName}</td>
                <td className="px-4 py-3">#{v.doseNumber}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(v.dateAdministered).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-muted-foreground">{v.nextDue ? new Date(v.nextDue).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{v.administeredBy || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
