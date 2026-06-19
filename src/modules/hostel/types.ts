// Shared types for Hostel module
export type HostelStudent = { id: string; name: string; rollNo: string | null };

export type Bed = {
  id: string;
  bedNumber: string;
  status: string; // vacant | occupied | maintenance
  allocations: {
    id: string;
    studentId: string;
    student: HostelStudent;
  }[];
};

export type Room = {
  id: string;
  roomNumber: string;
  capacity: number;
  needsRepair: boolean;
  beds: Bed[];
};

export type Floor = {
  id: string;
  level: number;
  rooms: Room[];
};

export type Block = {
  id: string;
  name: string;
  floors: Floor[];
};

export type Hostel = {
  id: string;
  tenantId: string;
  name: string;
  wardenTeacherId: string | null;
  createdAt: string;
  blocks: Block[];
};

export type MessMenu = {
  id: string;
  date: string;
  mealType: string; // breakfast | lunch | dinner | snacks
  items: string;
  headcount: number;
};

export type GatePass = {
  id: string;
  studentId: string;
  reason: string;
  outTime: string;
  inTime: string | null;
  status: string;
  guardianNotified: boolean;
  createdAt: string;
  student: HostelStudent;
};

export type Visitor = {
  id: string;
  name: string;
  phone: string | null;
  purpose: string;
  visitingStudentId: string | null;
  checkIn: string;
  checkOut: string | null;
  createdAt: string;
};

export type HostelData = {
  hostels: Hostel[];
  messMenus: MessMenu[];
  gatePasses: GatePass[];
  visitors: Visitor[];
};

// Helpers
export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snacks"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export function bedTint(status: string): string {
  switch (status) {
    case "occupied":
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    case "maintenance":
      return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
    default:
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
  }
}

export function computeHostelStats(hostel: Hostel) {
  let total = 0, occupied = 0, vacant = 0, maintenance = 0;
  for (const b of hostel.blocks) {
    for (const f of b.floors) {
      for (const r of f.rooms) {
        for (const bed of r.beds) {
          total += 1;
          if (bed.status === "occupied") occupied += 1;
          else if (bed.status === "maintenance") maintenance += 1;
          else vacant += 1;
        }
      }
    }
  }
  return { total, occupied, vacant, maintenance, pct: total > 0 ? Math.round((occupied / total) * 100) : 0 };
}

export function fmtDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return iso.slice(0, 10);
  }
}

export function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso.slice(0, 16);
  }
}
