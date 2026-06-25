"use client";
// Security Module — Gate Pass + Visitor management
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ShieldCheck, DoorOpen, UserCheck, Plus, Loader2, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/store/app-store";

type GatePass = {
  id: string; reason: string; status: string; issuedAt: string; returnedAt?: string;
  student: { name: string; rollNo: string; class?: { name: string } };
};

type Visitor = {
  id: string; name: string; phone: string; purpose: string; idType: string;
  idNumber: string; checkIn: string; checkOut?: string;
};

export function SecurityView() {
  const { t } = useApp();
  const [passes, setPasses] = React.useState<GatePass[]>([]);
  const [visitors, setVisitors] = React.useState<Visitor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showPassForm, setShowPassForm] = React.useState(false);
  const [showVisitorForm, setShowVisitorForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [pr, vr] = await Promise.all([
        fetch("/api/gate-passes").then((r) => r.json()).catch(() => ({ ok: false })),
        fetch("/api/visitors").then((r) => r.json()).catch(() => ({ ok: false })),
      ]);
      if (pr?.ok) setPasses(pr.data?.items || []);
      if (vr?.ok) setVisitors(vr.data?.items || []);
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const pendingPasses = passes.filter((p) => p.status === "PENDING" || p.status === "APPROVED").length;
  const activeVisitors = visitors.filter((v) => !v.checkOut).length;

  if (loading) return <Skeleton className="h-96 rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><DoorOpen className="size-3" /> বিচারাধীন গেট পাস</p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{pendingPasses}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><UserCheck className="size-3" /> উপস্থিত দর্শনার্থী</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{activeVisitors}</p>
          </CardContent>
        </Card>
        <Card className="flex items-center justify-center">
          <CardContent className="p-4 flex gap-2">
            <Button size="sm" onClick={() => setShowPassForm(true)} className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
              <Plus className="size-3" /> গেট পাস
            </Button>
            <Button size="sm" onClick={() => setShowVisitorForm(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <Plus className="size-3" /> দর্শনার্থী
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="passes">
        <TabsList>
          <TabsTrigger value="passes" className="gap-1"><DoorOpen className="size-3" /> গেট পাস</TabsTrigger>
          <TabsTrigger value="visitors" className="gap-1"><UserCheck className="size-3" /> দর্শনার্থী</TabsTrigger>
        </TabsList>

        <TabsContent value="passes">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ছাত্র</TableHead>
                    <TableHead>কারণ</TableHead>
                    <TableHead>অবস্থা</TableHead>
                    <TableHead>ইস্যু</TableHead>
                    <TableHead>ফেরত</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {passes.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">কোনো গেট পাস নেই</TableCell></TableRow>
                  ) : passes.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.student?.name || "—"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{p.reason}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === "PENDING" ? "outline" : p.status === "APPROVED" ? "default" : "secondary"}>
                          {p.status === "PENDING" ? "বিচারাধীন" : p.status === "APPROVED" ? "অনুমোদিত" : "ফেরত"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{new Date(p.issuedAt).toLocaleDateString("bn-BD")}</TableCell>
                      <TableCell className="text-xs">{p.returnedAt ? new Date(p.returnedAt).toLocaleDateString("bn-BD") : <Clock className="size-3 text-amber-500" />}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visitors">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>নাম</TableHead>
                    <TableHead>ফোন</TableHead>
                    <TableHead>উদ্দেশ্য</TableHead>
                    <TableHead>আইডি</TableHead>
                    <TableHead>চেক-ইন</TableHead>
                    <TableHead>চেক-আউট</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visitors.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">কোনো দর্শনার্থী নেই</TableCell></TableRow>
                  ) : visitors.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.name}</TableCell>
                      <TableCell dir="ltr">{v.phone}</TableCell>
                      <TableCell>{v.purpose}</TableCell>
                      <TableCell className="text-xs">{v.idType}: {v.idNumber}</TableCell>
                      <TableCell className="text-xs">{new Date(v.checkIn).toLocaleTimeString("bn-BD")}</TableCell>
                      <TableCell>
                        {v.checkOut ? (
                          <span className="flex items-center gap-1 text-xs"><CheckCircle2 className="size-3 text-emerald-500" />{new Date(v.checkOut).toLocaleTimeString("bn-BD")}</span>
                        ) : (
                          <Badge variant="outline" className="text-amber-600">ক্যাম্পাসে</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
