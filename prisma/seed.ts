// Prisma Seed Script — Creates demo data for development/testing
// Run: npx prisma db seed
import { PrismaClient } from "@prisma/client";
import { createHmac, randomBytes, scryptSync } from "crypto";

const db = new PrismaClient();

// Password hasher (matches the app's session.ts logic)
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("🌱 Seeding Madrasa Manager database...\n");

  // ─── 1. Create Tenant ────────────────────────
  const tenant = await db.tenant.upsert({
    where: { subdomain: "demo-madrasa" },
    update: {},
    create: {
      name: "আল-হিদায়া মাদ্রাসা",
      subdomain: "demo-madrasa",
      phone: "01712345678",
      email: "info@alhidaya.edu.bd",
      address: "মিরপুর-১০, ঢাকা",
      currency: "BDT",
      language: "bn",
      theme: "emerald",
      plan: "pro",
      status: "active",
    },
  });
  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);

  // ─── 2. Create Roles ────────────────────────
  const roles = await Promise.all([
    db.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: "Super Admin" } },
      update: {},
      create: { tenantId: tenant.id, name: "Super Admin", isSystem: true, permissions: '{"all":["view","create","update","delete","export"]}' },
    }),
    db.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: "Teacher" } },
      update: {},
      create: { tenantId: tenant.id, name: "Teacher", isSystem: true, permissions: '{"students":["view"],"attendance":["view","create"],"hifz":["view","create","update"]}' },
    }),
    db.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: "Accountant" } },
      update: {},
      create: { tenantId: tenant.id, name: "Accountant", isSystem: true, permissions: '{"finance":["view","create","update"],"fees":["view","create","update"]}' },
    }),
  ]);
  console.log(`✅ Roles: ${roles.map((r) => r.name).join(", ")}`);

  // ─── 3. Create Admin User ────────────────────────
  const adminUser = await db.user.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: "01712345678" } },
    update: {},
    create: {
      tenantId: tenant.id,
      phone: "01712345678",
      name: "মোহাম্মদ আব্দুল্লাহ",
      email: "admin@alhidaya.edu.bd",
      password: hashPassword("admin123"),
      isActive: true,
    },
  });

  // Assign Super Admin role
  await db.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: roles[0].id } },
    update: {},
    create: { userId: adminUser.id, roleId: roles[0].id },
  });
  console.log(`✅ Admin User: ${adminUser.name} (${adminUser.phone})`);

  // ─── 4. Create Classes ────────────────────────
  const classNames = ["ইবতেদায়ী ১ম", "ইবতেদায়ী ২য়", "মুতাওয়াসসিতাহ ১ম", "মুতাওয়াসসিতাহ ২য়", "সানাবিয়্যাহ", "ফযীলত", "দাওরায়ে হাদীস", "হিফজ বিভাগ"];
  const classes = await Promise.all(
    classNames.map((name, i) =>
      db.class.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name } },
        update: {},
        create: { tenantId: tenant.id, name, section: "ক", capacity: 40 },
      })
    )
  );
  console.log(`✅ Classes: ${classes.length} created`);

  // ─── 5. Create Students ────────────────────────
  const studentData = [
    { name: "মুহাম্মদ ইব্রাহীম", rollNo: "2025-001", guardianName: "আব্দুর রহমান", guardianPhone: "01811111111" },
    { name: "আব্দুল্লাহ আল-মামুন", rollNo: "2025-002", guardianName: "মোঃ কামাল", guardianPhone: "01822222222" },
    { name: "মুহাম্মদ ইউসুফ", rollNo: "2025-003", guardianName: "আবু বকর", guardianPhone: "01833333333" },
    { name: "আহমাদ হাসান", rollNo: "2025-004", guardianName: "মোঃ হাসান", guardianPhone: "01844444444" },
    { name: "ওমর ফারুক", rollNo: "2025-005", guardianName: "খালিদ বিন ওয়ালিদ", guardianPhone: "01855555555" },
    { name: "মুসা আল-আশআরী", rollNo: "2025-006", guardianName: "আবু মুসা", guardianPhone: "01866666666" },
    { name: "বিলাল ইবন রাবাহ", rollNo: "2025-007", guardianName: "রাবাহ", guardianPhone: "01877777777" },
    { name: "সালমান ফারসী", rollNo: "2025-008", guardianName: "রুজবাহ", guardianPhone: "01888888888" },
  ];

  const students = await Promise.all(
    studentData.map((s, i) =>
      db.student.upsert({
        where: { tenantId_rollNo: { tenantId: tenant.id, rollNo: s.rollNo } },
        update: {},
        create: {
          tenantId: tenant.id,
          classId: classes[i % classes.length].id,
          ...s,
          gender: "male",
          status: "active",
          dateOfBirth: new Date(2010 + (i % 5), i % 12, 1 + i),
        },
      })
    )
  );
  console.log(`✅ Students: ${students.length} created`);

  // ─── 6. Create Funds ────────────────────────
  const funds = await Promise.all([
    db.fund.upsert({
      where: { id: "fund-general" },
      update: {},
      create: { id: "fund-general", tenantId: tenant.id, name: "সাধারণ তহবিল", type: "GENERAL", balance: 150000 },
    }),
    db.fund.upsert({
      where: { id: "fund-zakat" },
      update: {},
      create: { id: "fund-zakat", tenantId: tenant.id, name: "যাকাত তহবিল", type: "ZAKAT", balance: 75000 },
    }),
    db.fund.upsert({
      where: { id: "fund-lillah" },
      update: {},
      create: { id: "fund-lillah", tenantId: tenant.id, name: "লিল্লাহ তহবিল", type: "LILLAH", balance: 50000 },
    }),
  ]);
  console.log(`✅ Funds: ${funds.length} created`);

  // ─── 7. Create Website Settings ────────────────────────
  await db.websiteSetting.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      tagline: "ঈমান, ইলম ও আমলের পথে",
      primaryColor: "#059669",
      heroTitle: "আল-হিদায়া মাদ্রাসায় স্বাগতম",
      heroSubtitle: "১৯৮৫ সাল থেকে ইসলামি শিক্ষায় শ্রেষ্ঠত্ব",
      heroCtaText: "ভর্তির আবেদন করুন",
      welcomeTitle: "মুহতামিমের বাণী",
      welcomeBody: "আল-হিদায়া মাদ্রাসা ১৯৮৫ সাল থেকে ইসলামি শিক্ষায় অবদান রেখে চলেছে।",
      welcomeAuthor: "মাওলানা আব্দুল কাদের",
      welcomeAuthorRole: "মুহতামিম",
      showHijriDate: true,
      showPrayerTimes: true,
    },
  });
  console.log(`✅ Website Settings: configured`);

  console.log("\n🎉 Seeding complete! Login with: 01712345678 / admin123\n");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
