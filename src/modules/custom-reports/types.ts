// Shared types + column metadata for the custom report builder.
export type EntityType = "students" | "teachers" | "transactions" | "hifz" | "attendance" | "fees";

export type Filter = {
  field: string;
  op: "equals" | "contains" | "gt" | "lt";
  value: string;
};

export type ReportRequest = {
  entity: EntityType;
  columns: string[];
  filters: Filter[];
  format: "json" | "pdf";
};

// Allowed columns per entity (matches server-side whitelist).
export const ENTITY_COLUMNS: Record<EntityType, string[]> = {
  students: ["name", "nameArabic", "rollNo", "gender", "dob", "phone", "guardianName", "guardianPhone", "address", "bloodGroup", "isHafiz", "isActive", "admissionDate"],
  teachers: ["name", "nameArabic", "phone", "email", "gender", "designation", "specialization", "salary", "joinDate", "isActive", "address"],
  transactions: ["amount", "type", "category", "description", "paymentMethod", "date", "fundId"],
  hifz: ["type", "paraNumber", "surahName", "ayahFrom", "ayahTo", "qualityRating", "mistakesCount", "status", "recordedAt"],
  attendance: ["personType", "date", "status", "notes"],
  fees: ["amount", "paidAmount", "dueDate", "paidDate", "status", "method", "notes"],
};

export type EntityOption = {
  key: EntityType;
  iconKey: "students" | "teachers" | "transactions" | "hifz" | "attendance" | "fees";
};
