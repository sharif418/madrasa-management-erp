import { createCrudByIdHandlers } from "@/lib/crud";
export const { GET, PUT, DELETE } = createCrudByIdHandlers({
  model: "infirmaryRecord",
  include: { student: { select: { id: true, name: true, rollNo: true } } },
});
