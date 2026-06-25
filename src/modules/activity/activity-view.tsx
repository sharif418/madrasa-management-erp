"use client";
// Activity Feed — System-wide event timeline
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Activity, RefreshCw, Info, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useApp } from "@/store/app-store";

type LogEntry = {
  id: string; module: string; action: string; entityType: string;
  description: string; performedBy: string; severity: string;
  createdAt: string;
};

const SEVERITY_ICONS: Record<string, React.ReactNode> = {
  info: <Info className="size-3.5 text-blue-500" />,
  warning: <AlertTriangle className="size-3.5 text-amber-500" />,
  success: <CheckCircle2 className="size-3.5 text-emerald-500" />,
  error: <XCircle className="size-3.5 text-red-500" />,
};

const SEVERITY_COLORS: Record<string, string> = {
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export function ActivityView() {
  const { t } = useApp();
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [module, setModule] = React.useState<string>("all");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = module !== "all" ? `?module=${module}` : "";
      const r = await fetch(`/api/activity${params}`);
      const j = await r.json();
      if (j?.ok) setLogs(j.data.logs || []);
    } catch { /* */ } finally { setLoading(false); }
  }, [module]);

  React.useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Activity className="size-5 text-emerald-600" /> অ্যাক্টিভিটি ফিড
        </h2>
        <div className="flex items-center gap-2">
          <Select value={module} onValueChange={setModule}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব মডিউল</SelectItem>
              <SelectItem value="students">ছাত্র</SelectItem>
              <SelectItem value="finance">ফাইন্যান্স</SelectItem>
              <SelectItem value="attendance">উপস্থিতি</SelectItem>
              <SelectItem value="hifz">হিফজ</SelectItem>
              <SelectItem value="auth">অথেন্টিকেশন</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="size-3" /></Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
      ) : logs.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">কোনো অ্যাক্টিভিটি পাওয়া যায়নি</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="flex items-start gap-3 p-3">
                <div className="mt-0.5">{SEVERITY_ICONS[log.severity] || SEVERITY_ICONS.info}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{log.description}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{log.module}</Badge>
                    <Badge className={`text-[10px] ${SEVERITY_COLORS[log.severity] || ""}`}>{log.action}</Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString("bn-BD")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
