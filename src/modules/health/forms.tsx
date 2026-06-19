"use client";
// Health module forms — record + vaccination
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

type Opt = { id: string; label: string };

function useStudents() {
  const [students, setStudents] = useState<Opt[]>([]);
  useEffect(() => {
    void fetch("/api/students?limit=500", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok) setStudents((j.data.items as { id: string; name: string }[]).map((s) => ({ id: s.id, label: s.name })));
      });
  }, []);
  return students;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

export function HealthRecordForm({
  open, onOpenChange, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const students = useStudents();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    studentId: "", recordType: "checkup", date: "",
    description: "", diagnosis: "", treatment: "",
    medication: "", doctorName: "", followUpDate: "",
    severity: "mild", status: "treated",
  });

  useEffect(() => {
    if (open) {
      setForm({
        studentId: "", recordType: "checkup", date: new Date().toISOString().slice(0, 10),
        description: "", diagnosis: "", treatment: "",
        medication: "", doctorName: "", followUpDate: "",
        severity: "mild", status: "treated",
      });
    }
  }, [open]);

  const submit = async () => {
    if (!form.studentId || !form.description.trim()) {
      toast.error("Student and description are required");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, followUpDate: form.followUpDate || null }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || "Failed");
      toast.success("Health record added");
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Health Record</DialogTitle>
          <DialogDescription>Record a medical event for a student</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Student">
            <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select value={form.recordType} onValueChange={(v) => setForm({ ...form, recordType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="checkup">Checkup</SelectItem>
                  <SelectItem value="illness">Illness</SelectItem>
                  <SelectItem value="allergy">Allergy</SelectItem>
                  <SelectItem value="injury">Injury</SelectItem>
                  <SelectItem value="dental">Dental</SelectItem>
                  <SelectItem value="vision">Vision</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          </div>
          <Field label="Description"><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Diagnosis"><Input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} /></Field>
            <Field label="Doctor"><Input value={form.doctorName} onChange={(e) => setForm({ ...form, doctorName: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Treatment"><Input value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} /></Field>
            <Field label="Medication"><Input value={form.medication} onChange={(e) => setForm({ ...form, medication: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Severity">
              <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="treated">Treated</SelectItem>
                  <SelectItem value="referred">Referred</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Follow-up"><Input type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} /></Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={loading} className="bg-gradient-to-r from-rose-600 to-pink-600 text-white">
            {loading && <Loader2 className="me-2 size-4 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function VaccinationForm({
  open, onOpenChange, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const students = useStudents();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    studentId: "", vaccineName: "", doseNumber: "1",
    dateAdministered: new Date().toISOString().slice(0, 10),
    nextDue: "", administeredBy: "", batchNumber: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        studentId: "", vaccineName: "", doseNumber: "1",
        dateAdministered: new Date().toISOString().slice(0, 10),
        nextDue: "", administeredBy: "", batchNumber: "",
      });
    }
  }, [open]);

  const submit = async () => {
    if (!form.studentId || !form.vaccineName.trim()) {
      toast.error("Student and vaccine name are required");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/health/vaccination", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form, doseNumber: Number(form.doseNumber) || 1,
          nextDue: form.nextDue || null,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || "Failed");
      toast.success("Vaccination recorded");
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Vaccination Record</DialogTitle>
          <DialogDescription>Record an administered vaccine dose</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Student">
            <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Vaccine Name"><Input value={form.vaccineName} onChange={(e) => setForm({ ...form, vaccineName: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dose #"><Input type="number" min={1} value={form.doseNumber} onChange={(e) => setForm({ ...form, doseNumber: e.target.value })} /></Field>
            <Field label="Date"><Input type="date" value={form.dateAdministered} onChange={(e) => setForm({ ...form, dateAdministered: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Next Due"><Input type="date" value={form.nextDue} onChange={(e) => setForm({ ...form, nextDue: e.target.value })} /></Field>
            <Field label="Batch No."><Input dir="ltr" value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} /></Field>
          </div>
          <Field label="Administered By"><Input value={form.administeredBy} onChange={(e) => setForm({ ...form, administeredBy: e.target.value })} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={loading} className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
            {loading && <Loader2 className="me-2 size-4 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
