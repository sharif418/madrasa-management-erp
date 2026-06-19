// Shared types & constants for the Academic module (Classes & Subjects)
export type Curriculum = "qawmi" | "alia";
export type SubjectType = "academic" | "quranic" | "arabic" | "general";

export const CURRICULA: Curriculum[] = ["qawmi", "alia"];
export const SUBJECT_TYPES: SubjectType[] = [
  "academic",
  "quranic",
  "arabic",
  "general",
];

export type ClassDTO = {
  id: string;
  name: string;
  code: string | null;
  curriculum: Curriculum;
  level: number;
  capacity: number;
  teacherId: string | null;
  createdAt: string;
  _count?: { students: number };
};

export type SubjectDTO = {
  id: string;
  name: string;
  code: string | null;
  type: SubjectType;
  classId: string | null;
  createdAt: string;
  class?: { id: string; name: string } | null;
};

export type ClassOption = { id: string; name: string };

export type ClassFormValues = {
  name: string;
  code: string;
  curriculum: Curriculum;
  level: number | string;
  capacity: number | string;
};

export type SubjectFormValues = {
  name: string;
  code: string;
  type: SubjectType;
  classId: string; // "" => null
};

export const EMPTY_CLASS_FORM: ClassFormValues = {
  name: "",
  code: "",
  curriculum: "qawmi",
  level: 1,
  capacity: 40,
};

export const EMPTY_SUBJECT_FORM: SubjectFormValues = {
  name: "",
  code: "",
  type: "academic",
  classId: "",
};

// Badge color mapping for curriculum
export const CURRICULUM_BADGE: Record<Curriculum, string> = {
  qawmi: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  alia: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
};

// Badge color mapping for subject type
export const SUBJECT_TYPE_BADGE: Record<SubjectType, string> = {
  academic: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  quranic: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  arabic: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  general: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

// Gradient header per curriculum for class cards
export const CURRICULUM_GRADIENT: Record<Curriculum, string> = {
  qawmi: "from-emerald-500 to-teal-600",
  alia: "from-violet-500 to-purple-600",
};
