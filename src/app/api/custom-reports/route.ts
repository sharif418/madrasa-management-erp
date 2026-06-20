// POST /api/custom-reports — user-defined report builder.
// Body: { entity, columns[], filters[], format: "json"|"pdf" }
// Tenant-scoped. Returns JSON or PDF (with pdf-lib table).
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { unauthorized, fail } from "@/lib/api";
import { createPdfDoc, addTable, finalizePdf, PAGE_W, MARGIN } from "@/lib/pdf";

export const dynamic = "force-dynamic";

type EntityType = "students" | "teachers" | "transactions" | "hifz" | "attendance" | "fees";
type Filter = { field: string; op: "equals" | "contains" | "gt" | "lt"; value: string };
type Body = {
  entity?: EntityType;
  columns?: string[];
  filters?: Filter[];
  format?: "json" | "pdf";
};

// Allowed columns per entity (whitelist for safety)
const COLUMNS: Record<EntityType, string[]> = {
  students: ["name", "nameArabic", "rollNo", "gender", "dob", "phone", "guardianName", "guardianPhone", "address", "bloodGroup", "isHafiz", "isActive", "admissionDate"],
  teachers: ["name", "nameArabic", "phone", "email", "gender", "designation", "specialization", "salary", "joinDate", "isActive", "address"],
  transactions: ["amount", "type", "category", "description", "paymentMethod", "date", "fundId"],
  hifz: ["type", "paraNumber", "surahName", "ayahFrom", "ayahTo", "qualityRating", "mistakesCount", "status", "recordedAt"],
  attendance: ["personType", "date", "status", "notes"],
  fees: ["amount", "paidAmount", "dueDate", "paidDate", "status", "method", "notes"],
};

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

function applyFilter(field: string, f: Filter): Record<string, unknown> {
  const num = Number(f.value);
  switch (f.op) {
    case "equals": return { [field]: f.value };
    case "contains": return { [field]: { contains: f.value } };
    case "gt": return Number.isFinite(num) ? { [field]: { gte: num } } : {};
    case "lt": return Number.isFinite(num) ? { [field]: { lte: num } } : {};
    default: return {};
  }
}

async function fetchEntity(tid: string, entity: EntityType, cols: string[], filters: Filter[]) {
  const select: Record<string, true> = {};
  for (const c of cols) select[c] = true;
  const where: Record<string, unknown> = { tenantId: tid };
  for (const f of filters) {
    if (!COLUMNS[entity].includes(f.field)) continue;
    Object.assign(where, applyFilter(f.field, f));
  }
  switch (entity) {
    case "students": return db.student.findMany({ where, select, take: 500, orderBy: { name: "asc" } });
    case "teachers": return db.teacher.findMany({ where, select, take: 500, orderBy: { name: "asc" } });
    case "transactions": return db.transaction.findMany({ where, select, take: 500, orderBy: { date: "desc" } });
    case "hifz": return db.hifzRecord.findMany({ where, select, take: 500, orderBy: { recordedAt: "desc" } });
    case "attendance": return db.attendance.findMany({ where, select, take: 500, orderBy: { date: "desc" } });
    case "fees": return db.feeCollection.findMany({ where, select, take: 500, orderBy: { createdAt: "desc" } });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  const body = await req.json().catch(() => ({})) as Body;

  const entity = body.entity;
  if (!entity || !COLUMNS[entity]) return fail("Invalid entity");
  const reqCols = Array.isArray(body.columns) ? body.columns.filter((c) => COLUMNS[entity].includes(c)) : [];
  if (reqCols.length === 0) return fail("Select at least one column");
  const filters = Array.isArray(body.filters) ? body.filters.filter((f) => f && f.field && f.op && f.value !== "") : [];
  const format = body.format === "pdf" ? "pdf" : "json";

  const rows = await fetchEntity(session.tenantId, entity, reqCols, filters as Filter[]);

  if (format === "json") {
    return NextResponse.json({
      ok: true,
      data: {
        entity, columns: reqCols, count: rows.length,
        rows: rows.map((r) => {
          const out: Record<string, unknown> = {};
          for (const c of reqCols) out[c] = (r as Record<string, unknown>)[c];
          return out;
        }),
      },
    }, { headers: { "Cache-Control": "no-store" } });
  }

  // PDF
  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId }, select: { name: true } });
  const title = `Custom Report — ${entity}`;
  const ctx = await createPdfDoc(title, tenant?.name ?? "Madrasa");
  const headers = reqCols;
  const dataRows = rows.map((r) => reqCols.map((c) => fmt((r as Record<string, unknown>)[c])));
  const usableW = PAGE_W - MARGIN * 2;
  const colW = headers.map(() => Math.floor(usableW / headers.length));
  addTable(ctx, headers, dataRows, colW);
  const bytes = await finalizePdf(ctx);
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="report-${entity}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
