// Hostel & Residential — collection API
// GET  /api/hostel         — full hostel tree + mess menus (7d) + recent gate passes + recent visitors
// POST /api/hostel         — create hostel (name, wardenTeacherId?)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  const [hostels, messMenus, gatePasses, visitors] = await Promise.all([
    db.hostel.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: "asc" },
      include: {
        blocks: {
          orderBy: { createdAt: "asc" },
          include: {
            floors: {
              orderBy: { level: "asc" },
              include: {
                rooms: {
                  orderBy: { roomNumber: "asc" },
                  include: {
                    beds: {
                      orderBy: { bedNumber: "asc" },
                      include: {
                        allocations: {
                          where: { releasedAt: null },
                          include: { student: { select: { id: true, name: true, rollNo: true } } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    db.messMenu.findMany({
      where: {
        tenantId: session.tenantId,
        date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      orderBy: { date: "asc" },
      take: 28, // 7 days × 4 meal types
    }),
    db.gatePass.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { student: { select: { id: true, name: true, rollNo: true } } },
    }),
    db.visitor.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return ok({ hostels, messMenus, gatePasses, visitors });
}

type CreateInput = {
  name?: string;
  wardenTeacherId?: string;
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  // RBAC: require hostel:create permission
  const allowed = await checkPermission(session, "hostel", "create");
  if (!allowed) return forbidden("You don't have permission to manage hostel");

  const body = (await req.json().catch(() => ({}))) as CreateInput;
  const name = (body.name || "").trim();
  if (!name) return fail("Hostel name is required");

  let wardenTeacherId: string | null = null;
  if (body.wardenTeacherId) {
    const teacher = await db.teacher.findFirst({
      where: { id: body.wardenTeacherId, tenantId: session.tenantId },
      select: { id: true },
    });
    if (teacher) wardenTeacherId = teacher.id;
  }

  const hostel = await db.hostel.create({
    data: { tenantId: session.tenantId, name, wardenTeacherId },
  });

  await auditAfter(session, {
    action: "create",
    module: "hostel",
    entityId: hostel.id,
    entityName: hostel.name,
    details: { name, wardenTeacherId },
  });

  return ok(hostel, 201);
}
