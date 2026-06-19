// Alumni module shared types
export type Alumni = {
  id: string;
  name: string;
  nameArabic: string | null;
  graduationYear: number;
  graduatedLevel: string | null;
  rollNumber: string | null;
  currentOccupation: string | null;
  organization: string | null;
  currentCity: string | null;
  currentCountry: string;
  phone: string | null;
  email: string | null;
  linkedin: string | null;
  achievements: string | null;
  isActive: boolean;
  isMentor: boolean;
};

export type AlumniData = {
  items: Alumni[];
  kpis: { total: number; mentors: number; countries: number };
  years: { year: string; count: number }[];
};
