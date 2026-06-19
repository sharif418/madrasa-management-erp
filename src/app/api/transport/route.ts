// Transport & Vehicle Routing API
// GET  /api/transport          — list vehicles + routes + allocations + KPIs
// POST /api/transport          — create vehicle / route / allocation (kind in body)
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter } from "@/lib/api";

const VEHICLE_TYPES = new Set(["bus", "minibus", "microbus", "van"]);

// GET — vehicles + routes + allocations + KPIs
export const GET = withSession(async ({ session }) => {
  const tenantId = session.tenantId;

  const [vehicles, routes, allocations, students] = await Promise.all([
    db.vehicle.findMany({
      where: { tenantId },
      include: { allocations: { where: { isActive: true }, select: { id: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.transportRoute.findMany({
      where: { tenantId },
      include: { allocations: { where: { isActive: true }, select: { id: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.transportAllocation.findMany({
      where: { tenantId },
      include: {
        student: { select: { id: true, name: true, rollNo: true } },
        vehicle: { select: { id: true, registration: true, type: true } },
        route: { select: { id: true, name: true, monthlyFee: true } },
      },
      orderBy: { allocatedAt: "desc" },
    }),
    db.student.count({ where: { tenantId, isActive: true } }),
  ]);

  const activeVehicles = vehicles.filter((v) => v.isActive).length;
  const totalCapacity = vehicles.reduce((s, v) => s + v.capacity, 0);
  const allocatedCount = allocations.filter((a) => a.isActive).length;

  return ok({
    vehicles: vehicles.map((v) => ({
      id: v.id,
      registration: v.registration,
      type: v.type,
      capacity: v.capacity,
      driverName: v.driverName,
      driverPhone: v.driverPhone,
      routeName: v.routeName,
      isActive: v.isActive,
      occupancy: v.allocations.length,
    })),
    routes: routes.map((r) => {
      let stops: string[] = [];
      try { stops = JSON.parse(r.stops) as string[]; } catch { stops = []; }
      return {
        id: r.id,
        name: r.name,
        startPoint: r.startPoint,
        endPoint: r.endPoint,
        distanceKm: r.distanceKm,
        monthlyFee: r.monthlyFee,
        stops,
        allocatedCount: r.allocations.length,
      };
    }),
    allocations: allocations.map((a) => ({
      id: a.id,
      isActive: a.isActive,
      pickupPoint: a.pickupPoint,
      allocatedAt: a.allocatedAt.toISOString(),
      student: a.student,
      vehicle: a.vehicle,
      route: a.route,
    })),
    kpis: {
      activeVehicles,
      totalRoutes: routes.length,
      allocatedStudents: allocatedCount,
      totalCapacity,
      activeStudents: students,
    },
  });
});

// POST — create vehicle / route / allocation
type Body = {
  kind: "vehicle" | "route" | "allocation";
  registration?: string;
  type?: string;
  capacity?: number;
  driverName?: string;
  driverPhone?: string;
  routeName?: string;
  name?: string;
  startPoint?: string;
  endPoint?: string;
  distanceKm?: number;
  monthlyFee?: number;
  stops?: string[];
  studentId?: string;
  vehicleId?: string;
  routeId?: string;
  pickupPoint?: string;
};

export const POST = withSession(async ({ session, req }) => {
  const body = (await req.json().catch(() => ({}))) as Body;
  const tenantId = session.tenantId;

  if (body.kind === "vehicle") {
    const registration = (body.registration || "").trim();
    const driverName = (body.driverName || "").trim();
    if (!registration) return fail("Registration is required");
    if (!driverName) return fail("Driver name is required");
    const capacity = Number(body.capacity) || 0;
    if (capacity <= 0) return fail("Capacity must be positive");
    const type = body.type && VEHICLE_TYPES.has(body.type) ? body.type : "bus";

    const dup = await db.vehicle.findUnique({ where: { registration } });
    if (dup) return fail("Vehicle with this registration already exists");

    const created = await db.vehicle.create({
      data: {
        tenantId, registration, type, capacity, driverName,
        driverPhone: body.driverPhone?.trim() || null,
        routeName: body.routeName?.trim() || null,
        isActive: true,
      },
    });
    await auditAfter(session, {
      action: "create", module: "transport", entityId: created.id,
      entityName: registration, details: { kind: "vehicle", type, capacity },
    });
    return ok(created, 201);
  }

  if (body.kind === "route") {
    const name = (body.name || "").trim();
    const startPoint = (body.startPoint || "").trim();
    const endPoint = (body.endPoint || "").trim();
    if (!name) return fail("Route name is required");
    if (!startPoint || !endPoint) return fail("Start and end points are required");

    const created = await db.transportRoute.create({
      data: {
        tenantId, name, startPoint, endPoint,
        distanceKm: Number(body.distanceKm) || 0,
        monthlyFee: Number(body.monthlyFee) || 0,
        stops: JSON.stringify(body.stops || []),
      },
    });
    await auditAfter(session, {
      action: "create", module: "transport", entityId: created.id,
      entityName: name, details: { kind: "route", startPoint, endPoint },
    });
    return ok(created, 201);
  }

  if (body.kind === "allocation") {
    if (!body.studentId || !body.vehicleId || !body.routeId)
      return fail("Student, vehicle and route are required");
    const [stu, veh, rte] = await Promise.all([
      db.student.findFirst({ where: { id: body.studentId, tenantId }, select: { id: true, name: true } }),
      db.vehicle.findFirst({ where: { id: body.vehicleId, tenantId }, select: { id: true, capacity: true } }),
      db.transportRoute.findFirst({ where: { id: body.routeId, tenantId }, select: { id: true, name: true } }),
    ]);
    if (!stu) return fail("Student not found");
    if (!veh) return fail("Vehicle not found");
    if (!rte) return fail("Route not found");

    const occ = await db.transportAllocation.count({
      where: { vehicleId: body.vehicleId, isActive: true },
    });
    if (occ >= veh.capacity) return fail("Vehicle is at full capacity");

    const existing = await db.transportAllocation.findFirst({
      where: { studentId: body.studentId, isActive: true, tenantId },
    });
    if (existing) return fail("Student already has an active allocation");

    const created = await db.transportAllocation.create({
      data: {
        tenantId, studentId: body.studentId, vehicleId: body.vehicleId,
        routeId: body.routeId, pickupPoint: body.pickupPoint?.trim() || null,
        isActive: true,
      },
    });
    await auditAfter(session, {
      action: "create", module: "transport", entityId: created.id,
      entityName: stu.name, details: { kind: "allocation", vehicleId: body.vehicleId, routeId: body.routeId },
    });
    return ok(created, 201);
  }

  return fail("Unknown kind. Use 'vehicle', 'route' or 'allocation'");
});
