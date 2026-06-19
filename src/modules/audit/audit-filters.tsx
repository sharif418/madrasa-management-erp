"use client";
// Audit filters — action, module, date range. Triggers onChange on each change.
import { useApp } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import { AUDIT_ACTIONS, type AuditFilters } from "./audit-types";

type Props = {
  filters: AuditFilters;
  onChange: (f: AuditFilters) => void;
  modules: string[];
};

export function AuditFiltersBar({ filters, onChange, modules }: Props) {
  const { t, dir } = useApp();
  const set = (patch: Partial<AuditFilters>) => onChange({ ...filters, ...patch });
  const hasAny =
    filters.action || filters.module || filters.from || filters.to;

  return (
    <Card className="border border-border/60 shadow-sm">
      <CardContent className="p-4" dir={dir()}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm">
              <Filter className="h-3.5 w-3.5" />
            </span>
            {t("audit.filters")}
          </div>
          {hasAny && (
            <button
              type="button"
              onClick={() => onChange({ action: "", module: "", actorId: "", from: "", to: "" })}
              className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
              {t("common.cancel")}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t("audit.action")}</Label>
            <Select
              value={filters.action || "all"}
              onValueChange={(v) => set({ action: v === "all" ? "" : v })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("audit.allActions")}</SelectItem>
                {AUDIT_ACTIONS.map((a) => (
                  <SelectItem key={a} value={a}>{t(`audit.${a}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t("audit.module")}</Label>
            <Select
              value={filters.module || "all"}
              onValueChange={(v) => set({ module: v === "all" ? "" : v })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("audit.allModules")}</SelectItem>
                {modules.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t("audit.from")}</Label>
            <Input
              type="date"
              value={filters.from}
              onChange={(e) => set({ from: e.target.value })}
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t("audit.to")}</Label>
            <Input
              type="date"
              value={filters.to}
              onChange={(e) => set({ to: e.target.value })}
              className="h-9"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
