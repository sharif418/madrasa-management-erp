"use client";
// Inventory forms — asset + item create dialogs
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

export function AssetForm({
  open, onOpenChange, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", category: "equipment", serialNumber: "", purchaseDate: "",
    purchaseCost: "0", currentValue: "0", condition: "good",
    location: "", assignedTo: "", status: "in_use", notes: "",
  });

  useEffect(() => {
    if (open) setForm({
      name: "", category: "equipment", serialNumber: "", purchaseDate: "",
      purchaseCost: "0", currentValue: "0", condition: "good",
      location: "", assignedTo: "", status: "in_use", notes: "",
    });
  }, [open]);

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "asset", ...form,
          purchaseCost: Number(form.purchaseCost) || 0,
          currentValue: Number(form.currentValue) || 0,
          purchaseDate: form.purchaseDate || null,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || "Failed");
      toast.success("Asset added");
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
          <DialogTitle>Add Asset</DialogTitle>
          <DialogDescription>Register a fixed asset</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Category">
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="furniture">Furniture</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="building">Building</SelectItem>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                  <SelectItem value="it">IT</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Serial No."><Input dir="ltr" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} /></Field>
            <Field label="Purchase Date"><Input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Purchase Cost"><Input type="number" min={0} value={form.purchaseCost} onChange={(e) => setForm({ ...form, purchaseCost: e.target.value })} /></Field>
            <Field label="Current Value"><Input type="number" min={0} value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Condition">
              <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_use">In Use</SelectItem>
                  <SelectItem value="stored">Stored</SelectItem>
                  <SelectItem value="under_repair">Under Repair</SelectItem>
                  <SelectItem value="disposed">Disposed</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Location"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
          </div>
          <Field label="Assigned To"><Input value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} /></Field>
          <Field label="Notes"><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={loading} className="bg-gradient-to-r from-slate-600 to-slate-800 text-white">
            {loading && <Loader2 className="me-2 size-4 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ItemForm({
  open, onOpenChange, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", category: "stationery", unit: "pcs",
    quantity: "0", minStock: "10", unitCost: "0",
  });

  useEffect(() => {
    if (open) setForm({
      name: "", category: "stationery", unit: "pcs",
      quantity: "0", minStock: "10", unitCost: "0",
    });
  }, [open]);

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "item", ...form,
          quantity: Number(form.quantity) || 0,
          minStock: Number(form.minStock) || 0,
          unitCost: Number(form.unitCost) || 0,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || "Failed");
      toast.success("Item added");
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
          <DialogTitle>Add Consumable</DialogTitle>
          <DialogDescription>Register a consumable inventory item</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="stationery">Stationery</SelectItem>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Unit"><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Quantity"><Input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></Field>
            <Field label="Min Stock"><Input type="number" min={0} value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} /></Field>
            <Field label="Unit Cost"><Input type="number" min={0} value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} /></Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={loading} className="bg-gradient-to-r from-slate-600 to-slate-800 text-white">
            {loading && <Loader2 className="me-2 size-4 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
