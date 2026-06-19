"use client";
// Feedback forms — new feedback + review dialog
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
import type { Feedback } from "./types";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

export function FeedbackForm({
  open, onOpenChange, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const { t } = useApp();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: "complaint", category: "academic", subject: "", description: "",
    submittedBy: "", submitterRole: "parent", contact: "", priority: "medium", rating: "0",
  });

  useEffect(() => {
    if (open) setForm({
      type: "complaint", category: "academic", subject: "", description: "",
      submittedBy: "", submitterRole: "parent", contact: "", priority: "medium", rating: "0",
    });
  }, [open]);

  const submit = async () => {
    if (!form.subject.trim() || !form.description.trim() || !form.submittedBy.trim()) {
      toast.error("Subject, description and name are required");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          rating: form.rating === "0" ? null : Number(form.rating),
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || "Failed");
      toast.success("Feedback submitted");
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("feedback.new")}</DialogTitle>
          <DialogDescription>Submit a complaint, suggestion or appreciation</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="suggestion">Suggestion</SelectItem>
                  <SelectItem value="appreciation">Appreciation</SelectItem>
                  <SelectItem value="grievance">Grievance</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Category">
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="mess">Mess</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Subject"><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
          <Field label="Description"><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Your Name"><Input value={form.submittedBy} onChange={(e) => setForm({ ...form, submittedBy: e.target.value })} /></Field>
            <Field label="Role">
              <Select value={form.submitterRole} onValueChange={(v) => setForm({ ...form, submitterRole: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="visitor">Visitor</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Contact"><Input dir="ltr" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></Field>
            <Field label="Priority">
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Rating (1-5)">
              <Select value={form.rating} onValueChange={(v) => setForm({ ...form, rating: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None</SelectItem>
                  <SelectItem value="1">1 ★</SelectItem>
                  <SelectItem value="2">2 ★</SelectItem>
                  <SelectItem value="3">3 ★</SelectItem>
                  <SelectItem value="4">4 ★</SelectItem>
                  <SelectItem value="5">5 ★</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={loading} className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
            {loading && <Loader2 className="me-2 size-4 animate-spin" />} Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ReviewDialog({
  feedback, onClose, onSaved,
}: {
  feedback: Feedback | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useApp();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("open");
  const [assignedTo, setAssignedTo] = useState("");
  const [resolution, setResolution] = useState("");

  useEffect(() => {
    if (feedback) {
      setStatus(feedback.status);
      setAssignedTo(feedback.assignedTo || "");
      setResolution(feedback.resolution || "");
    }
  }, [feedback]);

  const submit = async () => {
    if (!feedback) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/feedback/${feedback.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, assignedTo, resolution }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || "Failed");
      toast.success("Feedback updated");
      onClose();
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!feedback} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("feedback.review")}</DialogTitle>
          <DialogDescription>{feedback?.subject}</DialogDescription>
        </DialogHeader>
        {feedback && (
          <div className="space-y-3">
            <div className="rounded-lg bg-muted/60 p-3 text-sm">
              <p className="text-muted-foreground">{feedback.description}</p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                <span className="font-medium capitalize">{feedback.type}</span>
                <span>·</span>
                <span className="capitalize">{feedback.category}</span>
                <span>·</span>
                <span>By {feedback.submittedBy}</span>
              </div>
            </div>
            <Field label="Status">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Assigned To"><Input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} /></Field>
            <Field label="Resolution"><Textarea rows={3} value={resolution} onChange={(e) => setResolution(e.target.value)} /></Field>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading} className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
            {loading && <Loader2 className="me-2 size-4 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
