"use client";
// Alumni create form
import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

export function AlumniForm({
  open, onOpenChange, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", nameArabic: "", graduationYear: new Date().getFullYear().toString(),
    graduatedLevel: "", rollNumber: "", currentOccupation: "",
    organization: "", currentCity: "", currentCountry: "Bangladesh",
    phone: "", email: "", linkedin: "", achievements: "",
  });
  const [isMentor, setIsMentor] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        name: "", nameArabic: "", graduationYear: new Date().getFullYear().toString(),
        graduatedLevel: "", rollNumber: "", currentOccupation: "",
        organization: "", currentCity: "", currentCountry: "Bangladesh",
        phone: "", email: "", linkedin: "", achievements: "",
      });
      setIsMentor(false);
    }
  }, [open]);

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/alumni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          graduationYear: Number(form.graduationYear) || new Date().getFullYear(),
          isMentor,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || "Failed");
      toast.success("Alumni added");
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
          <DialogTitle>Add Alumni</DialogTitle>
          <DialogDescription>Register a graduate of your madrasa</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Name (Arabic)"><Input dir="rtl" value={form.nameArabic} onChange={(e) => setForm({ ...form, nameArabic: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Graduation Year"><Input type="number" value={form.graduationYear} onChange={(e) => setForm({ ...form, graduationYear: e.target.value })} /></Field>
            <Field label="Level"><Input value={form.graduatedLevel} onChange={(e) => setForm({ ...form, graduatedLevel: e.target.value })} /></Field>
            <Field label="Roll No."><Input dir="ltr" value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Occupation"><Input value={form.currentOccupation} onChange={(e) => setForm({ ...form, currentOccupation: e.target.value })} /></Field>
            <Field label="Organization"><Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City"><Input value={form.currentCity} onChange={(e) => setForm({ ...form, currentCity: e.target.value })} /></Field>
            <Field label="Country"><Input value={form.currentCountry} onChange={(e) => setForm({ ...form, currentCountry: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone"><Input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Email"><Input dir="ltr" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          </div>
          <Field label="LinkedIn URL"><Input dir="ltr" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} /></Field>
          <Field label="Achievements"><Textarea rows={2} value={form.achievements} onChange={(e) => setForm({ ...form, achievements: e.target.value })} /></Field>
          <div className="flex items-center gap-2">
            <Checkbox id="mentor" checked={isMentor} onCheckedChange={(v) => setIsMentor(v === true)} />
            <Label htmlFor="mentor" className="text-sm">Available as mentor for current students</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={loading} className="bg-gradient-to-r from-violet-600 to-purple-600 text-white">
            {loading && <Loader2 className="me-2 size-4 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
