// GET /api/settings/features — list all feature toggles for current tenant
// PATCH /api/settings/features — update a toggle { module, enabled }
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { ok, fail, unauthorized, forbidden } from "@/lib/api";

const ALL_MODULES = [
  { module: "dashboard", core: true, category: "core" },
  { module: "students", core: true, category: "core" },
  { module: "settings", core: true, category: "core" },
  { module: "audit", core: true, category: "core" },
  { module: "teachers", core: false, category: "academic" },
  { module: "academic", core: false, category: "academic" },
  { module: "timetable", core: false, category: "academic" },
  { module: "hifz", core: false, category: "academic" },
  { module: "attendance", core: false, category: "academic" },
  { module: "exams", core: false, category: "academic" },
  { module: "muhasaba", core: false, category: "academic" },
  { module: "hostel", core: false, category: "residential" },
  { module: "mess", core: false, category: "residential" },
  { module: "transport", core: false, category: "residential" },
  { module: "health", core: false, category: "residential" },
  { module: "finance", core: false, category: "financial" },
  { module: "wallet", core: false, category: "financial" },
  { module: "fees", core: false, category: "financial" },
  { module: "donors", core: false, category: "financial" },
  { module: "notices", core: false, category: "communication" },
  { module: "calendar", core: false, category: "communication" },
  { module: "feedback", core: false, category: "communication" },
  { module: "admission", core: false, category: "system" },
  { module: "alumni", core: false, category: "system" },
  { module: "library", core: false, category: "system" },
  { module: "inventory", core: false, category: "system" },
  { module: "reports", core: false, category: "system" },
  { module: "ai", core: false, category: "system" },
];

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  // Fetch existing toggles
  const existing = await db.featureToggle.findMany({
    where: { tenantId: session.tenantId },
  });
  const existingMap = new Map(existing.map((t) => [t.module, t.enabled]));

  // Return all modules with their enabled status (default true for core, true for others if not set)
  const features = ALL_MODULES.map((m) => ({
    module: m.module,
    enabled: existingMap.get(m.module) ?? true,
    isCore: m.core,
    category: m.category,
  }));

  return ok({ features });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  // Check if user has Super Admin role (only super admin can change features)
  const userRoles = await db.userRole.findMany({
    where: { userId: session.userId },
    include: { role: true },
  });
  const isSuperAdmin = userRoles.some((ur) => ur.role.name === "Super Admin");
  if (!isSuperAdmin) return forbidden("Only Super Admin can manage module features");

  const { module, enabled } = await req.json();
  if (!module || typeof enabled !== "boolean") {
    return fail("Module and enabled (boolean) are required");
  }

  // Prevent disabling core modules
  const mod = ALL_MODULES.find((m) => m.module === module);
  if (!mod) return fail("Unknown module");
  if (mod.core && !enabled) {
    return fail("Core modules cannot be disabled");
  }

  // Upsert the toggle
  const toggle = await db.featureToggle.upsert({
    where: {
      tenantId_module: { tenantId: session.tenantId, module },
    },
    update: { enabled },
    create: { tenantId: session.tenantId, module, enabled },
  });

  await recordAudit({
    session,
    action: "update",
    module: "settings",
    entityName: `Feature: ${module}`,
    details: { module, enabled },
  });

  return ok(toggle);
}
