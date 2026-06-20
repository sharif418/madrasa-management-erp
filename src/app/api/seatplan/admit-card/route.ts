// POST /api/seatplan/admit-card — generates printable admit cards PDF.
// Body: { examId, studentIds: string[] }. A4 portrait, 1 card per page.
// Latin-only (StandardFonts). Tenant-scoped. RBAC: exams:export. Audit logged.
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { unauthorized, fail, forbidden, auditAfter } from "@/lib/api";
import { checkPermission } from "@/lib/permissions";
import { buildAdmitCardPdf, asciiArabic, type AdmitCard } from "@/lib/pdf-admit-card";

type SeatAssign = { seatNo: string; studentId: string };

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (!(await checkPermission(session, "exams", "export")))
    return forbidden("You don't have permission to export admit cards");

  const body = await req.json().catch(() => ({})) as {
    examId?: string; studentIds?: string[];
  };
  if (!body.examId || typeof body.examId !== "string") return fail("Exam id is required");
  const ids = Array.isArray(body.studentIds)
    ? body.studentIds.filter((x) => typeof x === "string")
    : [];
  if (ids.length === 0) return fail("No students selected");

  const [tenant, exam, students, seatPlans, subjects] = await Promise.all([
    db.tenant.findUnique({
      where: { id: session.tenantId },
      select: { name: true, address: true, phone: true },
    }),
    db.exam.findFirst({
      where: { id: body.examId, tenantId: session.tenantId },
      select: { id: true, name: true, startDate: true, endDate: true, classId: true },
    }),
    db.student.findMany({
      where: { id: { in: ids }, tenantId: session.tenantId },
      select: {
        id: true, name: true, nameArabic: true, rollNo: true,
        class: { select: { name: true } },
      },
    }),
    db.seatPlan.findMany({
      where: { examId: body.examId, tenantId: session.tenantId },
      select: { roomName: true, assignments: true },
    }),
    db.subject.findMany({
      where: { tenantId: session.tenantId },
      select: { name: true, classId: true },
    }),
  ]);
  if (!exam) return fail("Exam not found", 404);
  if (students.length === 0) return fail("No matching students found");

  // Build seat lookup: studentId -> { seatNo, roomName }
  const seatMap = new Map<string, { seatNo: string; roomName: string }>();
  for (const sp of seatPlans) {
    let arr: SeatAssign[] = [];
    try { arr = JSON.parse(sp.assignments || "[]") as SeatAssign[]; } catch { arr = []; }
    for (const a of arr) {
      if (!seatMap.has(a.studentId)) {
        seatMap.set(a.studentId, { seatNo: a.seatNo, roomName: sp.roomName });
      }
    }
  }

  // Subjects: prefer those tied to exam's class; fallback to all
  const subjList = exam.classId
    ? subjects.filter((s) => s.classId === exam.classId).map((s) => s.name)
    : subjects.slice(0, 8).map((s) => s.name);
  const finalSubjects = subjList.length > 0 ? subjList : ["All subjects of class"];

  const cards: AdmitCard[] = students.map((s) => {
    const seat = seatMap.get(s.id);
    return {
      studentName: s.name,
      nameArabic: asciiArabic(s.nameArabic),
      rollNo: s.rollNo,
      className: s.class?.name ?? null,
      seatNo: seat?.seatNo ?? null,
      roomName: seat?.roomName ?? "—",
    };
  });

  try {
    const pdfBytes = await buildAdmitCardPdf(
      tenant?.name || "Madrasa",
      tenant?.address || "",
      tenant?.phone || "",
      exam.name,
      exam.startDate,
      exam.endDate,
      finalSubjects,
      cards,
    );
    await auditAfter(session, {
      action: "export",
      module: "exams",
      entityName: `Admit Cards PDF — ${exam.name} (${cards.length} cards)`,
      details: { examId: exam.id, count: cards.length },
    });
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="admit-cards-${exam.id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[admit-card] build failed:", e);
    return fail(e instanceof Error ? e.message : "PDF generation failed", 500);
  }
}
