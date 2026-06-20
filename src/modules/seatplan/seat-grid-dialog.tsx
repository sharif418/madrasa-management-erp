// SeatGridDialog — visual grid representation of a seat plan.
// Renders rows × cols cells; occupied seats show seat number + student name;
// empty seats render faded. Opens inside a Dialog (controlled by parent).
"use client";
import { useApp } from "@/store/app-store";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { SeatPlan, StudentOption } from "./seatplan-types";

type Props = {
  plan: SeatPlan | null;
  students: StudentOption[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function SeatGridDialog({ plan, students, open, onOpenChange }: Props) {
  const { t, dir } = useApp();
  if (!plan) return null;

  // Build seat lookup: seatNo -> student
  const seatStudent = new Map<string, StudentOption>();
  for (const a of plan.assignments) {
    const s = students.find((x) => x.id === a.studentId);
    if (s) seatStudent.set(a.seatNo, s);
  }

  // Build grid (rows × cols). Row letters: A, B, C...
  const rows = Array.from({ length: plan.rows }, (_, r) =>
    String.fromCharCode(65 + r));
  const cols = Array.from({ length: plan.cols }, (_, c) => c + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl" dir={dir()}>
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <span>{plan.examName}</span>
            <Badge variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
              {plan.roomName}
            </Badge>
            <Badge variant="outline">
              {plan.rows}×{plan.cols} · {plan.studentCount} {t("seatplan.students")}
            </Badge>
          </DialogTitle>
          <DialogDescription>{t("seatplan.viewGrid")}</DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Column headers */}
            <div className="flex gap-1.5 mb-1.5 ps-7">
              {cols.map((c) => (
                <div
                  key={c}
                  className="flex h-6 w-16 items-center justify-center text-[10px] font-semibold text-muted-foreground"
                >
                  {c}
                </div>
              ))}
            </div>

            {/* Rows */}
            <div className="space-y-1.5">
              {rows.map((rowLetter, rIdx) => (
                <div key={rowLetter} className="flex items-center gap-1.5">
                  <div className="flex h-12 w-6 items-center justify-center text-xs font-bold text-violet-600">
                    {rowLetter}
                  </div>
                  {cols.map((c) => {
                    const seatNo = `${rowLetter}${c}`;
                    const student = seatStudent.get(seatNo);
                    const occupied = !!student;
                    const seatIdx = rIdx * plan.cols + (c - 1);
                    const hasSeat = seatIdx < plan.assignments.length;
                    return (
                      <div
                        key={seatNo}
                        className={[
                          "h-12 w-16 rounded-md border flex flex-col items-center justify-center text-[10px] leading-tight",
                          occupied
                            ? "border-violet-300 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/40"
                            : hasSeat
                              ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
                              : "border-dashed border-border/60 bg-muted/30",
                        ].join(" ")}
                        title={student ? student.name : seatNo}
                      >
                        <span className="font-semibold text-violet-700 dark:text-violet-300">
                          {seatNo}
                        </span>
                        {student && (
                          <span className="text-[9px] text-muted-foreground max-w-full truncate px-1">
                            {student.name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-violet-300 bg-violet-50 dark:bg-violet-950/40" />
            Occupied
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-amber-300 bg-amber-50 dark:bg-amber-950/30" />
            Assigned (student not found)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-dashed border-border/60 bg-muted/30" />
            Empty
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
