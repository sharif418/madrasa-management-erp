// POST /api/auth/signup — register a new madrasa (tenant) with super admin
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, slugify } from "@/lib/password";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { ok, fail } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const { madrasaName, phone, password, language = "bn" } = await req.json();
    if (!madrasaName || !phone || !password) {
      return fail("Madrasa name, phone, and password are required");
    }
    if (password.length < 6) return fail("Password must be at least 6 characters");

    // Check phone uniqueness globally (one phone = one admin across all tenants)
    const existing = await db.user.findFirst({ where: { phone } });
    if (existing) return fail("This phone number is already registered. Please login.");

    // Create tenant + admin user + super-admin role in a transaction
    const result = await db.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: madrasaName,
          subdomain: slugify(madrasaName),
          phone,
          language,
          plan: "trial",
          status: "active",
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          phone,
          name: "Super Admin",
          password: hashPassword(password),
        },
      });

      const role = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: "Super Admin",
          description: "Full access to all modules",
          permissions: JSON.stringify({ "*": ["*"] }),
          isSystem: true,
        },
      });

      await tx.userRole.create({
        data: { userId: user.id, roleId: role.id },
      });

      // Seed default funds
      const fundTypes = ["general", "lillah", "waqf", "zakat", "sadaqah"];
      const fundNames: Record<string, string> = {
        general: "General Fund", lillah: "Lillah Fund", waqf: "Waqf Fund",
        zakat: "Zakat Fund", sadaqah: "Sadaqah Fund",
      };
      for (const type of fundTypes) {
        await tx.fund.create({
          data: { tenantId: tenant.id, name: fundNames[type], type, balance: 0 },
        });
      }

      return { tenant, user };
    });

    const sessionUser = {
      userId: result.user.id,
      tenantId: result.tenant.id,
      name: result.user.name,
      phone: result.user.phone,
      roles: ["Super Admin"],
    };
    const token = await createSessionToken(sessionUser);
    await setSessionCookie(token);

    await recordAudit({
      session: sessionUser,
      action: "create",
      module: "tenant",
      entityId: result.tenant.id,
      entityName: result.tenant.name,
    });

    return ok({
      user: sessionUser,
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        language: result.tenant.language,
        theme: result.tenant.theme,
      },
    }, 201);
  } catch (e) {
    console.error("[signup]", e);
    return fail("Registration failed", 500);
  }
}
