"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2, Utensils } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/store/app-store";

import { MEAL_TYPES, type HostelData, type MessMenu } from "./types";

const MEAL_TINT: Record<string, string> = {
  breakfast: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300",
  lunch: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300",
  dinner: "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/40 dark:text-teal-300",
  snacks: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300",
};

type Props = { data: HostelData | null; onChanged: () => void };

export function MessTab({ data, onChanged }: Props) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);

  const menus = data?.messMenus ?? [];

  // Build a 7-day grid starting today
  const days = useMemo(() => {
    const out: { date: Date; iso: string; label: string }[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      out.push({
        date: d,
        iso: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }),
      });
    }
    return out;
  }, []);

  const menuMap = useMemo(() => {
    const m = new Map<string, MessMenu>();
    for (const item of menus) {
      const key = `${item.date.slice(0, 10)}::${item.mealType}`;
      m.set(key, item);
    }
    return m;
  }, [menus]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("hostel.mess")} · 7 {t("hostel.date")}
        </p>
        <Button
          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
          onClick={() => setOpen(true)}
        >
          <Plus className="size-4" />
          {t("hostel.addMenu")}
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/40 backdrop-blur">
              <tr>
                <th className="text-start font-medium px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">{t("hostel.mealType")}</th>
                {days.map((d) => (
                  <th key={d.iso} className="text-start font-medium px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEAL_TYPES.map((meal) => (
                <tr key={meal} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <Badge className={MEAL_TINT[meal]}>{t(`hostel.${meal}`)}</Badge>
                  </td>
                  {days.map((d) => {
                    const menu = menuMap.get(`${d.iso}::${meal}`);
                    return (
                      <td key={d.iso} className="px-3 py-2 align-top min-w-[140px]">
                        {menu ? (
                          <div className="space-y-1">
                            <p className="text-xs font-medium">{menu.items}</p>
                            {menu.headcount > 0 && (
                              <p className="text-[10px] text-muted-foreground">{t("hostel.headcount")}: {menu.headcount}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/60">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {menus.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-6">{t("hostel.noMenu")}</p>
      )}

      <AddMenuDialog open={open} onOpenChange={setOpen} onSaved={onChanged} />
    </div>
  );
}

function AddMenuDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const { t } = useApp();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mealType, setMealType] = useState<string>("breakfast");
  const [items, setItems] = useState("");
  const [headcount, setHeadcount] = useState("0");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!date || !mealType || !items.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/hostel/mess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, mealType, items: items.trim(), headcount: Number(headcount) }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
      toast.success(t("hostel.menuSaved"));
      onOpenChange(false);
      setItems("");
      setHeadcount("0");
      onSaved();
    } catch (err) {
      toast.error(t("hostel.saveFailed"), { description: err instanceof Error ? err.message : "" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="size-5 text-emerald-600" />
            {t("hostel.addMenu")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("hostel.date")}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("hostel.mealType")}</Label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MEAL_TYPES.map((m) => (
                    <SelectItem key={m} value={m}>{t(`hostel.${m}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("hostel.items")}</Label>
            <Textarea
              value={items}
              onChange={(e) => setItems(e.target.value)}
              placeholder=" Rice, Dal, Vegetables, Chicken..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("hostel.headcount")}</Label>
            <Input type="number" min={0} value={headcount} onChange={(e) => setHeadcount(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button
            onClick={submit}
            disabled={submitting || !items.trim()}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
