// Hostel — add a block to a hostel
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized, auditAfter } from "@/lib/api";

type Input = { hostelId?: string; name?: string };

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as Input;
  const hostelId = (body.hostelId || "").trim();
  const name = (body.name || "").trim();
  if (!hostelId) return fail("Hostel ID required");
  if (!name) return fail("Block name required");

  const hostel = await db.hostel.findFirst({
    where: { id: hostelId, tenantId: session.tenantId },
    select: { id: true, name: true },
  });
  if (!hostel) return fail("Hostel not found", 404);

  const block = await db.hostelBlock.create({ data: { hostelId, name } });

  await auditAfter(session, {
    action: "create", module: "hostel", entityId: block.id,
    entityName: `${hostel.name} → ${name}`,
    details: { type: "block", hostelId, name },
  });

  return ok(block, 201);
}
