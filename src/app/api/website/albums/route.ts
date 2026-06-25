import { createCrudHandlers } from "@/lib/crud";
export const { GET, POST } = createCrudHandlers({
  model: "websiteAlbum",
  orderBy: { createdAt: "desc" },
  include: { photos: true },
  searchFields: ["title"],
  requiredFields: ["title"],
});
