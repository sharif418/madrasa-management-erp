// POST /api/import/students — bulk import students from a CSV file upload.
// Accepts multipart/form-data with field "file" containing the CSV.
// CSV columns (header row required):
//   name, nameArabic, rollNo, gender, phone, guardianName, guardianPhone,
//   guardianRelation, address, bloodGroup, className
// For each row: validates name; looks up class by name within tenant;
// creates student + wallet (balance 0). Skips rows that fail validation.
import { db } from "@/lib/db";
import { ok, fail, unauthorized, auditAfter } from "@/lib/api";
import { getSession } from "@/lib/session";
import { csvToObjects, pick } from "@/lib/csv";

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();

  const form = await req.formData().catch(() => null);
  if (!form) return fail("Expected multipart/form-data with a CSV file");
  const file = form.get("file");
  if (!(file instanceof File)) return fail("No file uploaded (field name must be 'file')");
  if (file.size === 0) return fail("Uploaded file is empty");
  if (file.size > MAX_FILE_BYTES) return fail("File too large (max 2 MB)");

  const text = await file.text();
  const rows = csvToObjects(text);
  if (rows.length === 0) return fail("CSV has no data rows (only header?)");

  // Cache classes by name within this tenant to avoid N+1 queries.
  const classes = await db.class.findMany({
    where: { tenantId: session.tenantId },
    select: { id: true, name: true },
  });
  const classByName = new Map<string, string>();
  for (const c of classes) classByName.set(c.name.trim().toLowerCase(), c.id);

  let success = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNo = i + 2; // header is row 1
    const name = pick(r, "name", "Name", "studentName").trim();
    if (!name) {
      errors.push({ row: rowNo, message: "Name is required" });
      continue;
    }

    const className = pick(r, "className", "class", "ClassName").trim();
    let classId: string | null = null;
    if (className) {
      classId = classByName.get(className.toLowerCase()) ?? null;
      if (!classId) {
        errors.push({ row: rowNo, message: `Class "${className}" not found` });
        continue;
      }
    }

    const rollNo = pick(r, "rollNo", "RollNo", "roll").trim() || null;
    if (rollNo) {
      const dup = await db.student.findFirst({
        where: { tenantId: session.tenantId, rollNo },
        select: { id: true },
      });
      if (dup) {
        errors.push({ row: rowNo, message: `Roll No "${rollNo}" already exists` });
        continue;
      }
    }

    const gender = pick(r, "gender", "Gender").trim().toLowerCase() === "female" ? "female" : "male";

    try {
      await db.$transaction(async (tx) => {
        const created = await tx.student.create({
          data: {
            tenantId: session.tenantId,
            name,
            nameArabic: pick(r, "nameArabic", "arabicName").trim() || null,
            rollNo,
            gender,
            phone: pick(r, "phone", "Phone").trim() || null,
            guardianName: pick(r, "guardianName", "GuardianName").trim() || null,
            guardianPhone: pick(r, "guardianPhone", "GuardianPhone").trim() || null,
            guardianRelation: pick(r, "guardianRelation", "GuardianRelation").trim() || null,
            address: pick(r, "address", "Address").trim() || null,
            bloodGroup: pick(r, "bloodGroup", "BloodGroup").trim() || null,
            classId,
          },
        });
        await tx.wallet.create({
          data: { studentId: created.id, tenantId: session.tenantId, balance: 0 },
        });
      });
      success++;
    } catch (e) {
      errors.push({
        row: rowNo,
        message: e instanceof Error ? e.message : "Failed to create student",
      });
    }
  }

  await auditAfter(session, {
    action: "create",
    module: "students",
    entityName: "Bulk student import",
    details: { total: rows.length, success, errors: errors.length, source: "csv" },
  });

  return ok({ success, errors, total: rows.length });
}
