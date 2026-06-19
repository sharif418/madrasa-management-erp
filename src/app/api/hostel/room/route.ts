// Hostel — add a room (auto-create N beds based on capacity)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized, auditAfter } from "@/lib/api";

type Input = { floorId?: string; roomNumber?: string; capacity?: number };

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as Input;
  const floorId = (body.floorId || "").trim();
  const roomNumber = (body.roomNumber || "").trim();
  const capacity = Math.max(1, Math.min(20, Math.trunc(Number(body.capacity) || 4)));
  if (!floorId) return fail("Floor ID required");
  if (!roomNumber) return fail("Room number required");

  const floor = await db.hostelFloor.findFirst({
    where: { id: floorId, block: { hostel: { tenantId: session.tenantId } } },
    select: { id: true, level: true, block: { select: { name: true, hostel: { select: { name: true } } } } },
  });
  if (!floor) return fail("Floor not found", 404);

  const room = await db.hostelRoom.create({
    data: { floorId, roomNumber, capacity },
  });

  // Auto-create beds
  const beds = await Promise.all(
    Array.from({ length: capacity }, (_, i) =>
      db.bed.create({
        data: { roomId: room.id, bedNumber: `${roomNumber}-${i + 1}` },
      })
    )
  );

  await auditAfter(session, {
    action: "create", module: "hostel", entityId: room.id,
    entityName: `${floor.block.hostel.name} → ${floor.block.name} → L${floor.level} → ${roomNumber}`,
    details: { type: "room", floorId, roomNumber, capacity, bedsCreated: beds.length },
  });

  return ok({ room, beds }, 201);
}
