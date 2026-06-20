// FilterBuilder — add/remove filters. field + operator + value.
"use client";
import { useApp } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { EntityType, Filter } from "./types";
import { ENTITY_COLUMNS } from "./types";

type Props = {
  entity: EntityType | null;
  filters: Filter[];
  onChange: (f: Filter[]) => void;
};

const OPERATORS: { value: Filter["op"]; key: string }[] = [
  { value: "equals", key: "customreports.equals" },
  { value: "contains", key: "customreports.contains" },
  { value: "gt", key: "customreports.greaterThan" },
  { value: "lt", key: "customreports.lessThan" },
];

export function FilterBuilder({ entity, filters, onChange }: Props) {
  const { t } = useApp();
  if (!entity) return null;
  const cols = ENTITY_COLUMNS[entity];

  const add = () => onChange([...filters, { field: cols[0] ?? "", op: "equals", value: "" }]);
  const update = (i: number, patch: Partial<Filter>) =>
    onChange(filters.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  const remove = (i: number) => onChange(filters.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      {filters.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("customreports.applyFilters")}</p>
      ) : (
        <div className="space-y-2">
          {filters.map((f, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 rounded-lg border border-border/60 bg-muted/20 p-2 sm:grid-cols-[1fr_1fr_1.4fr_auto]">
              {/* Field */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">{t("customreports.field")}</Label>
                <Select value={f.field} onValueChange={(v) => update(i, { field: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {cols.map((c) => (
                      <SelectItem key={c} value={c} className="text-xs font-mono">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Operator */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">{t("customreports.operator")}</Label>
                <Select value={f.op} onValueChange={(v) => update(i, { op: v as Filter["op"] })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-xs">{t(o.key)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Value */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">{t("customreports.value")}</Label>
                <Input
                  className="h-8 text-xs"
                  value={f.value}
                  onChange={(e) => update(i, { value: e.target.value })}
                  placeholder="…"
                />
              </div>
              {/* Remove */}
              <div className="flex items-end">
                <Button
                  type="button" size="icon" variant="ghost"
                  className="size-8 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  onClick={() => remove(i)} aria-label={t("customreports.removeFilter")}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1.5">
        <Plus className="size-4" />
        {t("customreports.addFilter")}
      </Button>
    </div>
  );
}
