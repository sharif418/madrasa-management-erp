// Generic CRUD helper for tenant-scoped models
// Reduces boilerplate for simple CRUD API routes.
import { withSession, ok, fail, notFound } from "@/lib/api";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/session";

type CrudOptions = {
  model: string;
  orderBy?: Record<string, "asc" | "desc">;
  include?: Record<string, boolean | object>;
  searchFields?: string[];
  requiredFields?: string[];
};

export function createCrudHandlers(opts: CrudOptions) {
  const model = (db as any)[opts.model];

  const GET = withSession(async ({ session, req }) => {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);

    const where: any = { tenantId: session.tenantId };

    if (search && opts.searchFields?.length) {
      where.OR = opts.searchFields.map((f) => ({
        [f]: { contains: search, mode: "insensitive" },
      }));
    }

    const [items, total] = await Promise.all([
      model.findMany({
        where,
        orderBy: opts.orderBy || { createdAt: "desc" },
        include: opts.include,
        skip: (page - 1) * limit,
        take: limit,
      }),
      model.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  });

  const POST = withSession(async ({ session, req }) => {
    const body = await req.json();

    if (opts.requiredFields) {
      for (const f of opts.requiredFields) {
        if (!body[f]) return fail(`${f} is required`);
      }
    }

    const { id, tenantId, createdAt, updatedAt, ...data } = body;
    const item = await model.create({
      data: { ...data, tenantId: session.tenantId },
      include: opts.include,
    });
    return item;
  });

  return { GET, POST };
}

export function createCrudByIdHandlers(opts: CrudOptions) {
  const model = (db as any)[opts.model];

  const GET = withSession(async ({ session, params }) => {
    const item = await model.findFirst({
      where: { id: params?.id, tenantId: session.tenantId },
      include: opts.include,
    });
    if (!item) return notFound();
    return item;
  });

  const PUT = withSession(async ({ session, req, params }) => {
    const existing = await model.findFirst({
      where: { id: params?.id, tenantId: session.tenantId },
    });
    if (!existing) return notFound();

    const body = await req.json();
    const { id, tenantId, createdAt, updatedAt, ...data } = body;
    const item = await model.update({
      where: { id: params?.id },
      data,
      include: opts.include,
    });
    return item;
  });

  const DELETE = withSession(async ({ session, params }) => {
    const existing = await model.findFirst({
      where: { id: params?.id, tenantId: session.tenantId },
    });
    if (!existing) return notFound();
    await model.delete({ where: { id: params?.id } });
    return { deleted: true };
  });

  return { GET, PUT, DELETE };
}
