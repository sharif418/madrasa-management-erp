// GET /api/export/teachers — export all teachers for the current tenant as CSV.
import { db } from "@/lib/db";
import { unauthorized } from "@/lib/api";
import { getSession } from "@/lib/session";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

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
