// Library & Book Bank API
// GET  /api/library — list books (search/category/pagination) + KPIs + recent lendings
// POST /api/library — create a book (audit recorded)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

const CATEGORIES = ["fiqh", "tafsir", "hadith", "nahw", "sarf", "literature", "other"];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const url = req.nextUrl;
  const search = (url.searchParams.get("search") || "").trim();
  const category = url.searchParams.get("category") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10) || 20));

  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (category && CATEGORIES.includes(category)) where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { titleArabic: { contains: search } },
      { author: { contains: search } },
      { isbn: { contains: search } },
    ];
  }

  const [total, rows, recentLendings, agg] = await Promise.all([
    db.book.count({ where }),
    db.book.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { title: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.bookLending.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { borrowedAt: "desc" },
      take: 100,
      include: { book: { select: { title: true, titleArabic: true } } },
    }),
    db.book.aggregate({
      where: { tenantId: session.tenantId },
      _sum: { totalCopies: true, availableCopies: true },
      _count: { _all: true },
    }),
  ]);

  const now = new Date();
  const overdueCount = await db.bookLending.count({
    where: {
      tenantId: session.tenantId,
      status: "borrowed",
      dueDate: { lt: now },
    },
  });
  const borrowedCount = await db.bookLending.count({
    where: { tenantId: session.tenantId, status: "borrowed" },
  });

  return ok({
    items: rows,
    recentLendings,
    kpis: {
      totalTitles: agg._count._all,
      totalCopies: agg._sum.totalCopies || 0,
      availableCopies: agg._sum.availableCopies || 0,
      borrowed: borrowedCount,
      overdue: overdueCount,
    },
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}

type CreateInput = {
  title?: string;
  titleArabic?: string;
  author?: string;
  category?: string;
  isbn?: string;
  totalCopies?: number;
  shelfLocation?: string;
  description?: string;
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  // RBAC: require library:create permission
  const allowed = await checkPermission(session, "library", "create");
  if (!allowed) return forbidden("You don't have permission to manage library");

  const body = (await req.json().catch(() => ({}))) as CreateInput;
  const title = (body.title || "").trim();
  if (!title) return fail("Title is required");

  const total = typeof body.totalCopies === "number" ? body.totalCopies : Number(body.totalCopies || 1);
  if (!Number.isFinite(total) || total < 0) return fail("Invalid copies count");
  const category = CATEGORIES.includes(body.category || "") ? body.category! : "other";

  const book = await db.book.create({
    data: {
      tenantId: session.tenantId,
      title,
      titleArabic: (body.titleArabic || "").trim() || null,
      author: (body.author || "").trim() || null,
      category,
      isbn: (body.isbn || "").trim() || null,
      totalCopies: total,
      availableCopies: total,
      shelfLocation: (body.shelfLocation || "").trim() || null,
      description: (body.description || "").trim() || null,
    },
  });

  await auditAfter(session, {
    action: "create",
    module: "library",
    entityId: book.id,
    entityName: book.title,
    details: { title, category, copies: total },
  });

  return ok(book, 201);
}
