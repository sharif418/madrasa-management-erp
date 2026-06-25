// POST /api/auth/login — phone + password login
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { ok, fail } from "@/lib/api";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const retryAfter = checkRateLimit(req, "auth");
    if (retryAfter !== null) {
      return fail(`Too many login attempts. Please try again in ${retryAfter} seconds.`, 429);
    }

    const { phone, password } = await req.json();
    if (!phone || !password) return fail("Phone and password are required");

    const user = await db.user.findFirst({
      where: { phone, isActive: true },
      include: { tenant: true, roles: { include: { role: true } } },
    });
    if (!user) return fail("Invalid credentials", 401);
    if (!user.tenant || user.tenant.status !== "active") {
      return fail("Your madrasa account is not active. Please contact support.", 403);
    }

    const valid = verifyPassword(password, user.password);
    if (!valid) return fail("Invalid credentials", 401);

    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const sessionUser = {
      userId: user.id,
      tenantId: user.tenantId,
      name: user.name,
      phone: user.phone,
      roles: user.roles.map((r) => r.role.name),
    };
    const token = await createSessionToken(sessionUser);
    await setSessionCookie(token);

    await recordAudit({
      session: sessionUser,
      action: "login",
      module: "auth",
      ip: req.headers.get("x-forwarded-for") ?? undefined,
    });

    return ok({
      user: sessionUser,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        language: user.tenant.language,
        theme: user.tenant.theme,
      },
    });
  } catch (e) {
    console.error("[login]", e);
    return fail("Login failed", 500);
  }
}
