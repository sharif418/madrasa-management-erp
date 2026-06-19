// Donors API — list (search + type + pagination) + KPIs + recent donations.
// POST: create donor with audit.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized, auditAfter } from "@/lib/api";

const TYPES = ["individual", "organization", "recurring"];
const FUNDS = ["zakat", "lillah", "waqf", "sadaqah", "general"];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const url = req.nextUrl;
  const search = (url.searchParams.get("search") || "").trim();
  const type = url.searchParams.get("type") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10) || 20));

  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (type && TYPES.includes(type)) where.type = type;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { nameArabic: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
      { country: { contains: search } },
    ];
  }

  const [total, rows, agg, recurringCount, countries, recentDonations] = await Promise.all([
    db.donor.count({ where }),
    db.donor.findMany({
      where,
      orderBy: [{ totalContributed: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.donation.aggregate({
      where: { tenantId: session.tenantId, status: "confirmed" },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    db.donor.count({ where: { tenantId: session.tenantId, isRecurring: true } }),
    db.donor.findMany({
      where: { tenantId: session.tenantId },
      distinct: ["country"],
      select: { country: true },
    }),
    db.donation.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { date: "desc" },
      take: 8,
      include: { donor: { select: { name: true, country: true } } },
    }),
  ]);

  const totalRaised = agg._sum.amount || 0;
  const count = agg._count._all || 0;
  const avg = count > 0 ? totalRaised / count : 0;

  return ok({
    items: rows,
    recentDonations,
    kpis: {
      totalDonors: total,
      totalRaised,
      recurringCount,
      countriesCount: countries.length,
      avgDonation: avg,
    },
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}

type CreateInput = {
  name?: string;
  nameArabic?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  type?: string;
  preferredFund?: string;
  isRecurring?: boolean;
  notes?: string;
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as CreateInput;
  const name = (body.name || "").trim();
  if (!name) return fail("Name is required");

  const type = TYPES.includes(body.type || "") ? body.type! : "individual";
  const preferredFund = FUNDS.includes(body.preferredFund || "") ? body.preferredFund! : null;

  const donor = await db.donor.create({
    data: {
      tenantId: session.tenantId,
      name,
      nameArabic: (body.nameArabic || "").trim() || null,
      email: (body.email || "").trim() || null,
      phone: (body.phone || "").trim() || null,
      address: (body.address || "").trim() || null,
      country: (body.country || "").trim() || "Bangladesh",
      type,
      preferredFund,
      isRecurring: !!body.isRecurring,
      notes: (body.notes || "").trim() || null,
    },
  });

  await auditAfter(session, {
    action: "create",
    module: "donors",
    entityId: donor.id,
    entityName: donor.name,
    details: { name, type, country: donor.country, isRecurring: donor.isRecurring },
  });

  return ok(donor, 201);
}
