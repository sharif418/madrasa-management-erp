// Admission Portal view
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { UserPlus, FileText, Clock, CheckCircle2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/store/app-store";
import { toast } from "sonner";
import { ModuleHeader, KpiCard, EmptyState } from "@/components/ui-patterns";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewDialog } from "./review-dialog";
import type { AdmissionData, Application } from "./types";
import { STATUS_TINT, STATUS_FLOW } from "./types";

export function AdmissionView() {
  const { t, dir } = useApp();
  const [data, setData] = useState<AdmissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [review, setReview] = useState<Application | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admission", { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) setData(j.data as AdmissionData);
      else throw new Error(j?.error || "Failed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (statusFilter === "all") return data.items;
    return data.items.filter((a) => a.status === statusFilter);
  }, [data, statusFilter]);

  const kpis = data?.kpis;

  return (
    <div className="space-y-6" dir={dir()}>
      <ModuleHeader
        icon={<UserPlus className="relative size-6 drop-shadow-sm" />}
        title={t("admission.title")}
        subtitle={t("admission.subtitle")}
        gradient="from-emerald-500 to-teal-600"
        shadow="shadow-emerald-600/20"
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label={t("admission.kpi.total")} value={kpis?.total ?? 0} icon={<FileText className="size-5" />} gradient="from-slate-500 to-slate-700" />
        <KpiCard label={t("admission.kpi.pending")} value={kpis?.pending ?? 0} icon={<Clock className="size-5" />} gradient="from-amber-500 to-orange-600" />
        <KpiCard label={t("admission.kpi.approved")} value={kpis?.approved ?? 0} icon={<CheckCircle2 className="size-5" />} gradient="from-emerald-500 to-teal-600" />
        <KpiCard label={t("admission.kpi.enrolled")} value={kpis?.enrolled ?? 0} icon={<UserCheck className="size-5" />} gradient="from-teal-500 to-cyan-600" />
      </div>

      <div className="flex justify-end">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_FLOW.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<UserPlus className="relative size-6" />}
          title={t("admission.empty")}
          description={t("admission.emptyDesc")}
          gradient="from-emerald-500 to-teal-600"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <Card key={a.id} className="overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600" />
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold tracking-tight">{a.applicantName}</p>
                    {a.applicantNameArabic && (
                      <p className="text-sm text-muted-foreground" dir="rtl">{a.applicantNameArabic}</p>
                    )}
                  </div>
                  <Badge className={STATUS_TINT[a.status] || STATUS_TINT.pending} variant="secondary" style={{ textTransform: "capitalize" }}>
                    {a.status}
                  </Badge>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between"><span>Father</span><span className="font-medium text-foreground">{a.fatherName}</span></div>
                  <div className="flex justify-between"><span>Phone</span><span className="font-medium text-foreground" dir="ltr">{a.guardianPhone}</span></div>
                  {a.appliedLevel && <div className="flex justify-between"><span>Level</span><span className="font-medium text-foreground">{a.appliedLevel}</span></div>}
                  {a.appliedClass && <div className="flex justify-between"><span>Class</span><span className="font-medium text-foreground">{a.appliedClass}</span></div>}
                </div>

                {/* Status pipeline */}
                <div className="flex items-center gap-1 border-t pt-2">
                  {STATUS_FLOW.map((s, i) => {
                    const activeIndex = STATUS_FLOW.indexOf(a.status as typeof STATUS_FLOW[number]);
                    const reached = i <= activeIndex;
                    const isRejected = a.status === "rejected" && s === "rejected";
                    return (
                      <div
                        key={s}
                        title={s}
                        className={`h-1.5 flex-1 rounded-full ${
                          isRejected ? "bg-rose-500" :
                          reached ? "bg-gradient-to-r from-emerald-500 to-teal-600" : "bg-muted"
                        }`}
                      />
                    );
                  })}
                </div>

                <Button size="sm" variant="outline" className="w-full" onClick={() => setReview(a)}>
                  {t("admission.review")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ReviewDialog application={review} onClose={() => setReview(null)} onSaved={load} />
    </div>
  );
}
