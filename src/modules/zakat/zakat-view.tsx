"use client";
// Zakat Tamlik Module — Shariah-compliant distribution tracking
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Gift, Plus, Loader2, ShieldCheck, Hash } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/store/app-store";

type ZakatRecord = {
  id: string; studentId: string; amount: number; purpose: string;
  tamlikStatus: string; auditHash: string; distributedAt: string;
  student: { id: string; name: string; rollNo: string; class?: { name: string } };
};

const PURPOSES = [
  { value: "fee_waiver", label: "ফি মওকুফ" },
  { value: "food", label: "খাদ্য" },
  { value: "books", label: "বই-খাতা" },
  { value: "medical", label: "চিকিৎসা" },
  { value: "clothing", label: "পোশাক" },
];

export function ZakatView() {
  const { t } = useApp();
  const [records, setRecords] = React.useState<ZakatRecord[]>([]);
  const [stats, setStats] = React.useState({ totalAmount: 0, totalDistributions: 0 });
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ studentId: "", amount: "", purpose: "fee_waiver" });
  const [students, setStudents] = React.useState<{ id: string; name: string; rollNo: string }[]>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [zr, sr] = await Promise.all([
        fetch("/api/zakat").then((r) => r.json()),
        fetch("/api/students?limit=500").then((r) => r.json()),
      ]);
      if (zr?.ok) { setRecords(zr.data.items); setStats(zr.data.stats); }
      if (sr?.ok) setStudents(sr.data.items || []);
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const submit = async () => {
    if (!form.studentId || !form.amount) { toast.error("ছাত্র ও পরিমাণ আবশ্যক"); return; }
    setSaving(true);
    try {
      const r = await fetch("/api/zakat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Failed");
      toast.success("যাকাত বিতরণ রেকর্ড হয়েছে");
      setShowForm(false);
      setForm({ studentId: "", amount: "", purpose: "fee_waiver" });
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally { setSaving(false); }
  };

  if (loading) return <Skeleton className="h-96 rounded-xl" />;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">মোট বিতরণ</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">৳{stats.totalAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">মোট রেকর্ড</p>
            <p className="text-2xl font-bold">{stats.totalDistributions}</p>
          </CardContent>
        </Card>
        <Card className="flex items-center justify-center">
          <CardContent className="p-4">
            <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <Plus className="size-4" /> নতুন বিতরণ
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="size-4 text-emerald-600" /> যাকাত তমলিক রেকর্ড
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ছাত্র</TableHead>
                <TableHead>ক্লাস</TableHead>
                <TableHead>পরিমাণ</TableHead>
                <TableHead>উদ্দেশ্য</TableHead>
                <TableHead>অবস্থা</TableHead>
                <TableHead>তারিখ</TableHead>
                <TableHead>অডিট</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">কোনো রেকর্ড নেই</TableCell></TableRow>
              ) : records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.student.name}</TableCell>
                  <TableCell>{r.student.class?.name || "—"}</TableCell>
                  <TableCell className="font-mono">৳{r.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{PURPOSES.find((p) => p.value === r.purpose)?.label || r.purpose}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={r.tamlikStatus === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                      {r.tamlikStatus === "completed" ? "সম্পন্ন" : "বিচারাধীন"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{new Date(r.distributedAt).toLocaleDateString("bn-BD")}</TableCell>
                  <TableCell>
                    {r.auditHash && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                        <Hash className="size-3" />{r.auditHash.slice(0, 8)}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-emerald-600" /> নতুন যাকাত বিতরণ
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>ছাত্র</Label>
              <Select value={form.studentId} onValueChange={(v) => setForm((f) => ({ ...f, studentId: v }))}>
                <SelectTrigger><SelectValue placeholder="ছাত্র নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.rollNo})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>পরিমাণ (৳)</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label>উদ্দেশ্য</Label>
              <Select value={form.purpose} onValueChange={(v) => setForm((f) => ({ ...f, purpose: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PURPOSES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>বাতিল</Button>
            <Button onClick={submit} disabled={saving} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Gift className="size-4" />} রেকর্ড করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
