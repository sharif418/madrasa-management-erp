// ColumnSelector — checkbox list with select all / deselect all.
"use client";
import { useApp } from "@/store/app-store";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Inbox } from "lucide-react";
import type { EntityType } from "./types";
import { ENTITY_COLUMNS } from "./types";

type Props = {
  entity: EntityType | null;
  selected: string[];
  onChange: (cols: string[]) => void;
};

export function ColumnSelector({ entity, selected, onChange }: Props) {
  const { t } = useApp();
  if (!entity) return null;
  const cols = ENTITY_COLUMNS[entity];

  const toggle = (c: string) => {
    if (selected.includes(c)) onChange(selected.filter((x) => x !== c));
    else onChange([...selected, c]);
  };
  const all = () => onChange([...cols]);
  const none = () => onChange([]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selected.length}/{cols.length} {t("customreports.selectColumns")}
        </p>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={all} className="h-7 text-xs">
            {t("customreports.selectAll")}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={none} className="h-7 text-xs">
            {t("customreports.deselectAll")}
          </Button>
        </div>
      </div>
      <div className="rounded-lg border border-border/60 bg-muted/20">
        <ScrollArea className="h-56">
          <ul className="divide-y divide-border/40">
            {cols.map((c) => (
              <li key={c}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/40">
                  <Checkbox checked={selected.includes(c)} onCheckedChange={() => toggle(c)} />
                  <span className="text-sm font-mono">{c}</span>
                </label>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </div>
      {selected.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Inbox className="size-3.5" />
          <span>{t("customreports.selectColumnsFirst")}</span>
        </div>
      )}
    </div>
  );
}
