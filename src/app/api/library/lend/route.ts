// Library lending API — POST /api/library/lend
// Lend a book: bookId, borrowerName, dueDate, optional studentId.
// Decrements book.availableCopies atomically and creates BookLending.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized, notFound, auditAfter } from "@/lib/api";

type Input = {
  bookId?: string;
  borrowerName?: string;
  studentId?: string;
  dueDate?: string;
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as Input;
  const bookId = (body.bookId || "").trim();
  const borrowerName = (body.borrowerName || "").trim();
  if (!bookId) return fail("Book is required");
  if (!borrowerName) return fail("Borrower name is required");

  const due = body.dueDate ? new Date(body.dueDate) : null;
  if (!due || isNaN(due.getTime())) return fail("Valid due date is required");

  const book = await db.book.findFirst({
    where: { id: bookId, tenantId: session.tenantId },
    select: { id: true, title: true, availableCopies: true },
  });
  if (!book) return notFound("Book not found");
  if (book.availableCopies <= 0) return fail("No copies available for lending");

  const lending = await db.$transaction(async (tx) => {
    const updated = await tx.book.update({
      where: { id: book.id },
      data: { availableCopies: { decrement: 1 } },
    });
    if (updated.availableCopies < 0) throw new Error("No copies available");
    return tx.bookLending.create({
      data: {
        tenantId: session.tenantId,
        bookId: book.id,
        studentId: body.studentId?.trim() || null,
        borrowerName,
        dueDate: due,
        status: "borrowed",
      },
    });
  });

  await auditAfter(session, {
    action: "create",
    module: "library",
    entityId: lending.id,
    entityName: `Lent: ${book.title} → ${borrowerName}`,
    details: { bookId: book.id, borrowerName, dueDate: due.toISOString() },
  });

  return ok(lending, 201);
}
