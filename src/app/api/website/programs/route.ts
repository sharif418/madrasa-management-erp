// Website CMS — Programs CRUD
import { createCrudHandlers } from "@/lib/crud";
export const { GET, POST } = createCrudHandlers({
  model: "websiteProgram",
  orderBy: { order: "asc" },
  searchFields: ["title", "titleArabic"],
  requiredFields: ["title", "description", "curriculum"],
});
