// Library return API — POST /api/library/return
// Marks a BookLending as returned, increments book.availableCopies,
// and computes a fine if the due date has passed (5 BDT/day by default).
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized, notFound, auditAfter, forbidden } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";

const FINE_PER_DAY = 5; // BDT

type Input = { lendingId?: string };

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  // RBAC: require library:update permission (returning a book mutates library state)
  const allowed = await checkPermission(session, "library", "update");
  if (!allowed) return forbidden("You don't have permission to return books");

  const body = (await req.json().catch(() => ({}))) as Input;
  const lendingId = (body.lendingId || "").trim();
  if (!lendingId) return fail("Lending ID is required");

  const lending = await db.bookLending.findFirst({
    where: { id: lendingId, tenantId: session.tenantId },
    include: { book: { select: { id: true, title: true, totalCopies: true } } },
  });
  if (!lending) return notFound("Lending record not found");
  if (lending.status === "returned") return fail("Book already returned");

  const now = new Date();
  let fine = 0;
  if (now > lending.dueDate) {
    const ms = now.getTime() - lending.dueDate.getTime();
    fine = Math.ceil(ms / (1000 * 60 * 60 * 24)) * FINE_PER_DAY;
  }

  await db.$transaction(async (tx) => {
    await tx.book.update({
      where: { id: lending.bookId },
      data: { availableCopies: { increment: 1 } },
    });
    await tx.bookLending.update({
      where: { id: lending.id },
      data: { returnedAt: now, status: "returned", fine },
    });
  });

  await auditAfter(session, {
    action: "update",
    module: "library",
    entityId: lending.id,
    entityName: `Returned: ${lending.book.title}`,
    details: { lendingId: lending.id, fine, overdue: fine > 0 },
  });

  return ok({ id: lending.id, returned: true, fine });
}
