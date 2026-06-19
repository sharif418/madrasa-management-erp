// Shared types for the Students module

export type Gender = "male" | "female";
export type GuardianRelation = "father" | "mother" | "uncle" | "other";

export type StudentClass = {
  id: string;
  name: string;
  code?: string | null;
  level?: number;
  curriculum?: string;
};

export type Wallet = {
  id: string;
  balance: number;
};

export type Student = {
  id: string;
  tenantId: string;
  rollNo: string | null;
  name: string;
  nameArabic: string | null;
  gender: Gender;
  dob: Date | string | null;
  phone: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianRelation: GuardianRelation | null;
  address: string | null;
  bloodGroup: string | null;
  photoUrl: string | null;
  classId: string | null;
  isHafiz: boolean;
  isZakatEligible: boolean;
  isActive: boolean;
  admissionDate: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  class?: StudentClass | null;
  wallet?: Wallet | null;
};

export type StudentDetail = Student & {
  hifzCount?: number;
  feeSummary?: {
    total: number;
    paid: number;
    due: number;
    count: number;
  };
};

export type StudentInput = {
  name: string;
  nameArabic?: string;
  rollNo?: string;
  gender?: Gender;
  dob?: string;
  phone?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelation?: GuardianRelation;
  address?: string;
  bloodGroup?: string;
  classId?: string;
  isHafiz?: boolean;
  isZakatEligible?: boolean;
  isActive?: boolean;
};

export type StudentListResponse = {
  items: Student[];
  total: number;
  page: number;
  limit: number;
};

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export const GUARDIAN_RELATIONS: GuardianRelation[] = ["father", "mother", "uncle", "other"];
