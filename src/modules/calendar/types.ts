"use client";
// Calendar module — shared types & UI helpers
import type { LucideIcon } from "lucide-react";
import {
  GraduationCap, PartyPopper, Moon, Users, UserPlus, Award, Calendar as CalIcon,
} from "lucide-react";

export type EventType =
  | "exam" | "holiday" | "islamic" | "meeting" | "admission" | "result" | "event";

export type CalEvent = {
  id: string;
  title: string;
  titleArabic: string | null;
  description: string | null;
  type: string;
  startDate: string;
  endDate: string | null;
  isAllDay: boolean;
  location: string | null;
  audience: string;
  isHighlighted: boolean;
  hijriDate?: string;
  hijriEnd?: string | null;
};

export const EVENT_TYPE_META: Record<string, {
  icon: LucideIcon;
  dot: string;
  tint: string;
  tile: string;
  border: string;
}> = {
  exam: {
    icon: GraduationCap,
    dot: "bg-rose-500",
    tint: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    tile: "bg-gradient-to-br from-rose-500 to-rose-700",
    border: "border-s-rose-500",
  },
  holiday: {
    icon: PartyPopper,
    dot: "bg-amber-500",
    tint: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    tile: "bg-gradient-to-br from-amber-500 to-orange-600",
    border: "border-s-amber-500",
  },
  islamic: {
    icon: Moon,
    dot: "bg-emerald-500",
    tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    tile: "bg-gradient-to-br from-emerald-500 to-teal-600",
    border: "border-s-emerald-500",
  },
  meeting: {
    icon: Users,
    dot: "bg-violet-500",
    tint: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    tile: "bg-gradient-to-br from-violet-500 to-purple-600",
    border: "border-s-violet-500",
  },
  admission: {
    icon: UserPlus,
    dot: "bg-cyan-500",
    tint: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
    tile: "bg-gradient-to-br from-cyan-500 to-sky-600",
    border: "border-s-cyan-500",
  },
  result: {
    icon: Award,
    dot: "bg-teal-500",
    tint: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
    tile: "bg-gradient-to-br from-teal-500 to-emerald-600",
    border: "border-s-teal-500",
  },
  event: {
    icon: CalIcon,
    dot: "bg-fuchsia-500",
    tint: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300",
    tile: "bg-gradient-to-br from-fuchsia-500 to-pink-600",
    border: "border-s-fuchsia-500",
  },
};

export const EVENT_TYPES: EventType[] = [
  "exam", "holiday", "islamic", "meeting", "admission", "result", "event",
];

export const AUDIENCES = ["all", "staff", "parents", "students"];

// Days-from-now helper for countdown badges
export function daysFromNow(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
