// Hostel — upsert mess menu for a given date + meal type
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized, auditAfter } from "@/lib/api";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snacks"] as const;
type MealType = (typeof MEAL_TYPES)[number];

type Input = {
  date?: string;
  mealType?: string;
  items?: string;
  headcount?: number;
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as Input;
  const dateStr = (body.date || "").trim();
  const mealType = (body.mealType || "").trim() as MealType;
  if (!dateStr) return fail("Date required");
  if (!MEAL_TYPES.includes(mealType)) return fail("Invalid meal type");

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return fail("Invalid date");

  const items = (body.items || "").trim();
  if (!items) return fail("Menu items required");

  const headcount = Math.max(0, Math.trunc(Number(body.headcount) || 0));

  // Look for existing menu row (same tenantId + date + mealType)
  const existing = await db.messMenu.findFirst({
    where: { tenantId: session.tenantId, date, mealType },
  });

  let menu;
  if (existing) {
    menu = await db.messMenu.update({
      where: { id: existing.id },
      data: { items, headcount },
    });
  } else {
    menu = await db.messMenu.create({
      data: { tenantId: session.tenantId, date, mealType, items, headcount },
    });
  }

  await auditAfter(session, {
    action: existing ? "update" : "create",
    module: "hostel",
    entityId: menu.id,
    entityName: `${mealType} ${dateStr}`,
    details: { type: "mess", date: dateStr, mealType, headcount },
  });

  return ok(menu, 201);
}
