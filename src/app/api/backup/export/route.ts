// GET /api/backup/export — full tenant data backup as a JSON file.
// RBAC: settings:update (no separate export perm — reuse update).
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { forbidden, unauthorized } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  const allowed = await checkPermission(session, "settings", "update");
  if (!allowed) return forbidden("No permission to export backup");

  const tid = session.tenantId;
  const [
    tenant, students, teachers, classes, subjects, hifzRecords, funds,
    transactions, wallets, feeStructures, feeCollections, feeWaivers,
    attendance, exams, examResults, notices, muhasabaRecords, books,
    bookLendings, donors, donations, calendarEvents, assets, inventoryItems,
    vehicles, transportRoutes, hostels, messMenus, gatePasses, visitors,
    admissionApplications, alumni, notifications, quranLogs, seatPlans,
    ptmSessions, timetableSlots, settings, websitePages,
  ] = await Promise.all([
    db.tenant.findUnique({ where: { id: tid } }),
    db.student.findMany({ where: { tenantId: tid } }),
    db.teacher.findMany({ where: { tenantId: tid } }),
    db.class.findMany({ where: { tenantId: tid } }),
    db.subject.findMany({ where: { tenantId: tid } }),
    db.hifzRecord.findMany({ where: { tenantId: tid } }),
    db.fund.findMany({ where: { tenantId: tid } }),
    db.transaction.findMany({ where: { tenantId: tid } }),
    db.wallet.findMany({ where: { tenantId: tid } }),
    db.feeStructure.findMany({ where: { tenantId: tid } }),
    db.feeCollection.findMany({ where: { tenantId: tid } }),
    db.feeWaiver.findMany({ where: { tenantId: tid } }),
    db.attendance.findMany({ where: { tenantId: tid } }),
    db.exam.findMany({ where: { tenantId: tid } }),
    db.examResult.findMany({
      where: { exam: { tenantId: tid } },
    }),
    db.notice.findMany({ where: { tenantId: tid } }),
    db.muhasabaRecord.findMany({ where: { tenantId: tid } }),
    db.book.findMany({ where: { tenantId: tid } }),
    db.bookLending.findMany({ where: { tenantId: tid } }),
    db.donor.findMany({ where: { tenantId: tid } }),
    db.donation.findMany({ where: { tenantId: tid } }),
    db.calendarEvent.findMany({ where: { tenantId: tid } }),
    db.asset.findMany({ where: { tenantId: tid } }),
    db.inventoryItem.findMany({ where: { tenantId: tid } }),
    db.vehicle.findMany({ where: { tenantId: tid } }),
    db.transportRoute.findMany({ where: { tenantId: tid } }),
    db.hostel.findMany({ where: { tenantId: tid } }),
    db.messMenu.findMany({ where: { tenantId: tid } }),
    db.gatePass.findMany({ where: { tenantId: tid } }),
    db.visitor.findMany({ where: { tenantId: tid } }),
    db.admissionApplication.findMany({ where: { tenantId: tid } }),
    db.alumni.findMany({ where: { tenantId: tid } }),
    db.notification.findMany({ where: { tenantId: tid } }),
    db.quranLog.findMany({ where: { tenantId: tid } }),
    db.seatPlan.findMany({ where: { tenantId: tid } }),
    db.ptmSession.findMany({ where: { tenantId: tid } }),
    db.timetableSlot.findMany({ where: { tenantId: tid } }),
    db.setting.findMany({ where: { tenantId: tid } }),
    db.websitePage.findMany({ where: { tenantId: tid } }),
  ]);

  await recordAudit({
    session,
    action: "export",
    module: "settings",
    entityName: "Backup export",
    details: { students: students.length, teachers: teachers.length },
  });

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    exportedBy: session.name,
    tenant: tenant ? {
      id: tenant.id, name: tenant.name, subdomain: tenant.subdomain,
      phone: tenant.phone, email: tenant.email, address: tenant.address,
      currency: tenant.currency, language: tenant.language, theme: tenant.theme,
      plan: tenant.plan, status: tenant.status,
    } : null,
    data: {
      students, teachers, classes, subjects, hifzRecords, funds,
      transactions, wallets, feeStructures, feeCollections, feeWaivers,
      attendance, exams, examResults, notices, muhasabaRecords, books,
      bookLendings, donors, donations, calendarEvents, assets, inventoryItems,
      vehicles, transportRoutes, hostels, messMenus, gatePasses, visitors,
      admissionApplications, alumni, notifications, quranLogs, seatPlans,
      ptmSessions, timetableSlots, settings, websitePages,
    },
    counts: {
      students: students.length, teachers: teachers.length,
      transactions: transactions.length, hifzRecords: hifzRecords.length,
      attendance: attendance.length, feeCollections: feeCollections.length,
      donations: donations.length, books: books.length, notices: notices.length,
    },
  };

  const dateStr = new Date().toISOString().slice(0, 10);
  const json = JSON.stringify(payload, null, 2);
  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="backup-${dateStr}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
