// Shared types + helpers for the Waivers module.
import { Award, Users, Heart, GraduationCap, HandHeart, type LucideIcon } from "lucide-react";

export type WaiverType = "scholarship" | "sibling" | "orphan" | "staff_child" | "zakat_eligible";
export type DiscountType = "percentage" | "fixed";

export type WaiverItem = {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string | null;
  classId: string | null;
  className: string | null;
  type: WaiverType | string;
  discountType: DiscountType | string;
  percentage: number;
  fixedAmount: number;
  reason: string | null;
  validFrom: string;
  validUntil: string | null;
  expired: boolean;
  createdAt: string;
};

export type WaiversListResponse = {
  items: WaiverItem[];
  activeCount: number;
  byType: Record<string, { count: number; totalPct: number; totalFixed: number }>;
};

export type WaiverStats = {
  totalActive: number;
  totalAll: number;
  totalFixed: number;
  avgPct: number;
  uniqueStudents: number;
  byType: Record<string, { count: number; totalPct: number; totalFixed: number }>;
  byClass: Record<string, { count: number; totalPct: number; totalFixed: number }>;
  topStudents: Array<{
    id: string;
    studentId: string;
    studentName: string;
    className: string | null;
    type: string;
    discountType: string;
    percentage: number;
    fixedAmount: number;
  }>;
};

// Waiver type metadata: icon + label key + tone (Tailwind badge class)
export type WaiverTypeMeta = {
  icon: LucideIcon;
  labelKey: string;
  descKey: string;
  tone: string; // badge color
  tile: string; // gradient tile for charts
};

export const WAIVER_TYPES: Record<WaiverType, WaiverTypeMeta> = {
  scholarship: {
    icon: Award,
    labelKey: "waivers.scholarship",
    descKey: "waivers.scholarshipDesc",
    tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    tile: "from-emerald-500 to-teal-600",
  },
  sibling: {
    icon: Users,
    labelKey: "waivers.sibling",
    descKey: "waivers.siblingDesc",
    tone: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    tile: "from-sky-500 to-cyan-600",
  },
  orphan: {
    icon: Heart,
    labelKey: "waivers.orphan",
    descKey: "waivers.orphanDesc",
    tone: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    tile: "from-rose-500 to-pink-600",
  },
  staff_child: {
    icon: GraduationCap,
    labelKey: "waivers.staffChild",
    descKey: "waivers.staffChildDesc",
    tone: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    tile: "from-violet-500 to-purple-600",
  },
  zakat_eligible: {
    icon: HandHeart,
    labelKey: "waivers.zakatEligible",
    descKey: "waivers.zakatEligibleDesc",
    tone: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    tile: "from-amber-500 to-orange-600",
  },
};

export const WAIVER_TYPE_KEYS = Object.keys(WAIVER_TYPES) as WaiverType[];
