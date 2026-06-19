// Library module — shared types & UI helpers
import type { LucideIcon } from "lucide-react";
import {
  BookOpen, Scale, BookMarked, Languages, PenTool, Library, BookText,
} from "lucide-react";

export type BookCategory =
  | "fiqh" | "tafsir" | "hadith" | "nahw" | "sarf" | "literature" | "other";

export type Book = {
  id: string;
  title: string;
  titleArabic: string | null;
  author: string | null;
  category: string;
  isbn: string | null;
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string | null;
  description: string | null;
  createdAt: string;
};

export type Lending = {
  id: string;
  bookId: string;
  studentId: string | null;
  borrowerName: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: string;
  fine: number;
  book?: { title: string; titleArabic: string | null };
};

export type LibraryKpis = {
  totalTitles: number;
  totalCopies: number;
  availableCopies: number;
  borrowed: number;
  overdue: number;
};

// Map categories to color tints + icons for badges
export const CATEGORY_META: Record<string, { tint: string; dot: string; icon: LucideIcon }> = {
  fiqh: {
    tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    dot: "bg-emerald-500",
    icon: Scale,
  },
  tafsir: {
    tint: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
    dot: "bg-teal-500",
    icon: BookOpen,
  },
  hadith: {
    tint: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    dot: "bg-amber-500",
    icon: BookMarked,
  },
  nahw: {
    tint: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    dot: "bg-rose-500",
    icon: Languages,
  },
  sarf: {
    tint: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    dot: "bg-violet-500",
    icon: PenTool,
  },
  literature: {
    tint: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
    dot: "bg-cyan-500",
    icon: BookText,
  },
  other: {
    tint: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    dot: "bg-slate-500",
    icon: Library,
  },
};

export const CATEGORY_LIST: BookCategory[] = [
  "fiqh", "tafsir", "hadith", "nahw", "sarf", "literature", "other",
];

export function availabilityState(book: Pick<Book, "availableCopies" | "totalCopies">) {
  if (book.availableCopies <= 0) {
    return { key: "out", label: "outBadge", tint: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" };
  }
  if (book.availableCopies < book.totalCopies) {
    return { key: "partial", label: "partialBadge", tint: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" };
  }
  return { key: "available", label: "availableBadge", tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" };
}
