// POST /api/seed-timetable — populate demo timetable slots
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";

export async function POST(_req: NextRequest) {
  try {
    const tenant = await db.tenant.findFirst({ where: { phone: "01700000000" } });
    if (!tenant) return fail("Demo tenant not found.", 404);

    const existing = await db.timetableSlot.count({ where: { tenantId: tenant.id } });
    if (existing > 0) return ok({ message: "Already seeded", count: existing });

    const classes = await db.class.findMany({ where: { tenantId: tenant.id }, take: 3 });
    const teachers = await db.teacher.findMany({ where: { tenantId: tenant.id }, take: 5 });
    if (classes.length === 0 || teachers.length === 0) {
      return fail("No classes or teachers found.", 404);
    }

    const days = ["sat", "sun", "mon", "tue", "wed", "thu"];
    const subjects = [
      { name: "Quran with Tajweed", room: "Prayer Hall" },
      { name: "Hifz", room: "Hifz Room" },
      { name: "Arabic Grammar (Nahw)", room: "Classroom 1" },
      { name: "Fiqh", room: "Classroom 2" },
      { name: "Hadith", room: "Classroom 1" },
      { name: "Tafsir", room: "Classroom 2" },
      { name: "Bangla", room: "Classroom 1" },
      { name: "English", room: "Classroom 2" },
      { name: "Mathematics", room: "Classroom 1" },
    ];

    const timeSlots = [
      { start: "06:00", end: "07:00" },
      { start: "07:30", end: "08:30" },
      { start: "08:30", end: "09:30" },
      { start: "09:30", end: "10:30" },
      { start: "11:00", end: "12:00" },
      { start: "14:00", end: "15:00" },
      { start: "15:00", end: "16:00" },
      { start: "16:00", end: "17:00" },
    ];

    let count = 0;
    for (const cls of classes) {
      for (const day of days) {
        for (let i = 0; i < timeSlots.length; i++) {
          const subject = subjects[(count + i) % subjects.length];
          const teacher = teachers[(count + i) % teachers.length];
          await db.timetableSlot.create({
            data: {
              tenantId: tenant.id,
              classId: cls.id,
              day,
              startTime: timeSlots[i].start,
              endTime: timeSlots[i].end,
              subject: subject.name,
              teacherId: teacher.id,
              room: subject.room,
            },
          });
          count++;
        }
      }
    }

    return ok({ message: "Timetable seeded successfully", count });
  } catch (e) {
    console.error("[seed-timetable]", e);
    return fail("Seed failed: " + (e instanceof Error ? e.message : "unknown"), 500);
  }
}
