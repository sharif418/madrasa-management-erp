"use client";
// Admission review dialog — update status, schedule interview, add notes
import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/store/app-store";
import type { Application } from "./types";
import { STATUS_FLOW } from "./types";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

export function ReviewDialog({
  application, onClose, onSaved,
}: {
  application: Application | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useApp();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("pending");
  const [reviewNotes, setReviewNotes] = useState("");
  const [interviewDate, setInterviewDate] = useState("");

  useEffect(() => {
    if (application) {
      setStatus(application.status);
      setReviewNotes(application.reviewNotes || "");
      setInterviewDate(
        application.interviewDate ? application.interviewDate.slice(0, 16) : ""
      );
    }
  }, [application]);

  const submit = async () => {
    if (!application) return;
    setLoading(true);
    try {
      const r = await fetch("/api/admission", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: application.id,
          status,
          reviewNotes,
          interviewDate: interviewDate || null,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || "Failed");
      toast.success("Application updated");
      onClose();
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!application} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("admission.review")}</DialogTitle>
          <DialogDescription>{application?.applicantName}</DialogDescription>
        </DialogHeader>

        {application && (
          <div className="space-y-4">
            {/* Applicant details */}
            <div className="rounded-lg bg-muted/60 p-3 text-sm space-y-1.5">
              <div className="grid grid-cols-2 gap-2">
                <Detail label="Father" value={application.fatherName} />
                <Detail label="Mother" value={application.motherName || "—"} />
                <Detail label="Phone" value={application.guardianPhone} dir="ltr" />
                <Detail label="Email" value={application.guardianEmail || "—"} dir="ltr" />
                <Detail label="Applied Level" value={application.appliedLevel || "—"} />
                <Detail label="Applied Class" value={application.appliedClass || "—"} />
              </div>
              {application.address && (
                <Detail label="Address" value={application.address} />
              )}
              {application.previousInstitution && (
                <Detail label="Previous Institution" value={application.previousInstitution} />
              )}
              {application.hifzBackground && (
                <Detail label="Hifz Background" value={application.hifzBackground} />
              )}
            </div>

            <Field label="Status">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_FLOW.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label={t("admission.interview")}>
              <Input
                type="datetime-local"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
              />
            </Field>

            <Field label="Review Notes">
              <Textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Internal notes about this applicant…"
              />
            </Field>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={submit}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
          >
            {loading && <Loader2 className="me-2 size-4 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value, dir }: { label: string; value: string; dir?: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium" dir={dir}>{value}</p>
    </div>
  );
}
