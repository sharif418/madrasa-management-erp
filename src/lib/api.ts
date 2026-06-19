// Standardized API response helpers
import { NextResponse } from "next/server";
import type { SessionUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error: message, details }, { status });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ ok: false, error: message }, { status: 403 });
}

export function notFound(message = "Not Found") {
  return NextResponse.json({ ok: false, error: message }, { status: 404 });
}

// Wrap an API handler with session check + tenant isolation + error handling + audit
type Handler<T> = (ctx: {
  session: SessionUser;
  req: Request;
  params?: Record<string, string>;
}) => Promise<T>;

export function withSession<T>(handler: Handler<T>) {
  return async (req: Request, ctx?: { params?: Promise<Record<string, string>> }) => {
    try {
      const { getSession } = await import("@/lib/session");
      const session = await getSession();
      if (!session) return unauthorized();

      const params = ctx?.params ? await ctx.params : undefined;
      const result = await handler({ session, req, params });

      // If result is a NextResponse, return as-is
      if (result instanceof NextResponse) return result;
      return ok(result);
    } catch (e) {
      console.error("[api] error:", e);
      const msg = e instanceof Error ? e.message : "Internal Server Error";
      return fail(msg, 500);
    }
  };
}

// Helper: log audit after a successful operation
export async function auditAfter(
  session: SessionUser,
  input: Omit<Parameters<typeof recordAudit>[0], "session">
) {
  await recordAudit({ session, ...input });
}
