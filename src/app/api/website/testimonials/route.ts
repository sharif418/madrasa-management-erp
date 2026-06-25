import { createCrudHandlers } from "@/lib/crud";
export const { GET, POST } = createCrudHandlers({
  model: "websiteTestimonial", orderBy: { order: "asc" },
  searchFields: ["name", "content"], requiredFields: ["name", "role", "content"],
});
