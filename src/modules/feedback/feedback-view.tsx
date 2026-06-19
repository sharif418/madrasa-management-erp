// Feedback & Complaints view
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MessageSquare, Plus, Star, CheckCircle2, Clock,
} from "lucide-react";
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
import { FeedbackForm, ReviewDialog } from "./forms";
import type { FeedbackData, Feedback } from "./types";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
} from "recharts";

const TYPE_TINT: Record<string, string> = {
  complaint: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  suggestion: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  appreciation: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  grievance: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

const STATUS_TINT: Record<string, string> = {
  open: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  in_review: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  closed: "bg-slate-100 text-slate-700 dark:bg-slate-950/40 dark:text-slate-300",
};

const TYPE_COLORS: Record<string, string> = {
  complaint: "#f43f5e",
  suggestion: "#f59e0b",
  appreciation: "#10b981",
  grievance: "#ef4444",
};

export function FeedbackView() {
  const { t, dir } = useApp();
  const [data, setData] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [review, setReview] = useState<Feedback | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/feedback", { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) setData(j.data as FeedbackData);
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
    return data.items.filter((f) =>
      (typeFilter === "all" || f.type === typeFilter) &&
      (statusFilter === "all" || f.status === statusFilter)
    );
  }, [data, typeFilter, statusFilter]);

  const analytics = useMemo(() => {
    if (!data) return { typePie: [], catBar: [] };
    const typeMap: Record<string, number> = {};
    const catMap: Record<string, number> = {};
    for (const f of data.items) {
      typeMap[f.type] = (typeMap[f.type] || 0) + 1;
      catMap[f.category] = (catMap[f.category] || 0) + 1;
    }
    return {
      typePie: Object.entries(typeMap).map(([name, value]) => ({ name, value })),
      catBar: Object.entries(catMap).map(([name, value]) => ({ name, value })),
    };
  }, [data]);

  const kpis = data?.kpis;

  return (
    <div className="space-y-6" dir={dir()}>
      <ModuleHeader
        icon={<MessageSquare className="relative size-6 drop-shadow-sm" />}
        title={t("feedback.title")}
        subtitle={t("feedback.subtitle")}
        gradient="from-amber-500 to-orange-600"
        shadow="shadow-amber-600/20"
      >
        <Button
          onClick={() => setFormOpen(true)}
          className="bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/20 hover:from-amber-700 hover:to-orange-700"
        >
          <Plus className="me-2 size-4" /> {t("feedback.new")}
        </Button>
      </ModuleHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label={t("feedback.kpi.open")} value={kpis?.open ?? 0} icon={<Clock className="size-5" />} gradient="from-blue-500 to-cyan-600" />
        <KpiCard label={t("feedback.kpi.resolved")} value={kpis?.resolved ?? 0} icon={<CheckCircle2 className="size-5" />} gradient="from-emerald-500 to-teal-600" />
        <KpiCard label={t("feedback.kpi.rating")} value={`${kpis?.avgRating ?? 0} ★`} icon={<Star className="size-5" />} gradient="from-amber-500 to-orange-600" />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">{t("feedback.all")}</TabsTrigger>
          <TabsTrigger value="analytics">{t("feedback.analytics")}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="complaint">Complaint</SelectItem>
                <SelectItem value="suggestion">Suggestion</SelectItem>
                <SelectItem value="appreciation">Appreciation</SelectItem>
                <SelectItem value="grievance">Grievance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<MessageSquare className="relative size-6" />} title={t("feedback.empty")} description={t("feedback.emptyDesc")} gradient="from-amber-500 to-orange-600" />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filtered.map((f) => (
                <Card key={f.id} className="overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
                  <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-600" />
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold tracking-tight">{f.subject}</p>
                      <Badge className={TYPE_TINT[f.type] || TYPE_TINT.complaint} variant="secondary">{f.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{f.description}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="capitalize">{f.category}</Badge>
                      <Badge className={STATUS_TINT[f.status] || STATUS_TINT.open} variant="secondary">{f.status.replace("_", " ")}</Badge>
                      <Badge variant="outline" className="capitalize">{f.priority}</Badge>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
                      <span>By {f.submittedBy} ({f.submitterRole})</span>
                      <span>{new Date(f.submittedAt).toLocaleDateString()}</span>
                    </div>
                    {f.rating && (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`size-3.5 ${i < f.rating! ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                    )}
                    <Button size="sm" variant="outline" className="w-full" onClick={() => setReview(f)}>
                      {t("feedback.review")}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-4 font-semibold">By Type</h3>
                {analytics.typePie.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={analytics.typePie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                          {analytics.typePie.map((e) => (
                            <Cell key={e.name} fill={TYPE_COLORS[e.name] || "#94a3b8"} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-4 font-semibold">By Category</h3>
                {analytics.catBar.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.catBar}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <FeedbackForm open={formOpen} onOpenChange={setFormOpen} onSaved={load} />
      <ReviewDialog feedback={review} onClose={() => setReview(null)} onSaved={load} />
    </div>
  );
}
