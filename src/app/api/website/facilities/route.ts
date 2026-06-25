import { createCrudHandlers } from "@/lib/crud";
export const { GET, POST } = createCrudHandlers({
  model: "websiteFacility", orderBy: { order: "asc" },
  searchFields: ["title"], requiredFields: ["title", "description"],
});
