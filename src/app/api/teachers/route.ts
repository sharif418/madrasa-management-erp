// Teachers & Staff collection API
// GET  /api/teachers        — list (paginated, search, specialization filter)
// POST /api/teachers        — create teacher (audit recorded)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized, auditAfter } from "@/lib/api";

const SPECIALIZATIONS = ["hifz", "fiqh", "tafsir", "arabic", "general"];

type ListResponse = {
  items: TeacherListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type TeacherListItem = {
  id: string;
  name: string;
  nameArabic: string | null;
  phone: string | null;
  email: string | null;
  gender: string;
  designation: string | null;
  specialization: string | null;
  salary: number;
  joinDate: string;
  isActive: boolean;
  photoUrl: string | null;
  address: string | null;
};

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const url = req.nextUrl;
  const search = (url.searchParams.get("search") || "").trim();
  const specialization = url.searchParams.get("specialization") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10) || 20)
  );

  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (specialization && SPECIALIZATIONS.includes(specialization)) {
    where.specialization = specialization;
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { nameArabic: { contains: search } },
      { phone: { contains: search } },
      { email: { contains: search } },
      { designation: { contains: search } },
    ];
  }

  const [total, rows] = await Promise.all([
    db.teacher.count({ where }),
    db.teacher.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { name: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const items: TeacherListItem[] = rows.map((t) => ({
    id: t.id,
    name: t.name,
    nameArabic: t.nameArabic,
    phone: t.phone,
    email: t.email,
    gender: t.gender,
    designation: t.designation,
    specialization: t.specialization,
    salary: t.salary,
    joinDate: t.joinDate.toISOString(),
    isActive: t.isActive,
    photoUrl: t.photoUrl,
    address: t.address,
  }));

  const data: ListResponse = {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
  return ok(data);
}

type CreateInput = {
  name?: string;
  nameArabic?: string;
  phone?: string;
  email?: string;
  gender?: string;
  designation?: string;
  specialization?: string;
  salary?: number;
  joinDate?: string;
  address?: string;
  photoUrl?: string;
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as CreateInput;
  const name = (body.name || "").trim();
  if (!name) return fail("Name is required");
  if (!body.joinDate) return fail("Join date is required");

  const salary = typeof body.salary === "number" ? body.salary : Number(body.salary);
  if (Number.isNaN(salary)) return fail("Invalid salary");

  const gender = body.gender === "female" ? "female" : "male";
  const specialization =
    body.specialization && SPECIALIZATIONS.includes(body.specialization)
      ? body.specialization
      : null;

  const teacher = await db.teacher.create({
    data: {
      tenantId: session.tenantId,
      name,
      nameArabic: (body.nameArabic || "").trim() || null,
      phone: (body.phone || "").trim() || null,
      email: (body.email || "").trim() || null,
      gender,
      designation: (body.designation || "").trim() || null,
      specialization,
      salary,
      joinDate: new Date(body.joinDate),
      address: (body.address || "").trim() || null,
      photoUrl: (body.photoUrl || "").trim() || null,
    },
  });

  await auditAfter(session, {
    action: "create",
    module: "teachers",
    entityId: teacher.id,
    entityName: teacher.name,
    details: { name, designation: teacher.designation, specialization },
  });

  return ok(teacher, 201);
}
