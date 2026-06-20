// GET /api/export/teachers — export all teachers for the current tenant.
// Query: ?format=csv (default) | xlsx
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

  const teachers = await db.teacher.findMany({
    where: { tenantId: session.tenantId },
    orderBy: [{ createdAt: "desc" }, { name: "asc" }],
  });

  const headers = [
    "name", "nameArabic", "phone", "email", "gender",
    "designation", "specialization", "salary", "joinDate",
    "isActive", "address",
  ];
  const rows = teachers.map((t) => [
    t.name,
    t.nameArabic ?? "",
    t.phone ?? "",
    t.email ?? "",
    t.gender,
    t.designation ?? "",
    t.specialization ?? "",
    t.salary,
    t.joinDate ? t.joinDate.toISOString().slice(0, 10) : "",
    t.isActive ? "yes" : "no",
    t.address ?? "",
  ]);

  if (format === "xlsx") {
    const buf = await generateExcel("teachers", [
      { name: "Teachers", headers, rows },
    ]);
    return excelResponse(buf, "teachers.xlsx");
  }

  const csv = toCsv([headers, ...rows]);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="teachers.csv"',
      "Cache-Control": "no-store",
    },
  });
}
