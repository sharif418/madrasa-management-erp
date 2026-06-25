// GET/POST /api/infirmary — In-campus medical visit tracking
import { createCrudHandlers } from "@/lib/crud";
export const { GET, POST } = createCrudHandlers({
  model: "infirmaryRecord",
  orderBy: { visitedAt: "desc" },
  include: { student: { select: { id: true, name: true, rollNo: true, class: { select: { name: true } } } } },
  searchFields: ["symptoms", "diagnosis", "doctorName"],
  requiredFields: ["studentId", "symptoms"],
});
