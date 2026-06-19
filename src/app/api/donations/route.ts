// Donations API — list (filters + pagination) + create (atomic: donor update + transaction).
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized, auditAfter } from "@/lib/api";

const FUNDS = ["zakat", "lillah", "waqf", "sadaqah", "general"];
const METHODS = ["cash", "bkash", "nagad", "bank", "card", "sslcommerz"];
const STATUSES = ["pending", "confirmed", "failed"];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const url = req.nextUrl;
  const donorId = url.searchParams.get("donorId") || "";
  const fund = url.searchParams.get("fund") || "";
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10) || 20));

  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (donorId) where.donorId = donorId;
  if (fund && FUNDS.includes(fund)) where.fund = fund;

  const dateFilter: Record<string, Date> = {};
  if (from) { const d = new Date(from); if (!isNaN(d.getTime())) dateFilter.gte = d; }
  if (to) {
    const d = new Date(to);
    if (!isNaN(d.getTime())) { d.setHours(23, 59, 59, 999); dateFilter.lte = d; }
  }
  if (Object.keys(dateFilter).length) where.date = dateFilter;

  const [total, items] = await Promise.all([
    db.donation.count({ where }),
    db.donation.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { donor: { select: { name: true, country: true } } },
    }),
  ]);

  return ok({
    items, total, page, limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}

type CreateInput = {
  donorId?: string;
  donorName?: string;
  amount?: number;
  fund?: string;
  purpose?: string;
  paymentMethod?: string;
  reference?: string;
  isRecurring?: boolean;
  status?: string;
  date?: string;
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as CreateInput;
  const amount = typeof body.amount === "number" ? body.amount : Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) return fail("Amount must be a positive number");
  const fund = FUNDS.includes(body.fund || "") ? body.fund! : "general";
  const method = METHODS.includes(body.paymentMethod || "") ? body.paymentMethod! : "cash";
  const status = STATUSES.includes(body.status || "") ? body.status! : "confirmed";
  const donorName = (body.donorName || "").trim() || "Anonymous";
  const date = body.date ? new Date(body.date) : new Date();
  if (isNaN(date.getTime())) return fail("Invalid date");

  // Optional donor linkage
  let donorId: string | null = null;
  if (body.donorId) {
    const donor = await db.donor.findFirst({
      where: { id: body.donorId, tenantId: session.tenantId },
      select: { id: true, name: true, totalContributed: true, contributionCount: true, firstDonation: true },
    });
    if (!donor) return fail("Donor not found in your madrasa");
    donorId = donor.id;
  }

  // Find or create a matching Fund (by type) to post an income transaction.
  const fundName = fund.charAt(0).toUpperCase() + fund.slice(1);
  const fundRow = await db.fund.findFirst({
    where: { tenantId: session.tenantId, type: fund },
    select: { id: true, name: true, balance: true },
  });
  let finalFundId = fundRow?.id ?? null;
  if (!finalFundId) {
    // Try by name fallback
    const byName = await db.fund.findFirst({
      where: { tenantId: session.tenantId, name: fundName },
      select: { id: true },
    });
    finalFundId = byName?.id ?? null;
  }

  const donation = await db.$transaction(async (tx) => {
    const d = await tx.donation.create({
      data: {
        tenantId: session.tenantId,
        donorId,
        donorName,
        amount,
        fund,
        purpose: body.purpose?.trim() || null,
        paymentMethod: method,
        reference: body.reference?.trim() || null,
        isRecurring: !!body.isRecurring,
        status,
        date,
      },
    });

    // Update donor aggregate stats (only when confirmed)
    if (donorId && status === "confirmed") {
      const donor = await tx.donor.findUnique({ where: { id: donorId }, select: { totalContributed: true, contributionCount: true, firstDonation: true } });
      if (donor) {
        await tx.donor.update({
          where: { id: donorId },
          data: {
            totalContributed: { increment: amount },
            contributionCount: { increment: 1 },
            lastDonation: date,
            firstDonation: donor.firstDonation ?? date,
          },
        });
      }
    }

    // Post a corresponding income Transaction + bump Fund balance (only if confirmed)
    if (finalFundId && status === "confirmed") {
      await tx.fund.update({
        where: { id: finalFundId },
        data: { balance: { increment: amount } },
      });
      await tx.transaction.create({
        data: {
          tenantId: session.tenantId,
          fundId: finalFundId,
          amount,
          type: "income",
          category: "donation",
          description: body.purpose?.trim() || `Donation — ${donorName}`,
          paymentMethod: method,
          date,
        },
      });
    }

    return d;
  });

  await auditAfter(session, {
    action: "create",
    module: "donations",
    entityId: donation.id,
    entityName: `Donation ৳${amount} — ${donorName}`,
    details: { amount, fund, method, status, donorId },
  });

  return ok(donation, 201);
}
