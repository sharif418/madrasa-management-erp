"use client";
// Transport forms — Vehicle / Route / Allocation create dialogs
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

// ---------- Vehicle form ----------
export function VehicleForm({
  open, onOpenChange, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    registration: "", type: "bus", capacity: "30",
    driverName: "", driverPhone: "", routeName: "",
  });

  useEffect(() => {
    if (open) setForm({ registration: "", type: "bus", capacity: "30", driverName: "", driverPhone: "", routeName: "" });
  }, [open]);

  const submit = async () => {
    if (!form.registration || !form.driverName) {
      toast.error("Registration and driver name are required");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/transport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "vehicle", ...form, capacity: Number(form.capacity) }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || "Failed");
      toast.success("Vehicle added");
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
          <DialogTitle>Add Vehicle</DialogTitle>
          <DialogDescription>Register a new transport vehicle</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Registration No."><Input value={form.registration} onChange={(e) => setForm({ ...form, registration: e.target.value })} /></Field>
          <Field label="Type">
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bus">Bus</SelectItem>
                <SelectItem value="minibus">Minibus</SelectItem>
                <SelectItem value="microbus">Microbus</SelectItem>
                <SelectItem value="van">Van</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Capacity"><Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></Field>
          <Field label="Driver Name"><Input value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} /></Field>
          <Field label="Driver Phone"><Input dir="ltr" value={form.driverPhone} onChange={(e) => setForm({ ...form, driverPhone: e.target.value })} /></Field>
          <Field label="Route Name (optional)"><Input value={form.routeName} onChange={(e) => setForm({ ...form, routeName: e.target.value })} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={loading} className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
            {loading && <Loader2 className="me-2 size-4 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Route form ----------
export function RouteForm({
  open, onOpenChange, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", startPoint: "", endPoint: "", distanceKm: "0", monthlyFee: "0",
  });
  const [stopsText, setStopsText] = useState("");

  useEffect(() => {
    if (open) {
      setForm({ name: "", startPoint: "", endPoint: "", distanceKm: "0", monthlyFee: "0" });
      setStopsText("");
    }
  }, [open]);

  const submit = async () => {
    if (!form.name || !form.startPoint || !form.endPoint) {
      toast.error("Name, start and end points are required");
      return;
    }
    setLoading(true);
    try {
      const stops = stopsText.split("\n").map((s) => s.trim()).filter(Boolean);
      const r = await fetch("/api/transport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "route", ...form,
          distanceKm: Number(form.distanceKm), monthlyFee: Number(form.monthlyFee),
          stops,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || "Failed");
      toast.success("Route added");
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
          <DialogTitle>Add Route</DialogTitle>
          <DialogDescription>Define a transport route with pickup stops</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Route Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Point"><Input value={form.startPoint} onChange={(e) => setForm({ ...form, startPoint: e.target.value })} /></Field>
            <Field label="End Point"><Input value={form.endPoint} onChange={(e) => setForm({ ...form, endPoint: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Distance (km)"><Input type="number" min={0} value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} /></Field>
            <Field label="Monthly Fee"><Input type="number" min={0} value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })} /></Field>
          </div>
          <Field label="Stops (one per line)">
            <Textarea rows={3} value={stopsText} onChange={(e) => setStopsText(e.target.value)} placeholder={"Stop 1\nStop 2"} />
          </Field>
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

// ---------- Allocation form ----------
type Opt = { id: string; label: string };
export function AllocationForm({
  open, onOpenChange, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Opt[]>([]);
  const [vehicles, setVehicles] = useState<Opt[]>([]);
  const [routes, setRoutes] = useState<Opt[]>([]);
  const [studentId, setStudentId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [routeId, setRouteId] = useState("");
  const [pickupPoint, setPickupPoint] = useState("");

  useEffect(() => {
    if (!open) return;
    setStudentId(""); setVehicleId(""); setRouteId(""); setPickupPoint("");
    void Promise.all([
      fetch("/api/students?limit=200", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/transport", { cache: "no-store" }).then((r) => r.json()),
    ]).then(([s, tr]) => {
      if (s?.ok) setStudents((s.data.items as { id: string; name: string }[]).map((x) => ({ id: x.id, label: x.name })));
      if (tr?.ok) {
        setVehicles((tr.data.vehicles as { id: string; registration: string }[]).map((v) => ({ id: v.id, label: v.registration })));
        setRoutes((tr.data.routes as { id: string; name: string }[]).map((r) => ({ id: r.id, label: r.name })));
      }
    });
  }, [open]);

  const submit = async () => {
    if (!studentId || !vehicleId || !routeId) {
      toast.error("All fields are required");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/transport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "allocation", studentId, vehicleId, routeId, pickupPoint }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || "Failed");
      toast.success("Student allocated");
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
          <DialogTitle>Allocate Student</DialogTitle>
          <DialogDescription>Assign a student to a vehicle + route</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Student">
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Vehicle">
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Route">
            <Select value={routeId} onValueChange={setRouteId}>
              <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
              <SelectContent>
                {routes.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Pickup Point (optional)"><Input value={pickupPoint} onChange={(e) => setPickupPoint(e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={loading} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            {loading && <Loader2 className="me-2 size-4 animate-spin" />} Allocate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}
