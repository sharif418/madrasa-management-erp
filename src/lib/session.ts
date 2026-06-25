// Tenant context — set on every API request based on authenticated user
// Enables row-level tenancy isolation across the entire app.
import { db } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";

export type SessionUser = {
  userId: string;
  tenantId: string;
  name: string;
  phone: string;
  roles: string[];
};

// In-memory request-scoped tenant context (per request lifecycle).
// For Next.js App Router API routes, we pass session explicitly to queries.
const _ctx = new WeakMap<Request, SessionUser>();

export function setTenantContext(req: Request, user: SessionUser) {
  _ctx.set(req, user);
}

export function getTenantContext(req: Request): SessionUser | undefined {
  return _ctx.get(req);
}

// Helper: parse & verify session token from Authorization header
import { cookies } from "next/headers";

const SESSION_COOKIE = "mm_session";
const TOKEN_SEP = "::";

// Production HMAC-SHA256 signed session token: base64(userId::tenantId::phone::expires::hmac)
const SECRET = process.env.MM_SECRET;
if (!SECRET && process.env.NODE_ENV === "production") {
  throw new Error("MM_SECRET environment variable is required in production. Generate with: openssl rand -hex 32");
}
const SIGNING_SECRET = SECRET || "madrasa-manager-dev-secret-change-in-prod";

async function hmac(data: string): Promise<string> {
  const { createHmac } = await import("crypto");
  return createHmac("sha256", SIGNING_SECRET).update(data).digest("hex");
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  const expires = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
  const payload = `${user.userId}${TOKEN_SEP}${user.tenantId}${TOKEN_SEP}${user.phone}${TOKEN_SEP}${expires}`;
  const sig = await hmac(payload);
  const token = Buffer.from(`${payload}${TOKEN_SEP}${sig}`).toString("base64url");
  return token;
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(TOKEN_SEP);
    if (parts.length !== 5) return null;
    const [userId, tenantId, phone, expiresStr, sig] = parts;
    const expires = parseInt(expiresStr, 10);
    if (Date.now() > expires) return null;
    const payload = `${userId}${TOKEN_SEP}${tenantId}${TOKEN_SEP}${phone}${TOKEN_SEP}${expiresStr}`;
    const expectedSig = await hmac(payload);
    if (sig !== expectedSig) return null;

    // Check session cache to avoid DB query on every request
    const cacheKey = `session:${userId}`;
    const cached = cacheGet<SessionUser>(cacheKey);
    if (cached && cached.tenantId === tenantId && cached.phone === phone) {
      return cached;
    }

    // Fetch user to verify still active & get name + roles
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    if (!user || !user.isActive || user.tenantId !== tenantId || user.phone !== phone) {
      return null;
    }
    const sessionUser: SessionUser = {
      userId: user.id,
      tenantId: user.tenantId,
      name: user.name,
      phone: user.phone,
      roles: user.roles.map((r) => r.role.name),
    };

    // Cache verified session for 60 seconds
    cacheSet(cacheKey, sessionUser, 60 * 1000);

    // Sliding refresh: auto-renew if less than 2 days remain
    const remainingMs = expires - Date.now();
    if (remainingMs < 2 * 24 * 60 * 60 * 1000 && remainingMs > 0) {
      try {
        const newToken = await createSessionToken(sessionUser);
        await setSessionCookie(newToken);
      } catch {
        // Non-critical — token renewal failure shouldn't block the request
      }
    }

    return sessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export { SESSION_COOKIE };
