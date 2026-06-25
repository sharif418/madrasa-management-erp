"use client";
// Infirmary Module — In-campus medical visit tracking
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Stethoscope, Plus, Loader2, Thermometer, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/store/app-store";

type InfirmaryRec = {
  id: string; symptoms: string; diagnosis: string; medication: string;
  temperature: number; severity: string; status: string; doctorName: string;
  visitedAt: string;
  student: { id: string; name: string; rollNo: string; class?: { name: string } };
};

const SEVERITY_COLORS: Record<string, string> = {
  mild: "bg-green-100 text-green-700",
  moderate: "bg-amber-100 text-amber-700",
  severe: "bg-red-100 text-red-700",
};

export function InfirmaryView() {
  const { t } = useApp();
  const [records, setRecords] = React.useState<InfirmaryRec[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [students, setStudents] = React.useState<{ id: string; name: string; rollNo: string }[]>([]);
  const [form, setForm] = React.useState({
    studentId: "", symptoms: "", diagnosis: "", medication: "",
    temperature: "", severity: "mild", doctorName: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [ir, sr] = await Promise.all([
        fetch("/api/infirmary").then((r) => r.json()),
        fetch("/api/students?limit=500").then((r) => r.json()),
      ]);
      if (ir?.ok) setRecords(ir.data.items || []);
      if (sr?.ok) setStudents(sr.data.items || []);
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const submit = async () => {
    if (!form.studentId || !form.symptoms) { toast.error("ছাত্র ও লক্ষণ আবশ্যক"); return; }
    setSaving(true);
    try {
      const payload = { ...form, temperature: form.temperature ? parseFloat(form.temperature) : null };
      const r = await fetch("/api/infirmary", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Failed");
      toast.success("ইনফার্মারি রেকর্ড সংরক্ষিত");
      setShowForm(false);
      setForm({ studentId: "", symptoms: "", diagnosis: "", medication: "", temperature: "", severity: "mild", doctorName: "" });
      void load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  };

  const activeCount = records.filter((r) => r.status === "ongoing").length;

  if (loading) return <Skeleton className="h-96 rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="size-3" /> চলমান চিকিৎসা</p>
            <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">মোট ভিজিট</p>
            <p className="text-2xl font-bold">{records.length}</p>
          </CardContent>
        </Card>
        <Card className="flex items-center justify-center">
          <CardContent className="p-4">
            <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-rose-600 to-pink-600 text-white">
              <Plus className="size-4" /> নতুন ভিজিট
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Stethoscope className="size-4 text-rose-600" /> ইনফার্মারি রেকর্ড
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ছাত্র</TableHead>
                <TableHead>লক্ষণ</TableHead>
                <TableHead>তাপমাত্রা</TableHead>
                <TableHead>তীব্রতা</TableHead>
                <TableHead>অবস্থা</TableHead>
                <TableHead>তারিখ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">কোনো রেকর্ড নেই</TableCell></TableRow>
              ) : records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.student.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{r.symptoms}</TableCell>
                  <TableCell>{r.temperature ? <span className="flex items-center gap-1"><Thermometer className="size-3" />{r.temperature}°F</span> : "—"}</TableCell>
                  <TableCell><Badge className={SEVERITY_COLORS[r.severity] || ""}>{r.severity === "mild" ? "হালকা" : r.severity === "moderate" ? "মাঝারি" : "গুরুতর"}</Badge></TableCell>
                  <TableCell><Badge variant={r.status === "ongoing" ? "destructive" : "outline"}>{r.status === "ongoing" ? "চলমান" : "চিকিৎসিত"}</Badge></TableCell>
                  <TableCell className="text-xs">{new Date(r.visitedAt).toLocaleDateString("bn-BD")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Stethoscope className="size-5 text-rose-600" /> নতুন ইনফার্মারি ভিজিট</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>ছাত্র</Label>
              <Select value={form.studentId} onValueChange={(v) => setForm((f) => ({ ...f, studentId: v }))}>
                <SelectTrigger><SelectValue placeholder="ছাত্র নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.rollNo})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>লক্ষণ</Label><Textarea value={form.symptoms} onChange={(e) => setForm((f) => ({ ...f, symptoms: e.target.value }))} placeholder="জ্বর, মাথা ব্যথা..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>তাপমাত্রা (°F)</Label><Input type="number" value={form.temperature} onChange={(e) => setForm((f) => ({ ...f, temperature: e.target.value }))} placeholder="98.6" /></div>
              <div className="space-y-1">
                <Label>তীব্রতা</Label>
                <Select value={form.severity} onValueChange={(v) => setForm((f) => ({ ...f, severity: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mild">হালকা</SelectItem>
                    <SelectItem value="moderate">মাঝারি</SelectItem>
                    <SelectItem value="severe">গুরুতর</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label>ডাক্তারের নাম</Label><Input value={form.doctorName} onChange={(e) => setForm((f) => ({ ...f, doctorName: e.target.value }))} /></div>
            <div className="space-y-1"><Label>ওষুধ</Label><Input value={form.medication} onChange={(e) => setForm((f) => ({ ...f, medication: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>বাতিল</Button>
            <Button onClick={submit} disabled={saving} className="bg-gradient-to-r from-rose-600 to-pink-600 text-white">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Stethoscope className="size-4" />} সংরক্ষণ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
