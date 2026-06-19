// Global cross-entity search API
// Searches across students, teachers, donors, books, and transactions in parallel.
// All queries are scoped by the authenticated user's tenantId.
import { db } from "@/lib/db";
import { ok, fail, withSession } from "@/lib/api";

// GET /api/search?q=QUERY — requires session, query must be >= 2 chars.
// Returns up to 5 hits per entity type, all tenant-scoped.
export const GET = withSession(async ({ session, req }) => {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return fail("Query must be at least 2 characters", 400);
  }
  const tid = session.tenantId;

  // SQLite is case-insensitive for ASCII by default, so plain `contains` works.
  const [students, teachers, donors, books, transactions] = await Promise.all([
    db.student.findMany({
      where: {
        tenantId: tid,
        OR: [
          { name: { contains: q } },
          { nameArabic: { contains: q } },
          { rollNo: { contains: q } },
          { guardianPhone: { contains: q } },
          { guardianName: { contains: q } },
        ],
      },
      take: 5,
      select: {
        id: true, name: true, nameArabic: true, rollNo: true,
        class: { select: { name: true } },
      },
    }),
    db.teacher.findMany({
      where: {
        tenantId: tid,
        OR: [
          { name: { contains: q } },
          { nameArabic: { contains: q } },
          { phone: { contains: q } },
          { email: { contains: q } },
        ],
      },
      take: 5,
      select: { id: true, name: true, nameArabic: true, phone: true, designation: true },
    }),
    db.donor.findMany({
      where: {
        tenantId: tid,
        OR: [
          { name: { contains: q } },
          { nameArabic: { contains: q } },
          { email: { contains: q } },
          { phone: { contains: q } },
        ],
      },
      take: 5,
      select: { id: true, name: true, country: true },
    }),
    db.book.findMany({
      where: {
        tenantId: tid,
        OR: [
          { title: { contains: q } },
          { titleArabic: { contains: q } },
          { author: { contains: q } },
          { category: { contains: q } },
        ],
      },
      take: 5,
      select: { id: true, title: true, titleArabic: true, author: true, category: true },
    }),
    db.transaction.findMany({
      where: {
        tenantId: tid,
        OR: [
          { description: { contains: q } },
          { category: { contains: q } },
          { paymentMethod: { contains: q } },
        ],
      },
      take: 5,
      orderBy: { date: "desc" },
      select: { id: true, description: true, amount: true, type: true, date: true },
    }),
  ]);

  return ok({
    students: students.map((s) => ({ ...s, type: "student" as const })),
    teachers: teachers.map((t) => ({ ...t, type: "teacher" as const })),
    donors: donors.map((d) => ({ ...d, type: "donor" as const })),
    books: books.map((b) => ({ ...b, type: "book" as const })),
    // Note: transaction.type (income/expense/transfer) is preserved as `txnType`
    // while `type` carries the entity discriminator per the unified-search contract.
    transactions: transactions.map((t) => ({ ...t, txnType: t.type, type: "transaction" as const })),
    total:
      students.length +
      teachers.length +
      donors.length +
      books.length +
      transactions.length,
  });
});
