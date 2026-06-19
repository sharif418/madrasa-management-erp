// Hostel — add a floor to a block
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized, auditAfter } from "@/lib/api";

type Input = { blockId?: string; level?: number };

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as Input;
  const blockId = (body.blockId || "").trim();
  const level = Number(body.level);
  if (!blockId) return fail("Block ID required");
  if (!Number.isFinite(level)) return fail("Floor level required");

  const block = await db.hostelBlock.findFirst({
    where: { id: blockId, hostel: { tenantId: session.tenantId } },
    select: { id: true, name: true, hostel: { select: { name: true } } },
  });
  if (!block) return fail("Block not found", 404);

  const floor = await db.hostelFloor.create({
    data: { blockId, level: Math.trunc(level) },
  });

  await auditAfter(session, {
    action: "create", module: "hostel", entityId: floor.id,
    entityName: `${block.hostel.name} → ${block.name} → L${level}`,
    details: { type: "floor", blockId, level },
  });

  return ok(floor, 201);
}
