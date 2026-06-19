// Inventory by id — PUT (update) / DELETE
// Handles both Asset and InventoryItem by kind in body
import { db } from "@/lib/db";
import { ok, fail, notFound, withSession, auditAfter } from "@/lib/api";

const ASSET_CATEGORIES = new Set(["furniture", "equipment", "building", "vehicle", "kitchen", "it", "other"]);
const ITEM_CATEGORIES = new Set(["stationery", "kitchen", "cleaning", "medical", "other"]);
const CONDITIONS = new Set(["excellent", "good", "fair", "poor", "damaged"]);
const ASSET_STATUSES = new Set(["in_use", "stored", "under_repair", "disposed"]);

type Body = {
  kind: "asset" | "item";
  name?: string;
  category?: string;
  serialNumber?: string;
  purchaseCost?: number;
  currentValue?: number;
  condition?: string;
  location?: string;
  assignedTo?: string;
  status?: string;
  notes?: string;
  unit?: string;
  quantity?: number;
  minStock?: number;
  unitCost?: number;
};

export const PUT = withSession(async ({ session, req, params }) => {
  const id = params?.id;
  if (!id) return fail("Missing id");
  const body = (await req.json().catch(() => ({}))) as Body;
  if (body.kind !== "asset" && body.kind !== "item") return fail("kind is required");

  if (body.kind === "asset") {
    const existing = await db.asset.findFirst({ where: { id, tenantId: session.tenantId }, select: { id: true, name: true } });
    if (!existing) return notFound("Asset not found");
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.category !== undefined && ASSET_CATEGORIES.has(body.category)) data.category = body.category;
    if (body.serialNumber !== undefined) data.serialNumber = body.serialNumber?.trim() || null;
    if (body.purchaseCost !== undefined) data.purchaseCost = Number(body.purchaseCost) || 0;
    if (body.currentValue !== undefined) data.currentValue = Number(body.currentValue) || 0;
    if (body.condition !== undefined && CONDITIONS.has(body.condition)) data.condition = body.condition;
    if (body.location !== undefined) data.location = body.location?.trim() || null;
    if (body.assignedTo !== undefined) data.assignedTo = body.assignedTo?.trim() || null;
    if (body.status !== undefined && ASSET_STATUSES.has(body.status)) data.status = body.status;
    if (body.notes !== undefined) data.notes = body.notes?.trim() || null;

    const updated = await db.asset.update({ where: { id }, data });
    await auditAfter(session, {
      action: "update", module: "inventory", entityId: id,
      entityName: existing.name, details: { kind: "asset", changed: Object.keys(data) },
    });
    return ok(updated);
  }

  // item
  const existing = await db.inventoryItem.findFirst({ where: { id, tenantId: session.tenantId }, select: { id: true, name: true } });
  if (!existing) return notFound("Item not found");
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name.trim();
  if (body.category !== undefined && ITEM_CATEGORIES.has(body.category)) data.category = body.category;
  if (body.unit !== undefined) data.unit = body.unit?.trim() || "pcs";
  if (body.quantity !== undefined) data.quantity = Number(body.quantity) || 0;
  if (body.minStock !== undefined) data.minStock = Number(body.minStock) || 0;
  if (body.unitCost !== undefined) data.unitCost = Number(body.unitCost) || 0;
  if (body.quantity !== undefined) data.lastRestock = new Date();

  const updated = await db.inventoryItem.update({ where: { id }, data });
  await auditAfter(session, {
    action: "update", module: "inventory", entityId: id,
    entityName: existing.name, details: { kind: "item", changed: Object.keys(data) },
  });
  return ok(updated);
});

export const DELETE = withSession(async ({ session, req, params }) => {
  const id = params?.id;
  if (!id) return fail("Missing id");
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind");
  if (kind !== "asset" && kind !== "item") return fail("?kind=asset|item is required");

  if (kind === "asset") {
    const existing = await db.asset.findFirst({ where: { id, tenantId: session.tenantId }, select: { id: true, name: true } });
    if (!existing) return notFound("Asset not found");
    await db.asset.delete({ where: { id } });
    await auditAfter(session, {
      action: "delete", module: "inventory", entityId: id,
      entityName: existing.name, details: { kind: "asset" },
    });
    return ok({ id });
  }

  const existing = await db.inventoryItem.findFirst({ where: { id, tenantId: session.tenantId }, select: { id: true, name: true } });
  if (!existing) return notFound("Item not found");
  await db.inventoryItem.delete({ where: { id } });
  await auditAfter(session, {
    action: "delete", module: "inventory", entityId: id,
    entityName: existing.name, details: { kind: "item" },
  });
  return ok({ id });
});
