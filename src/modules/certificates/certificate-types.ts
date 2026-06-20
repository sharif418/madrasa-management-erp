// Shared types for the Certificate Generator module
export type CertType = "completion" | "hifz" | "merit" | "participation";

export type CertStudent = {
  id: string;
  name: string;
  nameArabic: string | null;
  rollNo: string | null;
  className: string | null;
  classId: string | null;
  isHafiz: boolean;
  admissionDate: string | null;
};

export type CertTenant = {
  name: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
};

export type CertExam = {
  id: string;
  name: string;
  term: string | null;
  className: string | null;
  startDate: string | null;
};

export type CertificatesData = {
  tenant: CertTenant | null;
  students: CertStudent[];
  recentExams: CertExam[];
};
