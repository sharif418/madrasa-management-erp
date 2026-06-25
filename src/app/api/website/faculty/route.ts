import { createCrudHandlers } from "@/lib/crud";
export const { GET, POST } = createCrudHandlers({
  model: "websiteFaculty",
  orderBy: { order: "asc" },
  searchFields: ["name", "nameArabic", "designation"],
  requiredFields: ["name", "designation", "subjects"],
});
