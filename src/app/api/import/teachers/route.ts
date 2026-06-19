// POST /api/import/teachers — bulk import teachers from a CSV file upload.
// Accepts multipart/form-data with field "file" containing the CSV.
// CSV columns (header row required):
//   name, nameArabic, phone, email, gender, designation, specialization,
//   salary, joinDate, address
import { db } from "@/lib/db";
import { ok, fail, unauthorized, auditAfter } from "@/lib/api";
import { getSession } from "@/lib/session";
import { csvToObjects, pick } from "@/lib/csv";

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB
const SPECIALIZATIONS = new Set(["hifz", "fiqh", "tafsir", "arabic", "general"]);

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

  let success = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNo = i + 2; // header is row 1
    const name = pick(r, "name", "Name", "teacherName").trim();
    if (!name) {
      errors.push({ row: rowNo, message: "Name is required" });
      continue;
    }

    const joinStr = pick(r, "joinDate", "JoinDate", "join").trim();
    let joinDate = new Date();
    if (joinStr) {
      const d = new Date(joinStr);
      if (isNaN(d.getTime())) {
        errors.push({ row: rowNo, message: `Invalid joinDate "${joinStr}"` });
        continue;
      }
      joinDate = d;
    }

    const salaryStr = pick(r, "salary", "Salary").trim();
    let salary = 0;
    if (salaryStr) {
      salary = Number(salaryStr);
      if (!Number.isFinite(salary) || salary < 0) {
        errors.push({ row: rowNo, message: `Invalid salary "${salaryStr}"` });
        continue;
      }
    }

    const spec = pick(r, "specialization", "Specialization").trim().toLowerCase();
    const specialization = spec && SPECIALIZATIONS.has(spec) ? spec : null;
    const gender = pick(r, "gender", "Gender").trim().toLowerCase() === "female" ? "female" : "male";

    try {
      await db.teacher.create({
        data: {
          tenantId: session.tenantId,
          name,
          nameArabic: pick(r, "nameArabic", "arabicName").trim() || null,
          phone: pick(r, "phone", "Phone").trim() || null,
          email: pick(r, "email", "Email").trim() || null,
          gender,
          designation: pick(r, "designation", "Designation").trim() || null,
          specialization,
          salary,
          joinDate,
          address: pick(r, "address", "Address").trim() || null,
        },
      });
      success++;
    } catch (e) {
      errors.push({
        row: rowNo,
        message: e instanceof Error ? e.message : "Failed to create teacher",
      });
    }
  }

  await auditAfter(session, {
    action: "create",
    module: "teachers",
    entityName: "Bulk teacher import",
    details: { total: rows.length, success, errors: errors.length, source: "csv" },
  });

  return ok({ success, errors, total: rows.length });
}
