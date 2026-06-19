"use client";
// Shared status option config + StatusButton used by AttendanceMarker.
import * as React from "react";
import { Check, X, Clock, CalendarOff } from "lucide-react";
import { cn } from "@/lib/utils";

export type Status = "present" | "absent" | "late" | "leave";

export const STATUS_OPTIONS: {
  value: Status;
  icon: React.ReactNode;
  activeCls: string;
  idleCls: string;
  dot: string;
}[] = [
  {
    value: "present",
    icon: <Check className="size-3.5" />,
    activeCls: "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/30",
    idleCls: "text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40",
    dot: "bg-emerald-500",
  },
  {
    value: "absent",
    icon: <X className="size-3.5" />,
    activeCls: "bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/30",
    idleCls: "text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40",
    dot: "bg-rose-500",
  },
  {
    value: "late",
    icon: <Clock className="size-3.5" />,
    activeCls: "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/30",
    idleCls: "text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/40",
    dot: "bg-amber-500",
  },
  {
    value: "leave",
    icon: <CalendarOff className="size-3.5" />,
    activeCls: "bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-600/30",
    idleCls: "text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-950/40",
    dot: "bg-sky-500",
  },
];

export function StatusButton({
  value, active, label, icon, activeCls, idleCls, onClick,
}: {
  value: Status;
  active: boolean;
  label: string;
  icon: React.ReactNode;
  activeCls: string;
  idleCls: string;
  onClick: (v: Status) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={() => onClick(value)}
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium transition-all",
        active ? cn(activeCls, "scale-105") : cn("border-transparent bg-muted/60", idleCls)
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
