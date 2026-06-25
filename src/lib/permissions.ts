// RBAC permission helper — checks user roles + permissions for module+action
import { db } from "@/lib/db";
import { cacheWrap } from "@/lib/cache";
import type { SessionUser } from "@/lib/session";

export const MODULES = {
  DASHBOARD: "dashboard",
  STUDENTS: "students",
  TEACHERS: "teachers",
  ACADEMIC: "academic",
  HIFZ: "hifz",
  FINANCE: "finance",
  WALLET: "wallet",
  ATTENDANCE: "attendance",
  EXAMS: "exams",
  NOTICES: "notices",
  SETTINGS: "settings",
  AUDIT: "audit",
  REPORTS: "reports",
  HOSTEL: "hostel",
  MUHASABA: "muhasaba",
  LIBRARY: "library",
  DONORS: "donors",
  CALENDAR: "calendar",
  TRANSPORT: "transport",
  HEALTH: "health",
  INVENTORY: "inventory",
  FEEDBACK: "feedback",
  ADMISSION: "admission",
  ALUMNI: "alumni",
  AI: "ai",
  TIMETABLE: "timetable",
} as const;

export const ACTIONS = {
  VIEW: "view",
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  EXPORT: "export",
} as const;

type ModuleKey = typeof MODULES[keyof typeof MODULES];
type ActionKey = typeof ACTIONS[keyof typeof ACTIONS];

/**
 * Check if a user has permission for a module+action.
 * Super Admin role always has full access.
 * Other roles use the permissions JSON: { "*": ["*"] } or { "students": ["view", "create"], ... }
 */
export async function checkPermission(
  session: SessionUser,
  module: ModuleKey | string,
  action: ActionKey | string
): Promise<boolean> {
  const cacheKey = `perm:${session.userId}:${module}:${action}`;
  return cacheWrap(cacheKey, 120 * 1000, async () => {
    // Fetch user roles with permissions
    const userRoles = await db.userRole.findMany({
      where: { userId: session.userId },
      include: { role: true },
    });

    // Super Admin always has full access
    if (userRoles.some((ur) => ur.role.name === "Super Admin")) {
      return true;
    }

    // Check each role's permissions
    for (const ur of userRoles) {
      let perms: Record<string, string[]>;
      try {
        perms = JSON.parse(ur.role.permissions || "{}");
      } catch {
        continue;
      }

      // Check wildcard module
      if (perms["*"] && (perms["*"].includes("*") || perms["*"].includes(action))) {
        return true;
      }

      // Check specific module
      const modulePerms = perms[module];
      if (modulePerms && (modulePerms.includes("*") || modulePerms.includes(action))) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Check if user is Super Admin
 */
export async function isSuperAdmin(session: SessionUser): Promise<boolean> {
  const userRoles = await db.userRole.findMany({
    where: { userId: session.userId },
    include: { role: true },
  });
  return userRoles.some((ur) => ur.role.name === "Super Admin");
}
