// POST /api/seed — populate demo data for first-time users (no auth required)
// Creates a demo tenant "Darul Uloom Demo Madrasa" + admin user + sample students,
// teachers, classes, funds, hifz records, notices. Idempotent — safe to call multiple times.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { ok, fail } from "@/lib/api";

const DEMO_PHONE = "01700000000";
const DEMO_PASSWORD = "demo123";

export async function POST(_req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'Seed routes are disabled in production' }, { status: 403 });
  }
  try {
    // Find or create demo tenant
    let tenant = await db.tenant.findFirst({
      where: { phone: DEMO_PHONE },
    });

    if (!tenant) {
      tenant = await db.tenant.create({
        data: {
          name: "Darul Uloom Demo Madrasa",
          subdomain: "darul-ulum-demo",
          phone: DEMO_PHONE,
          email: "demo@madrasa-manager.app",
          address: "123 Madrasa Road, Dhaka, Bangladesh",
          currency: "BDT",
          language: "bn",
          theme: "emerald",
          plan: "trial",
          status: "active",
        },
      });

      const admin = await db.user.create({
        data: {
          tenantId: tenant.id,
          phone: DEMO_PHONE,
          name: "Demo Admin",
          password: hashPassword(DEMO_PASSWORD),
        },
      });

      const role = await db.role.create({
        data: {
          tenantId: tenant.id,
          name: "Super Admin",
          description: "Full access",
          permissions: JSON.stringify({ "*": ["*"] }),
          isSystem: true,
        },
      });
      await db.userRole.create({ data: { userId: admin.id, roleId: role.id } });

      // Funds
      const fundTypes = [
        { name: "General Fund", type: "general", balance: 125000 },
        { name: "Lillah Fund", type: "lillah", balance: 85000 },
        { name: "Waqf Fund", type: "waqf", balance: 200000 },
        { name: "Zakat Fund", type: "zakat", balance: 75000 },
        { name: "Sadaqah Fund", type: "sadaqah", balance: 32000 },
      ];
      const funds = await Promise.all(
        fundTypes.map((f) =>
          db.fund.create({ data: { ...f, tenantId: tenant.id } })
        )
      );

      // Classes
      const classData = [
        { name: "Maktab - Level 1", code: "MK1", curriculum: "qawmi", level: 1, capacity: 30 },
        { name: "Maktab - Level 2", code: "MK2", curriculum: "qawmi", level: 2, capacity: 30 },
        { name: "Hifz - Level 1", code: "HF1", curriculum: "qawmi", level: 3, capacity: 25 },
        { name: "Hifz - Level 2", code: "HF2", curriculum: "qawmi", level: 4, capacity: 25 },
        { name: "Alia - Class 6", code: "AL6", curriculum: "alia", level: 6, capacity: 40 },
      ];
      const classes = await Promise.all(
        classData.map((c) =>
          db.class.create({ data: { ...c, tenantId: tenant.id } })
        )
      );

      // Subjects
      const subjectData = [
        { name: "Quran with Tajweed", type: "quranic" },
        { name: "Hifz", type: "quranic" },
        { name: "Hadith", type: "academic" },
        { name: "Fiqh", type: "academic" },
        { name: "Tafsir", type: "academic" },
        { name: "Arabic Language", type: "arabic" },
        { name: "Bangla", type: "general" },
        { name: "English", type: "general" },
        { name: "Mathematics", type: "general" },
      ];
      await Promise.all(
        subjectData.map((s) =>
          db.subject.create({
            data: { ...s, tenantId: tenant.id, classId: classes[0].id },
          })
        )
      );

      // Teachers
      const teachers = [
        { name: "Maulana Abdul Rahman", nameArabic: "مولانا عبد الرحمن", phone: "01711111111", designation: "Mudarris", specialization: "hifz", salary: 18000 },
        { name: "Maulana Yusuf Ahmed", nameArabic: "مولانا يوسف أحمد", phone: "01711111112", designation: "Ustadh", specialization: "fiqh", salary: 15000 },
        { name: "Maulana Ibrahim Khalil", nameArabic: "مولانا إبراهيم خليل", phone: "01711111113", designation: "Shaykh", specialization: "tafsir", salary: 22000 },
        { name: "Maulana Sadiq Rahman", nameArabic: "مولانا صادق رحمن", phone: "01711111114", designation: "Ustadh", specialization: "arabic", salary: 14000 },
        { name: "Maulana Fazlul Karim", nameArabic: "مولانا فضل الكريم", phone: "01711111115", designation: "Mudarris", specialization: "hifz", salary: 17000 },
      ];
      await Promise.all(
        teachers.map((t) =>
          db.teacher.create({
            data: {
              ...t,
              tenantId: tenant.id,
              gender: "male",
              joinDate: new Date(2020, 0, 1),
            },
          })
        )
      );

      // Students — Bangla names with variety
      const bnNames = [
        "Abdullah Al Mamun", "Muhammad Yahya", "Ibrahim Hossain", "Yusuf Ali",
        "Abdul Karim", "Rahim Uddin", "Khalid Saifullah", "Bilal Ahmed",
        "Hamza Rahman", "Umar Faruq", "Ali Akbar", "Hasan Mahmud",
        "Fatima Begum", "Aisha Siddiqua", "Khadija Akter", "Maryam Sultana",
        "Zainab Khatun", "Hafsa Rahman", "Sumaiya Akter", "Amina Begum",
      ];
      const guardians = ["Father", "Mother", "Uncle", "Guardian"];
      const students = await Promise.all(
        bnNames.map(async (name, i) => {
          const isHafiz = i < 5;
          const isZakat = i >= 12 && i < 16;
          const cls = classes[i % classes.length];
          const s = await db.student.create({
            data: {
              tenantId: tenant.id,
              rollNo: `R${String(i + 1).padStart(3, "0")}`,
              name,
              nameArabic: name.startsWith("Ab") ? "عبد الله" : undefined,
              gender: i < 12 ? "male" : "female",
              dob: new Date(2010 + (i % 5), i % 12, (i % 28) + 1),
              phone: `0171${String(i).padStart(7, "0")}`,
              guardianName: `Guardian of ${name.split(" ")[0]}`,
              guardianPhone: `0172${String(i).padStart(7, "0")}`,
              guardianRelation: guardians[i % guardians.length],
              address: `Village ${i + 1}, Dhaka`,
              bloodGroup: ["A+", "B+", "O+", "AB+", "O-"][i % 5],
              classId: cls.id,
              isHafiz,
              isZakatEligible: isZakat,
              isActive: true,
              admissionDate: new Date(2023, i % 12, 15),
            },
          });
          // Wallet
          await db.wallet.create({
            data: {
              tenantId: tenant.id,
              studentId: s.id,
              balance: isZakat ? 500 : Math.floor(Math.random() * 1500),
            },
          });
          return s;
        })
      );

      // Hifz records for hafiz students
      const hifzTypes = ["sabak", "sabaq_para", "dhor"];
      const surahs = ["Al-Fatiha", "Al-Baqarah", "Aal-E-Imran", "An-Nisa", "Al-Maidah"];
      for (const s of students.slice(0, 10)) {
        const recordsToCreate = 3 + Math.floor(Math.random() * 5);
        for (let i = 0; i < recordsToCreate; i++) {
          await db.hifzRecord.create({
            data: {
              tenantId: tenant.id,
              studentId: s.id,
              teacherId: admin.id,
              type: hifzTypes[i % 3],
              paraNumber: 1 + (i % 30),
              surahName: surahs[i % surahs.length],
              ayahFrom: 1 + i * 5,
              ayahTo: 5 + i * 5,
              qualityRating: 3 + (i % 3),
              mistakesCount: i % 4,
              notes: i % 2 === 0 ? "Good progress" : "Needs improvement",
              status: i % 4 === 0 ? "revision" : "completed",
              recordedAt: new Date(Date.now() - i * 86400000),
            },
          });
        }
      }

      // Transactions
      const txTypes = ["income", "expense", "income", "income", "expense"];
      const categories = ["donation", "salary", "fee", "maintenance", "donation"];
      for (let i = 0; i < 15; i++) {
        const fund = funds[i % funds.length];
        const type = txTypes[i % txTypes.length];
        const amount = 1000 + Math.floor(Math.random() * 20000);
        await db.transaction.create({
          data: {
            tenantId: tenant.id,
            fundId: fund.id,
            amount,
            type,
            category: categories[i % categories.length],
            description: `${type} for ${fund.name}`,
            paymentMethod: ["cash", "bkash", "nagad", "bank"][i % 4],
            date: new Date(Date.now() - i * 86400000 * 2),
          },
        });
        // Update fund balance
        await db.fund.update({
          where: { id: fund.id },
          data: {
            balance: {
              increment: type === "income" ? amount : type === "expense" ? -amount : 0,
            },
          },
        });
      }

      // Notices
      const noticeData = [
        { title: "Annual Exam Schedule Published", content: "The annual examination will start from next month. All students are advised to prepare accordingly.", type: "exam", audience: "all" },
        { title: "Holiday Notice - Eid Milad", content: "The madrasa will remain closed on the occasion of Eid Milad-un-Nabi.", type: "holiday", audience: "all" },
        { title: "Parent-Teacher Meeting", content: "A parent-teacher meeting is scheduled for this Friday at 10 AM.", type: "event", audience: "guardians" },
        { title: "New Hifz Class Starting", content: "A new Hifz class for beginners will start from next week. Interested parents please contact the office.", type: "general", audience: "all" },
        { title: "Urgent: Fee Submission", content: "All students are requested to submit their monthly fees by the 10th of every month.", type: "urgent", audience: "guardians" },
      ];
      await Promise.all(
        noticeData.map((n) =>
          db.notice.create({ data: { ...n, tenantId: tenant.id } })
        )
      );
    }

    return ok({
      message: "Demo data seeded successfully",
      credentials: { phone: DEMO_PHONE, password: DEMO_PASSWORD },
      tenantName: tenant.name,
    });
  } catch (e) {
    console.error("[seed]", e);
    return fail("Seed failed: " + (e instanceof Error ? e.message : "unknown"), 500);
  }
}
