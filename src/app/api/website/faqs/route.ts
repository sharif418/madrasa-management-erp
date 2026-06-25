import { createCrudHandlers } from "@/lib/crud";
export const { GET, POST } = createCrudHandlers({
  model: "websiteFAQ", orderBy: { order: "asc" },
  searchFields: ["question", "answer"], requiredFields: ["question", "answer"],
});
