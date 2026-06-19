// Inventory & Assets API
// GET  /api/inventory  — list items + assets + KPIs
// POST /api/inventory  — create item / asset (kind in body)
import { db } from "@/lib/db";
import { ok, fail, withSession, auditAfter } from "@/lib/api";

const ASSET_CATEGORIES = new Set(["furniture", "equipment", "building", "vehicle", "kitchen", "it", "other"]);
const ITEM_CATEGORIES = new Set(["stationery", "kitchen", "cleaning", "medical", "other"]);
const CONDITIONS = new Set(["excellent", "good", "fair", "poor", "damaged"]);
const ASSET_STATUSES = new Set(["in_use", "stored", "under_repair", "disposed"]);

// GET — items + assets + KPIs
export const GET = withSession(async ({ session }) => {
  const tenantId = session.tenantId;

  const [assets, items] = await Promise.all([
    db.asset.findMany({ where: { tenantId }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] }),
    db.inventoryItem.findMany({ where: { tenantId }, orderBy: [{ category: "asc" }, { name: "asc" }] }),
  ]);

  const assetValue = assets.reduce((s, a) => s + (a.currentValue || 0), 0);
  const lowStock = items.filter((i) => i.quantity <= i.minStock).length;
  const underRepair = assets.filter((a) => a.status === "under_repair").length;

  return ok({
    assets: assets.map((a) => ({
      id: a.id,
      name: a.name,
      category: a.category,
      serialNumber: a.serialNumber,
      purchaseDate: a.purchaseDate ? a.purchaseDate.toISOString() : null,
      purchaseCost: a.purchaseCost,
      currentValue: a.currentValue,
      condition: a.condition,
      location: a.location,
      assignedTo: a.assignedTo,
      status: a.status,
      notes: a.notes,
    })),
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      unit: i.unit,
      quantity: i.quantity,
      minStock: i.minStock,
      unitCost: i.unitCost,
      lastRestock: i.lastRestock ? i.lastRestock.toISOString() : null,
    })),
    kpis: {
      assetValue,
      assetCount: assets.length,
      lowStock,
      underRepair,
      itemCount: items.length,
    },
  });
});

// POST — create asset or item
type Body = {
  kind: "asset" | "item";
  // asset
  name?: string;
  category?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  currentValue?: number;
  condition?: string;
  location?: string;
  assignedTo?: string;
  status?: string;
  notes?: string;
  // item
  unit?: string;
  quantity?: number;
  minStock?: number;
  unitCost?: number;
};

export const POST = withSession(async ({ session, req }) => {
  const body = (await req.json().catch(() => ({}))) as Body;
  const tenantId = session.tenantId;
  const name = (body.name || "").trim();
  if (!name) return fail("Name is required");

  if (body.kind === "asset") {
    const category = body.category && ASSET_CATEGORIES.has(body.category) ? body.category : "other";
    const condition = body.condition && CONDITIONS.has(body.condition) ? body.condition : "good";
    const status = body.status && ASSET_STATUSES.has(body.status) ? body.status : "in_use";
    let purchaseDate: Date | null = null;
    if (body.purchaseDate) {
      const d = new Date(body.purchaseDate);
      if (!isNaN(d.getTime())) purchaseDate = d;
    }

    const created = await db.asset.create({
      data: {
        tenantId, name, category,
        serialNumber: body.serialNumber?.trim() || null,
        purchaseDate,
        purchaseCost: Number(body.purchaseCost) || 0,
        currentValue: Number(body.currentValue) || Number(body.purchaseCost) || 0,
        condition, status,
        location: body.location?.trim() || null,
        assignedTo: body.assignedTo?.trim() || null,
        notes: body.notes?.trim() || null,
      },
    });
    await auditAfter(session, {
      action: "create", module: "inventory", entityId: created.id,
      entityName: name, details: { kind: "asset", category, currentValue: created.currentValue },
    });
    return ok(created, 201);
  }

  if (body.kind === "item") {
    const category = body.category && ITEM_CATEGORIES.has(body.category) ? body.category : "other";
    const created = await db.inventoryItem.create({
      data: {
        tenantId, name, category,
        unit: body.unit?.trim() || "pcs",
        quantity: Number(body.quantity) || 0,
        minStock: Number(body.minStock) || 0,
        unitCost: Number(body.unitCost) || 0,
        lastRestock: new Date(),
      },
    });
    await auditAfter(session, {
      action: "create", module: "inventory", entityId: created.id,
      entityName: name, details: { kind: "item", category, quantity: created.quantity },
    });
    return ok(created, 201);
  }

  return fail("Unknown kind. Use 'asset' or 'item'");
});
