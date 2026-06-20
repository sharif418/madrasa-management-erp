// POST /api/backup/import — accept JSON backup file, validate + simulate import.
// For demo safety: does NOT actually write records. Returns counts that
// *would* be created. RBAC: settings:update.
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { forbidden, unauthorized, fail } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  const allowed = await checkPermission(session, "settings", "update");
  if (!allowed) return forbidden("No permission to import backup");

  let fileText: string;
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("No backup file uploaded");
    if (file.size > 25 * 1024 * 1024) return fail("Backup file too large (max 25MB)");
    fileText = await file.text();
  } catch {
    return fail("Failed to read uploaded file");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(fileText);
  } catch {
    return fail("Invalid JSON file");
  }

  if (!parsed || typeof parsed !== "object") return fail("Invalid backup format");
  const obj = parsed as Record<string, unknown>;
  if (obj.version !== 1 || !obj.data || typeof obj.data !== "object") {
    return fail("Not a valid Madrasa Manager backup file (missing version/data)");
  }

  const data = obj.data as Record<string, unknown[]>;
  const counts: Record<string, number> = {};
  for (const [k, v] of Object.entries(data)) {
    counts[k] = Array.isArray(v) ? v.length : 0;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  await recordAudit({
    session,
    action: "create",
    module: "settings",
    entityName: "Backup import (simulated)",
    details: { totalRecords: total, counts },
  });

  return NextResponse.json({
    ok: true,
    data: {
      message: `Import simulated — would create ${total} records`,
      total,
      counts,
      tenantName: (obj.tenant as { name?: string } | null)?.name ?? null,
      exportedAt: (obj.exportedAt as string) ?? null,
    },
  });
}
