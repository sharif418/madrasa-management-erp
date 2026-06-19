// POST /api/seed-modules — populate demo data for all new domain modules
// Idempotent — checks if data already exists before creating.
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
      select: { id: true, name: true, classId: true, gender: true },
    });
    if (students.length === 0) return fail("No students found.", 404);

    const teachers = await db.teacher.findMany({
      where: { tenantId: tenant.id, isActive: true },
      select: { id: true, name: true, salary: true },
    });

    const counts: Record<string, number> = {};

    // ===== HOSTEL =====
    if ((await db.hostel.count({ where: { tenantId: tenant.id } })) === 0) {
      const hostel = await db.hostel.create({
        data: { tenantId: tenant.id, name: "Darul Iqbal Hostel", wardenTeacherId: teachers[0]?.id },
      });
      const block = await db.hostelBlock.create({ data: { hostelId: hostel.id, name: "Block A" } });
      const floor = await db.hostelFloor.create({ data: { blockId: block.id, level: 1 } });
      let bedCount = 0;
      for (let r = 1; r <= 6; r++) {
        const room = await db.hostelRoom.create({
          data: { floorId: floor.id, roomNumber: `10${r}`, capacity: 4 },
        });
        for (let b = 1; b <= 4; b++) {
          const bed = await db.bed.create({
            data: { roomId: room.id, bedNumber: `${room.roomNumber}-${b}`, status: "vacant" },
          });
          bedCount++;
          const studentIdx = (r - 1) * 4 + (b - 1);
          if (studentIdx < students.length && studentIdx < 10) {
            await db.bedAllocation.create({
              data: { bedId: bed.id, studentId: students[studentIdx].id, tenantId: tenant.id },
            });
            await db.bed.update({ where: { id: bed.id }, data: { status: "occupied" } });
          }
        }
      }
      counts.hostels = 1;
      counts.beds = bedCount;
    }

    // ===== MESS MENUS (7 days) =====
    if ((await db.messMenu.count({ where: { tenantId: tenant.id } })) === 0) {
      const meals = ["breakfast", "lunch", "dinner", "snacks"];
      const menuItems: Record<string, string> = {
        breakfast: "Ruti, Dal, Egg, Tea",
        lunch: "Rice, Chicken Curry, Vegetables, Salad",
        dinner: "Rice, Fish Curry, Dal, Vegetables",
        snacks: "Biscuits, Tea, Fruits",
      };
      let messCount = 0;
      for (let d = 0; d < 7; d++) {
        const date = new Date();
        date.setDate(date.getDate() + d);
        date.setHours(0, 0, 0, 0);
        for (const meal of meals) {
          await db.messMenu.create({
            data: { tenantId: tenant.id, date, mealType: meal, items: menuItems[meal], headcount: 15 + Math.floor(Math.random() * 10) },
          });
          messCount++;
        }
      }
      counts.messMenus = messCount;
    }

    // ===== GATE PASSES =====
    if ((await db.gatePass.count({ where: { tenantId: tenant.id } })) === 0 && students.length > 0) {
      for (let i = 0; i < 5; i++) {
        await db.gatePass.create({
          data: {
            tenantId: tenant.id, studentId: students[i].id,
            reason: ["Family visit", "Medical checkup", "Personal work", "Weekend leave", "Document collection"][i],
            outTime: new Date(Date.now() - i * 3600000),
            status: i < 3 ? "used" : "approved", guardianNotified: true,
          },
        });
      }
      counts.gatePasses = 5;
    }

    // ===== VISITORS =====
    if ((await db.visitor.count({ where: { tenantId: tenant.id } })) === 0) {
      const visitorData = [
        { name: "Abdul Karim", phone: "01811111111", purpose: "Visiting son" },
        { name: "Fatima Begum", phone: "01822222222", purpose: "Delivering clothes" },
        { name: "Maulana Yahya", phone: "01833333333", purpose: "Parent meeting" },
      ];
      for (const v of visitorData) {
        await db.visitor.create({
          data: {
            tenantId: tenant.id, name: v.name, phone: v.phone, purpose: v.purpose,
            visitingStudentId: students[Math.floor(Math.random() * students.length)].id,
            checkIn: new Date(Date.now() - Math.floor(Math.random() * 86400000)),
            checkOut: Math.random() > 0.5 ? new Date() : null,
          },
        });
      }
      counts.visitors = visitorData.length;
    }

    // ===== MUHASABA (14 days for 10 students) =====
    if ((await db.muhasabaRecord.count({ where: { tenantId: tenant.id } })) === 0) {
      const salahStates = ["jamaat", "alone", "qadha", "pending"];
      let muCount = 0;
      for (const student of students.slice(0, 10)) {
        for (let d = 0; d < 14; d++) {
          const date = new Date();
          date.setDate(date.getDate() - d);
          date.setHours(0, 0, 0, 0);
          await db.muhasabaRecord.create({
            data: {
              tenantId: tenant.id, studentId: student.id, date,
              fajr: salahStates[Math.floor(Math.random() * 4)],
              dhuhr: salahStates[Math.floor(Math.random() * 4)],
              asr: salahStates[Math.floor(Math.random() * 4)],
              maghrib: salahStates[Math.floor(Math.random() * 4)],
              isha: salahStates[Math.floor(Math.random() * 4)],
              tahajjud: Math.random() > 0.7,
              quranRecitation: Math.random() > 0.3,
              morningAdhkar: Math.random() > 0.4,
              eveningAdhkar: Math.random() > 0.5,
              sadaqah: Math.random() > 0.6,
              akhlaqRating: 3 + Math.floor(Math.random() * 3),
              teacherNote: Math.random() > 0.8 ? "Good progress in character" : null,
            },
          });
          muCount++;
        }
      }
      counts.muhasaba = muCount;
    }

    // ===== LIBRARY BOOKS =====
    if ((await db.book.count({ where: { tenantId: tenant.id } })) === 0) {
      const bookData = [
        { title: "Tafsir Ibn Kathir", titleArabic: "تفسير ابن كثير", author: "Ibn Kathir", category: "tafsir", copies: 5 },
        { title: "Sahih al-Bukhari", titleArabic: "صحيح البخاري", author: "Imam Bukhari", category: "hadith", copies: 3 },
        { title: "Sahih Muslim", titleArabic: "صحيح مسلم", author: "Imam Muslim", category: "hadith", copies: 3 },
        { title: "Al-Hidayah", titleArabic: "الهداية", author: "Al-Marghinani", category: "fiqh", copies: 4 },
        { title: "Al-Ajurrumiyyah", titleArabic: "الآجرومية", author: "Ibn Ajurrum", category: "nahw", copies: 10 },
        { title: "Al-Mughni", titleArabic: "المغني", author: "Ibn Qudamah", category: "fiqh", copies: 2 },
        { title: "Bulugh al-Maram", titleArabic: "بلوغ المرام", author: "Ibn Hajar", category: "hadith", copies: 6 },
        { title: "Riyad as-Saliheen", titleArabic: "رياض الصالحين", author: "Imam Nawawi", category: "literature", copies: 8 },
      ];
      for (const b of bookData) {
        await db.book.create({
          data: {
            tenantId: tenant.id, title: b.title, titleArabic: b.titleArabic, author: b.author,
            category: b.category, totalCopies: b.copies, availableCopies: b.copies,
            shelfLocation: `Shelf-${b.category.toUpperCase().slice(0, 3)}`,
          },
        });
      }
      counts.books = bookData.length;
      // Create some lendings
      let lendCount = 0;
      for (let i = 0; i < 5; i++) {
        const book = await db.book.findFirst({ where: { tenantId: tenant.id }, skip: i, take: 1 });
        if (book && students[i]) {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 14);
          await db.bookLending.create({
            data: { tenantId: tenant.id, bookId: book.id, studentId: students[i].id, borrowerName: students[i].name, dueDate, status: "borrowed" },
          });
          await db.book.update({ where: { id: book.id }, data: { availableCopies: { decrement: 1 } } });
          lendCount++;
        }
      }
      counts.lendings = lendCount;
    }

    // ===== DONORS + DONATIONS =====
    if ((await db.donor.count({ where: { tenantId: tenant.id } })) === 0) {
      const donorData = [
        { name: "Sheikh Abdul Rahman", country: "Saudi Arabia", type: "recurring", fund: "zakat", amount: 50000 },
        { name: "Al-Falah Foundation", country: "Bangladesh", type: "organization", fund: "lillah", amount: 120000 },
        { name: "Mohammed Yusuf", country: "United Arab Emirates", type: "individual", fund: "waqf", amount: 30000 },
        { name: "Islamic Relief UK", country: "United Kingdom", type: "organization", fund: "sadaqah", amount: 80000 },
        { name: "Brother Ibrahim", country: "Malaysia", type: "recurring", fund: "general", amount: 15000 },
        { name: "Sister Aisha", country: "United States", type: "individual", fund: "zakat", amount: 25000 },
        { name: "Qatar Charity", country: "Qatar", type: "organization", fund: "lillah", amount: 95000 },
      ];
      for (const d of donorData) {
        const donor = await db.donor.create({
          data: {
            tenantId: tenant.id, name: d.name, country: d.country, type: d.type,
            preferredFund: d.fund, totalContributed: d.amount, contributionCount: 1,
            isRecurring: d.type === "recurring",
            firstDonation: new Date(Date.now() - 90 * 86400000),
            lastDonation: new Date(Date.now() - 7 * 86400000),
          },
        });
        await db.donation.create({
          data: {
            tenantId: tenant.id, donorId: donor.id, donorName: d.name,
            amount: d.amount, fund: d.fund, paymentMethod: "bank",
            status: "confirmed", date: new Date(Date.now() - 7 * 86400000),
          },
        });
      }
      counts.donors = donorData.length;
      counts.donations = donorData.length;
    }

    // ===== CALENDAR EVENTS =====
    if ((await db.calendarEvent.count({ where: { tenantId: tenant.id } })) === 0) {
      const events = [
        { title: "Shab-e-Barat Program", titleArabic: "ليلة البراءة", type: "islamic", daysAhead: 3, highlighted: true },
        { title: "Mid-term Examination", type: "exam", daysAhead: 7, location: "Exam Hall" },
        { title: "Ramadan Begins", titleArabic: "رمضان المبارك", type: "islamic", daysAhead: 20, highlighted: true },
        { title: "Parent-Teacher Meeting", type: "meeting", daysAhead: 5, location: "Auditorium", audience: "parents" },
        { title: "Admission Open House", type: "admission", daysAhead: 10, audience: "all" },
        { title: "Result Publication", type: "result", daysAhead: 14, audience: "all" },
        { title: "Annual Sports Day", type: "event", daysAhead: 25, location: "Playground" },
        { title: "Eid-ul-Fitr Holiday", titleArabic: "عيد الفطر", type: "holiday", daysAhead: 30, highlighted: true },
      ];
      for (const e of events) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + e.daysAhead);
        await db.calendarEvent.create({
          data: {
            tenantId: tenant.id, title: e.title, titleArabic: e.titleArabic,
            type: e.type, startDate, isAllDay: true,
            location: (e as { location?: string }).location, audience: (e as { audience?: string }).audience || "all",
            isHighlighted: e.highlighted || false,
          },
        });
      }
      counts.calendarEvents = events.length;
    }

    // ===== ASSETS + INVENTORY =====
    if ((await db.asset.count({ where: { tenantId: tenant.id } })) === 0) {
      const assetData = [
        { name: "Prayer Rugs (Set of 50)", category: "furniture", cost: 15000, value: 12000, condition: "good", location: "Prayer Hall" },
        { name: "Whiteboard (Large)", category: "furniture", cost: 5000, value: 4000, condition: "good", location: "Classroom 1" },
        { name: "Projector", category: "equipment", cost: 35000, value: 28000, condition: "excellent", location: "Auditorium" },
        { name: "Kitchen Stove (Industrial)", category: "kitchen", cost: 45000, value: 38000, condition: "good", location: "Mess Kitchen" },
        { name: "Computer (Desktop)", category: "it", cost: 30000, value: 22000, condition: "fair", location: "Office" },
      ];
      for (const a of assetData) {
        await db.asset.create({
          data: {
            tenantId: tenant.id, name: a.name, category: a.category,
            purchaseCost: a.cost, currentValue: a.value, condition: a.condition,
            location: a.location, status: "in_use", purchaseDate: new Date(2022, 0, 1),
          },
        });
      }
      counts.assets = assetData.length;
    }
    if ((await db.inventoryItem.count({ where: { tenantId: tenant.id } })) === 0) {
      const invData = [
        { name: "Notebooks", category: "stationery", qty: 200, min: 50, cost: 30 },
        { name: "Pens", category: "stationery", qty: 15, min: 50, cost: 10 },
        { name: "Rice (kg)", category: "kitchen", qty: 150, min: 30, cost: 55 },
        { name: "Cooking Oil (L)", category: "kitchen", qty: 25, min: 20, cost: 180 },
        { name: "Cleaning Solution (L)", category: "cleaning", qty: 8, min: 15, cost: 120 },
        { name: "First Aid Kit", category: "medical", qty: 5, min: 3, cost: 500 },
      ];
      for (const i of invData) {
        await db.inventoryItem.create({
          data: {
            tenantId: tenant.id, name: i.name, category: i.category,
            quantity: i.qty, minStock: i.min, unitCost: i.cost,
            lastRestock: new Date(Date.now() - 15 * 86400000),
          },
        });
      }
      counts.inventoryItems = invData.length;
    }

    // ===== FEEDBACK =====
    if ((await db.feedback.count({ where: { tenantId: tenant.id } })) === 0) {
      const feedbackData = [
        { type: "complaint", category: "mess", subject: "Food quality concern", desc: "The rice has been undercooked for the past few days.", by: "Abdul Hakim", role: "parent", priority: "medium", status: "open" },
        { type: "suggestion", category: "academic", subject: "More Arabic grammar classes", desc: "Requesting additional Nahw classes for senior students.", by: "Maulana Yusuf", role: "staff", priority: "low", status: "in_review" },
        { type: "appreciation", category: "staff", subject: "Excellent teaching", desc: "Maulana Ibrahim's Tafsir classes are outstanding.", by: "Grateful Parent", role: "parent", priority: "low", status: "resolved", rating: 5 },
        { type: "grievance", category: "residential", subject: "Room maintenance needed", desc: "Room 104 has a leaking ceiling during rain.", by: "Concerned Guardian", role: "parent", priority: "high", status: "open" },
      ];
      for (const f of feedbackData) {
        await db.feedback.create({
          data: {
            tenantId: tenant.id, type: f.type, category: f.category,
            subject: f.subject, description: f.desc, submittedBy: f.by,
            submitterRole: f.role, priority: f.priority, status: f.status,
            rating: (f as { rating?: number }).rating,
            resolvedAt: f.status === "resolved" ? new Date() : null,
          },
        });
      }
      counts.feedback = feedbackData.length;
    }

    // ===== HEALTH RECORDS + VACCINATIONS =====
    if ((await db.healthRecord.count({ where: { tenantId: tenant.id } })) === 0) {
      const healthData = [
        { type: "checkup", desc: "Routine annual checkup", diag: "Healthy", sev: "mild" },
        { type: "illness", desc: "Fever and cold", diag: "Viral fever", treat: "Rest + paracetamol", sev: "moderate" },
        { type: "allergy", desc: "Dust allergy", diag: "Allergic rhinitis", treat: "Antihistamine", sev: "mild" },
        { type: "injury", desc: "Sports injury - ankle sprain", diag: "Grade 1 sprain", treat: "Rest + ice", sev: "moderate" },
        { type: "dental", desc: "Toothache", diag: "Cavity", treat: "Filling recommended", sev: "mild" },
      ];
      for (let i = 0; i < healthData.length && i < students.length; i++) {
        const h = healthData[i];
        await db.healthRecord.create({
          data: {
            tenantId: tenant.id, studentId: students[i].id,
            recordType: h.type, description: h.desc, diagnosis: h.diag,
            treatment: h.treat, severity: h.sev, status: "treated",
            date: new Date(Date.now() - i * 5 * 86400000),
          },
        });
      }
      const vaccines = ["BCG", "OPV", "DPT", "MMR", "Hepatitis B"];
      for (let i = 0; i < 10 && i < students.length; i++) {
        await db.vaccination.create({
          data: {
            tenantId: tenant.id, studentId: students[i].id,
            vaccineName: vaccines[i % vaccines.length],
            doseNumber: 1, dateAdministered: new Date(Date.now() - 30 * 86400000),
            nextDue: new Date(Date.now() + 335 * 86400000),
            administeredBy: "Dr. Ahmed",
          },
        });
      }
      counts.healthRecords = healthData.length;
      counts.vaccinations = Math.min(10, students.length);
    }

    // ===== TRANSPORT =====
    if ((await db.vehicle.count({ where: { tenantId: tenant.id } })) === 0) {
      const vehicles = [
        { reg: "Dhaka-Metro-GA-11-1234", type: "bus", cap: 40, driver: "Karim Uddin", phone: "01911111111", route: "Mirpur Route" },
        { reg: "Dhaka-Metro-GA-11-5678", type: "bus", cap: 35, driver: "Jamal Hossain", phone: "01922222222", route: "Uttara Route" },
        { reg: "Dhaka-Metro-GA-11-9012", type: "minibus", cap: 20, driver: "Rahim Mia", phone: "01933333333", route: "Mohammadpur Route" },
      ];
      for (const v of vehicles) {
        await db.vehicle.create({
          data: {
            tenantId: tenant.id, registration: v.reg, type: v.type, capacity: v.cap,
            driverName: v.driver, driverPhone: v.phone, routeName: v.route,
          },
        });
      }
      const routes = [
        { name: "Mirpur Route", start: "Mirpur 10", end: "Madrasa", dist: 12, fee: 800, stops: ["Mirpur 10", "Mirpur 11", "Kazipara", "Shewrapara"] },
        { name: "Uttara Route", start: "Uttara Sector 7", end: "Madrasa", dist: 18, fee: 1200, stops: ["Sector 7", "Sector 11", "Airport", "Khilkhet"] },
        { name: "Mohammadpur Route", start: "Mohammadpur", end: "Madrasa", dist: 8, fee: 600, stops: ["Mohammadpur Bus Stand", "Asad Gate", "Farmgate"] },
      ];
      for (const r of routes) {
        await db.transportRoute.create({
          data: {
            tenantId: tenant.id, name: r.name, startPoint: r.start, endPoint: r.end,
            distanceKm: r.dist, monthlyFee: r.fee, stops: JSON.stringify(r.stops),
          },
        });
      }
      const dbVehicles = await db.vehicle.findMany({ where: { tenantId: tenant.id } });
      const dbRoutes = await db.transportRoute.findMany({ where: { tenantId: tenant.id } });
      for (let i = 0; i < 8 && i < students.length; i++) {
        await db.transportAllocation.create({
          data: {
            tenantId: tenant.id, studentId: students[i].id,
            vehicleId: dbVehicles[i % dbVehicles.length].id,
            routeId: dbRoutes[i % dbRoutes.length].id,
            pickupPoint: JSON.parse(dbRoutes[i % dbRoutes.length].stops)[0],
          },
        });
      }
      counts.vehicles = vehicles.length;
      counts.routes = routes.length;
      counts.allocations = Math.min(8, students.length);
    }

    // ===== ADMISSION APPLICATIONS =====
    if ((await db.admissionApplication.count({ where: { tenantId: tenant.id } })) === 0) {
      const apps = [
        { name: "Mohammed Ayaan", father: "Rafiqul Islam", phone: "01611111111", level: "Ibtedayi", status: "pending" },
        { name: "Abdullah Rahman", father: "Jahangir Alam", phone: "01622222222", level: "Hifz", status: "reviewing", interview: true },
        { name: "Fatima Zahra", father: "Mohammed Ali", phone: "01633333333", level: "Mutawassitah", status: "approved" },
        { name: "Yusuf Khan", father: "Salman Khan", phone: "01644444444", level: "Ibtedayi", status: "enrolled" },
        { name: "Aisha Siddiqua", father: "Karim Sheikh", phone: "01655555555", level: "Hifz", status: "pending" },
      ];
      for (const a of apps) {
        await db.admissionApplication.create({
          data: {
            tenantId: tenant.id, applicantName: a.name, fatherName: a.father,
            guardianPhone: a.phone, appliedLevel: a.level, status: a.status,
            gender: "male",
            interviewDate: a.interview ? new Date(Date.now() + 3 * 86400000) : null,
            applicationDate: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000),
          },
        });
      }
      counts.admissions = apps.length;
    }

    // ===== ALUMNI =====
    if ((await db.alumni.count({ where: { tenantId: tenant.id } })) === 0) {
      const alumniData = [
        { name: "Maulana Ismail Hossain", year: 2015, level: "Dawra-e-Hadith", occ: "Imam", org: "Baitul Mukarram Mosque", city: "Dhaka", country: "Bangladesh", mentor: true },
        { name: "Maulana Tariq Jamil", year: 2018, level: "Fazilat", occ: "Teacher", org: "Jamia Islamia", city: "Chittagong", country: "Bangladesh", mentor: true },
        { name: "Hafiz Abdul Rahman", year: 2020, level: "Hifz", occ: "Higher Studies", org: "Islamic University Madinah", city: "Madinah", country: "Saudi Arabia", mentor: false },
        { name: "Maulana Yusuf Ali", year: 2016, level: "Dawra-e-Hadith", occ: "Business", org: "Al-Noor Trading", city: "Sylhet", country: "Bangladesh", mentor: false },
        { name: "Qari Mohammed Sinan", year: 2019, level: "Fazilat", occ: "Qari", org: "Qirat Institute", city: "London", country: "United Kingdom", mentor: true },
        { name: "Maulana Ibrahim Khalil", year: 2014, level: "Dawra-e-Hadith", occ: "Teacher", org: "Darul Uloom Deoband", city: "Deoband", country: "India", mentor: true },
        { name: "Hafiz Hamza Ahmed", year: 2021, level: "Hifz", occ: "Higher Studies", org: "Al-Azhar University", city: "Cairo", country: "Egypt", mentor: false },
        { name: "Maulana Sadiq Rahman", year: 2017, level: "Fazilat", occ: "Imam", org: "East London Mosque", city: "London", country: "United Kingdom", mentor: true },
      ];
      for (const a of alumniData) {
        await db.alumni.create({
          data: {
            tenantId: tenant.id, name: a.name, graduationYear: a.year,
            graduatedLevel: a.level, currentOccupation: a.occ, organization: a.org,
            currentCity: a.city, currentCountry: a.country,
            isMentor: a.mentor, isActive: true,
          },
        });
      }
      counts.alumni = alumniData.length;
    }

    return ok({ message: "Module demo data seeded successfully", counts });
  } catch (e) {
    console.error("[seed-modules]", e);
    return fail("Seed-modules failed: " + (e instanceof Error ? e.message : "unknown"), 500);
  }
}
