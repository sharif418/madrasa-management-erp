import { createCrudHandlers } from "@/lib/crud";
export const { GET, POST } = createCrudHandlers({
  model: "websiteFounder", orderBy: { order: "asc" },
  searchFields: ["name", "nameArabic"], requiredFields: ["name", "role"],
});
