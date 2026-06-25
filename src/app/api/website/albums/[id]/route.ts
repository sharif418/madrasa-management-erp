import { createCrudByIdHandlers } from "@/lib/crud";
export const { GET, PUT, DELETE } = createCrudByIdHandlers({ model: "websiteAlbum", include: { photos: true } });
