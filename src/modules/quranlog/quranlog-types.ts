// Shared types for the Quran Reading Log module.
export type QuranLogItem = {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string | null;
  className: string | null;
  date: string; // ISO
  pagesRead: number;
  surahName: string | null;
  paraNumber: number | null;
  notes: string | null;
  createdAt: string;
};

export type QuranLogStats = {
  totalPages30: number;
  activeReaders: number;
  streakCount: number;
  dailyAvg: number;
  khatmCompletions: number;
};

export type QuranLogAggStats = {
  daily: { date: string; pages: number }[];
  topReaders: { studentId: string; studentName: string; className: string | null; total: number }[];
  classBreakdown: { name: string; pages: number }[];
  khatmCompletions: number;
  totalPages: number;
  activeReaders: number;
};

export const QURAN_TOTAL_PAGES = 604; // standard mushaf page count
