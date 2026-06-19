// Audit log helper — call after every create/update/delete on critical resources
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/session";

type AuditInput = {
  session: SessionUser | null;
  action: "create" | "update" | "delete" | "login" | "logout";
  module: string;
  entityId?: string;
  entityName?: string;
  details?: Record<string, unknown>;
  ip?: string;
};

export async function recordAudit(input: AuditInput) {
  try {
    await db.auditLog.create({
      data: {
        tenantId: input.session?.tenantId ?? "system",
        actorId: input.session?.userId,
        action: input.action,
        module: input.module,
        entityId: input.entityId,
        entityName: input.entityName,
        details: input.details ? JSON.stringify(input.details) : null,
        ip: input.ip,
      },
    });
  } catch (e) {
    // Audit log failure must not break the main operation
    console.error("[audit] failed to record:", e);
  }
}
