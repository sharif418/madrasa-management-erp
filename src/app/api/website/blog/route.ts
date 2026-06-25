import { createCrudHandlers } from "@/lib/crud";
export const { GET, POST } = createCrudHandlers({
  model: "websiteBlogPost", orderBy: { createdAt: "desc" },
  searchFields: ["title", "content"], requiredFields: ["title", "slug", "content"],
});
