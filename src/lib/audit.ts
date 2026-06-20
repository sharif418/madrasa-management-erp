// Audit log helper — call after every create/update/delete on critical resources
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/session";

type AuditInput = {
  session: SessionUser | null;
  action: "create" | "update" | "delete" | "login" | "logout" | "export";
  module: string;
  entityId?: string;
  entityName?: string;
  details?: Record<string, unknown>;
  /** Previous state (for update/delete operations) */
  before?: Record<string, unknown>;
  /** New state (for create/update operations) */
  after?: Record<string, unknown>;
  ip?: string;
};

export async function recordAudit(input: AuditInput) {
  try {
    // Merge before/after into details JSON so existing schema still works.
    // Older entries simply won't have these keys; the UI gracefully degrades.
    const merged: Record<string, unknown> = { ...(input.details ?? {}) };
    if (input.before !== undefined) merged.before = input.before;
    if (input.after !== undefined) merged.after = input.after;

    await db.auditLog.create({
      data: {
        tenantId: input.session?.tenantId ?? "system",
        actorId: input.session?.userId,
        action: input.action,
        module: input.module,
        entityId: input.entityId,
        entityName: input.entityName,
        details: Object.keys(merged).length ? JSON.stringify(merged) : null,
        ip: input.ip,
      },
    });
  } catch (e) {
    // Audit log failure must not break the main operation
    console.error("[audit] failed to record:", e);
  }
}
