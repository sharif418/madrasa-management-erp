// POST /api/notifications/read — mark all notifications as read (demo, no per-user state).
import { getSession } from "@/lib/session";
import { ok, unauthorized } from "@/lib/api";

export async function POST() {
  const session = await getSession();
  if (!session) return unauthorized();
  return ok({ marked: true });
}
