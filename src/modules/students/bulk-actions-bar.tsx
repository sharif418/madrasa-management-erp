"use client";
// BulkActionsBar — sticky bar shown when 1+ students selected.
// Triggers 3 dialogs: attendance / assignFee / promote + Clear selection.
import * as React from "react";
import { CalendarCheck, Wallet, ArrowUpCircle, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "./i18n";
import { BulkAttendanceDialog } from "./bulk-attendance-dialog";
import { BulkFeeDialog } from "./bulk-fee-dialog";
import { BulkPromoteDialog } from "./bulk-promote-dialog";

type DialogKey = "attendance" | "fee" | "promote" | null;

export function BulkActionsBar({
  selectedIds,
  onClear,
  onActionComplete,
}: {
  selectedIds: Set<string>;
  onClear: () => void;
  onActionComplete?: () => void;
}) {
  const t = useT();
  const [dialog, setDialog] = React.useState<DialogKey>(null);

  const count = selectedIds.size;
  if (count === 0) return null;

  const ids = Array.from(selectedIds);

  const closeDialog = () => setDialog(null);

  return (
    <>
      <div className="sticky top-2 z-30">
        <div className="relative overflow-hidden rounded-xl border border-emerald-300/60 bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-600/20">
          {/* Islamic 8-point star pattern overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            aria-hidden="true"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'><g fill='none' stroke='white' stroke-width='1'><polygon points='15,2 18,10 26,10 20,15 22,23 15,19 8,23 10,15 4,10 12,10'/></g></svg>\")",
              backgroundSize: "30px 30px",
              backgroundRepeat: "repeat",
            }}
          />
          <div className="relative flex flex-wrap items-center gap-2 p-2.5 sm:gap-3 sm:p-3">
            <div className="flex items-center gap-2 text-white">
              <span className="grid size-8 place-items-center rounded-lg bg-white/20 backdrop-blur">
                <Users className="size-4" />
              </span>
              <span className="text-sm font-semibold">
                {t("students.selected", { count })}
              </span>
            </div>

            <div className="mx-1 hidden h-6 w-px bg-white/30 sm:block" />

            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                size="sm"
                onClick={() => setDialog("attendance")}
                className="bg-white/15 text-white backdrop-blur hover:bg-white/25 border border-white/20"
              >
                <CalendarCheck className="mr-1.5 size-3.5" />
                {t("students.markAttendance")}
              </Button>
              <Button
                size="sm"
                onClick={() => setDialog("fee")}
                className="bg-white/15 text-white backdrop-blur hover:bg-white/25 border border-white/20"
              >
                <Wallet className="mr-1.5 size-3.5" />
                {t("students.assignFee")}
              </Button>
              <Button
                size="sm"
                onClick={() => setDialog("promote")}
                className="bg-white/15 text-white backdrop-blur hover:bg-white/25 border border-white/20"
              >
                <ArrowUpCircle className="mr-1.5 size-3.5" />
                {t("students.promoteClass")}
              </Button>
            </div>

            <div className="ms-auto">
              <Button
                size="sm"
                variant="ghost"
                onClick={onClear}
                className="text-white hover:bg-white/20 hover:text-white"
                aria-label={t("students.clearSelection")}
              >
                <X className="mr-1 size-3.5" />
                <span className="hidden sm:inline">{t("students.clearSelection")}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <BulkAttendanceDialog
        open={dialog === "attendance"}
        onOpenChange={(v) => !v && closeDialog()}
        studentIds={ids}
        onDone={onActionComplete}
      />
      <BulkFeeDialog
        open={dialog === "fee"}
        onOpenChange={(v) => !v && closeDialog()}
        studentIds={ids}
        onDone={onActionComplete}
      />
      <BulkPromoteDialog
        open={dialog === "promote"}
        onOpenChange={(v) => !v && closeDialog()}
        studentIds={ids}
        onDone={onActionComplete}
      />
    </>
  );
}
