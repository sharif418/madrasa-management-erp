// GET /api/export/students — export all students for the current tenant.
// Query: ?format=csv (default) | xlsx
// Columns: rollNo, name, nameArabic, gender, phone, guardianName, guardianPhone,
//           class, isHafiz, isZakatEligible, isActive, admissionDate
import { db } from "@/lib/db";
import { unauthorized } from "@/lib/api";
import { getSession } from "@/lib/session";
import { toCsv } from "@/lib/csv";
import { generateExcel, excelResponse } from "@/lib/excel";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();

  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "csv";

  const students = await db.student.findMany({
    where: { tenantId: session.tenantId },
    include: { class: { select: { name: true } } },
    orderBy: [{ rollNo: "asc" }, { createdAt: "desc" }],
  });

  const headers = [
    "rollNo", "name", "nameArabic", "gender", "phone",
    "guardianName", "guardianPhone", "class",
    "isHafiz", "isZakatEligible", "isActive", "admissionDate",
  ];
  const rows = students.map((s) => [
    s.rollNo ?? "",
    s.name,
    s.nameArabic ?? "",
    s.gender,
    s.phone ?? "",
    s.guardianName ?? "",
    s.guardianPhone ?? "",
    s.class?.name ?? "",
    s.isHafiz ? "yes" : "no",
    s.isZakatEligible ? "yes" : "no",
    s.isActive ? "yes" : "no",
    s.admissionDate ? s.admissionDate.toISOString().slice(0, 10) : "",
  ]);

  if (format === "xlsx") {
    const buf = await generateExcel("students", [
      { name: "Students", headers, rows },
    ]);
    return excelResponse(buf, "students.xlsx");
  }

  const csv = toCsv([headers, ...rows]);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="students.csv"',
      "Cache-Control": "no-store",
    },
  });
}
