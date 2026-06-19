"use client";
// Shared KPI card + chart card components used across all Reports tabs.
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label, value, sub, icon: Icon, tint,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  tint: string;
}) {
  return (
    <Card className="overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
          {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
        </div>
        <div className={`grid size-10 place-items-center rounded-xl ${tint}`}>
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}

export function ChartCard({
  title, children, className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-64 w-full">{children}</div>
      </CardContent>
    </Card>
  );
}

export function EmptyChart({ message }: { message: string }) {
  return (
    <div className="grid h-full place-items-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
