import { createCrudByIdHandlers } from "@/lib/crud";
export const { GET, PUT, DELETE } = createCrudByIdHandlers({ model: "websiteProgram" });
