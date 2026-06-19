// POST /api/seed-extra — adds demo attendance + fee collection + exam data
// to make dashboards and reports look alive. Idempotent.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";

export async function POST(_req: NextRequest) {
  try {
    const tenant = await db.tenant.findFirst({
      where: { phone: "01700000000" },
    });
    if (!tenant) return fail("Demo tenant not found. Run /api/seed first.", 404);

    const students = await db.student.findMany({
      where: { tenantId: tenant.id, isActive: true },
      select: { id: true, classId: true, isZakatEligible: true },
    });
    if (students.length === 0) return fail("No students found.", 404);

    const feeStructures = await db.feeStructure.findMany({
      where: { tenantId: tenant.id },
    });

    let attendanceAdded = 0;
    let feesAdded = 0;
    let examsAdded = 0;

    // ===== Seed attendance for last 14 days =====
    const existingAtt = await db.attendance.count({
      where: { tenantId: tenant.id, personType: "student" },
    });

    if (existingAtt === 0) {
      const adminUser = await db.user.findFirst({
        where: { tenantId: tenant.id },
      });
      const markedBy = adminUser?.id;
      const statuses = ["present", "present", "present", "present", "present", "late", "absent", "leave"];

      for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
        const date = new Date();
        date.setDate(date.getDate() - dayOffset);
        date.setHours(0, 0, 0, 0);
        if (date.getDay() === 5) continue; // skip Friday

        for (const student of students) {
          const idx = (dayOffset + student.id.charCodeAt(0)) % statuses.length;
          await db.attendance.create({
            data: {
              tenantId: tenant.id,
              personId: student.id,
              personType: "student",
              date,
              status: statuses[idx],
              markedBy,
            },
          });
          attendanceAdded++;
        }
      }
    }

    // ===== Seed fee collections for last 6 months =====
    const existingFees = await db.feeCollection.count({
      where: { tenantId: tenant.id },
    });

    if (existingFees === 0) {
      const methods = ["cash", "bkash", "nagad", "bank"];
      const tuitionFee = feeStructures.find((f) => f.type === "tuition");

      for (const student of students) {
        for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
          const paidDate = new Date();
          paidDate.setMonth(paidDate.getMonth() - monthOffset);
          paidDate.setDate(10 + (student.id.charCodeAt(0) % 10));

          const isPaid = (monthOffset + student.id.charCodeAt(0)) % 5 !== 0;
          const amount = 800 + (student.id.charCodeAt(0) % 500);

          await db.feeCollection.create({
            data: {
              tenantId: tenant.id,
              studentId: student.id,
              feeStructureId: tuitionFee?.id ?? null,
              amount,
              paidAmount: isPaid ? amount : 0,
              dueDate: new Date(paidDate.getFullYear(), paidDate.getMonth(), 10),
              paidDate: isPaid ? paidDate : null,
              status: isPaid ? "paid" : monthOffset === 0 ? "overdue" : "pending",
              method: isPaid ? methods[student.id.charCodeAt(0) % methods.length] : null,
              notes: isPaid ? null : "Pending payment",
            },
          });
          feesAdded++;
        }
      }
    }

    // ===== Seed exam results =====
    const existingExams = await db.exam.count({
      where: { tenantId: tenant.id },
    });

    if (existingExams === 0) {
      const exam = await db.exam.create({
        data: {
          tenantId: tenant.id,
          name: "Mid-term Examination 2026",
          term: "first",
          startDate: new Date(2026, 5, 15),
          endDate: new Date(2026, 5, 20),
        },
      });

      const subjects = ["Quran", "Hadith", "Fiqh", "Arabic", "Bangla"];
      for (const student of students.slice(0, 10)) {
        for (const subject of subjects) {
          const marks = 60 + Math.floor(Math.random() * 40);
          const grade = marks >= 90 ? "A+" : marks >= 80 ? "A" : marks >= 70 ? "B" : marks >= 60 ? "C" : "D";
          await db.examResult.create({
            data: {
              examId: exam.id,
              studentId: student.id,
              subject,
              marks,
              total: 100,
              grade,
              remarks: marks >= 80 ? "Excellent" : marks >= 70 ? "Good" : "Needs improvement",
            },
          });
          examsAdded++;
        }
      }
    }

    return ok({
      message: "Extra demo data seeded successfully",
      stats: { attendanceAdded, feesAdded, examsAdded, totalStudents: students.length },
    });
  } catch (e) {
    console.error("[seed-extra]", e);
    return fail("Seed-extra failed: " + (e instanceof Error ? e.message : "unknown"), 500);
  }
}
