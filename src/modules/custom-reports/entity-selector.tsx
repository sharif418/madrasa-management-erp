// EntitySelector — 6 entity cards. Click to select.
"use client";
import { useApp } from "@/store/app-store";
import { Users, GraduationCap, Banknote, BookMarked, ClipboardList, Receipt, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EntityType } from "./types";

const ENTITIES: { key: EntityType; icon: typeof Users; color: string }[] = [
  { key: "students", icon: Users, color: "from-emerald-500 to-teal-500" },
  { key: "teachers", icon: GraduationCap, color: "from-violet-500 to-purple-500" },
  { key: "transactions", icon: Banknote, color: "from-amber-500 to-orange-500" },
  { key: "hifz", icon: BookMarked, color: "from-rose-500 to-pink-500" },
  { key: "attendance", icon: ClipboardList, color: "from-sky-500 to-cyan-500" },
  { key: "fees", icon: Receipt, color: "from-lime-500 to-green-500" },
];

type Props = {
  selected: EntityType | null;
  onSelect: (e: EntityType) => void;
};

export function EntitySelector({ selected, onSelect }: Props) {
  const { t } = useApp();
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {ENTITIES.map((e) => {
        const active = selected === e.key;
        return (
          <button
            key={e.key}
            type="button"
            onClick={() => onSelect(e.key)}
            className={cn(
              "group relative flex flex-col items-start gap-2 rounded-xl border p-4 text-start transition-all",
              active
                ? "border-violet-300 bg-violet-50 shadow-md dark:border-violet-800 dark:bg-violet-950/30"
                : "border-border/60 bg-background hover:border-violet-200 hover:bg-muted/30 dark:hover:border-violet-900",
            )}
          >
            <div className={cn("grid size-9 place-items-center rounded-lg bg-gradient-to-br text-white shadow-sm", e.color)}>
              <e.icon className="size-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">{t(`customreports.${e.key}`)}</p>
              <p className="text-[11px] leading-tight text-muted-foreground">{t(`customreports.${e.key}Desc`)}</p>
            </div>
            {active && (
              <div className="absolute end-2 top-2 grid size-5 place-items-center rounded-full bg-violet-600 text-white">
                <Check className="size-3" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
