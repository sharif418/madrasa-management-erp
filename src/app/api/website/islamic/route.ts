import { createCrudHandlers } from "@/lib/crud";
export const { GET, POST } = createCrudHandlers({
  model: "websiteIslamicResource", orderBy: { displayDate: "desc" },
  searchFields: ["translation", "reference"], requiredFields: ["type", "translation", "reference"],
});
