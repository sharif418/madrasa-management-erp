// Shared types & constants for the Teachers module
export type Specialization = "hifz" | "fiqh" | "tafsir" | "arabic" | "general";
export type Designation = "ustadh" | "mudarris" | "shaykh" | "staff";
export type Gender = "male" | "female";

export const SPECIALIZATIONS: Specialization[] = [
  "hifz",
  "fiqh",
  "tafsir",
  "arabic",
  "general",
];

export const DESIGNATIONS: Designation[] = ["ustadh", "mudarris", "shaykh", "staff"];

export type TeacherDTO = {
  id: string;
  name: string;
  nameArabic: string | null;
  phone: string | null;
  email: string | null;
  gender: string;
  designation: string | null;
  specialization: string | null;
  salary: number;
  joinDate: string;
  isActive: boolean;
  photoUrl: string | null;
  address: string | null;
};

export type TeacherListResponse = {
  items: TeacherDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type TeacherFormValues = {
  name: string;
  nameArabic: string;
  phone: string;
  email: string;
  gender: Gender;
  designation: string;
  specialization: Specialization | "";
  salary: number | string;
  joinDate: string; // yyyy-mm-dd
  address: string;
  photoUrl: string;
  isActive: boolean;
};

export const EMPTY_FORM: TeacherFormValues = {
  name: "",
  nameArabic: "",
  phone: "",
  email: "",
  gender: "male",
  designation: "ustadh",
  specialization: "general",
  salary: 0,
  joinDate: new Date().toISOString().slice(0, 10),
  address: "",
  photoUrl: "",
  isActive: true,
};

// Build initials from a name (e.g. "Abdul Karim" -> "AK")
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Deterministic gradient class for an avatar based on the name
// Restricted to the emerald/teal/cyan/amber Islamic palette (no purple/pink/rose/indigo)
const AVATAR_GRADIENTS = [
  "from-emerald-500 to-teal-600",
  "from-teal-500 to-cyan-600",
  "from-cyan-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-lime-500 to-emerald-600",
  "from-green-500 to-teal-600",
  "from-emerald-600 to-cyan-700",
  "from-amber-400 to-amber-600",
];

export function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}
