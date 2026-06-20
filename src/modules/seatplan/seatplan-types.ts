// Shared types for the Seat Plan module.
export type SeatAssignment = { seatNo: string; studentId: string };

export type SeatPlan = {
  id: string;
  examId: string;
  examName: string;
  classId: string | null;
  className: string | null;
  roomName: string;
  rows: number;
  cols: number;
  studentCount: number;
  assignments: SeatAssignment[];
  createdAt: string;
};

export type ExamOption = {
  id: string;
  name: string;
  term: string | null;
  startDate: string | null;
  endDate: string | null;
  classId: string | null;
  className: string | null;
};

export type ClassOption = { id: string; name: string };

export type StudentOption = {
  id: string;
  name: string;
  nameArabic: string | null;
  rollNo: string | null;
};
