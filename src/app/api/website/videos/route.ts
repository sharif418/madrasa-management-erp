import { createCrudHandlers } from "@/lib/crud";
export const { GET, POST } = createCrudHandlers({
  model: "websiteVideo", orderBy: { createdAt: "desc" },
  searchFields: ["title", "description"], requiredFields: ["title", "youtubeId"],
});
