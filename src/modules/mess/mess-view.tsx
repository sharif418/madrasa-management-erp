"use client";
// Mess Management Module — Meal planning & headcount
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UtensilsCrossed, Calendar, Users, Edit2, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/store/app-store";

type MealPlan = {
  day: string; breakfast: string; lunch: string; dinner: string; snacks: string;
};

const DAYS = ["শনিবার", "রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার"];
const DAYS_EN = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];

export function MessView() {
  const { t } = useApp();
  const [menu, setMenu] = React.useState<MealPlan[]>(
    DAYS_EN.map((d, i) => ({ day: d, breakfast: "", lunch: "", dinner: "", snacks: "" }))
  );
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [headcount, setHeadcount] = React.useState({ total: 0, present: 0 });

  const today = new Date().getDay();
  const todayIndex = today === 0 ? 1 : today === 6 ? 0 : today;

  const updateMeal = (idx: number, field: keyof MealPlan, value: string) => {
    setMenu((prev) => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  const saveMenu = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    toast.success("মেস মেনু সংরক্ষিত হয়েছে");
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="size-3" /> আজকের খাবার</p>
            <p className="text-lg font-bold text-orange-700 dark:text-orange-300">{DAYS[todayIndex]}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="size-3" /> আজকের হেডকাউন্ট</p>
            <p className="text-2xl font-bold">{headcount.present}/{headcount.total}</p>
          </CardContent>
        </Card>
        <Card className="flex items-center justify-center">
          <CardContent className="p-4">
            <Button onClick={() => setEditing(!editing)} variant={editing ? "outline" : "default"} className={!editing ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white" : ""}>
              <Edit2 className="size-4" /> {editing ? "বন্ধ করুন" : "মেনু এডিট"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Today's Menu Card */}
      <Card className="border-orange-200 dark:border-orange-900/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UtensilsCrossed className="size-4 text-orange-600" /> আজকের মেনু — {DAYS[todayIndex]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            {(["breakfast", "lunch", "dinner", "snacks"] as const).map((meal) => (
              <div key={meal} className="rounded-lg border p-3 bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  {meal === "breakfast" ? "🌅 সকালের নাস্তা" : meal === "lunch" ? "☀️ দুপুরের খাবার" : meal === "dinner" ? "🌙 রাতের খাবার" : "🍪 স্ন্যাকস"}
                </p>
                <p className="text-sm">{menu[todayIndex][meal] || "—"}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Menu Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">সাপ্তাহিক মেনু</CardTitle>
          {editing && (
            <Button size="sm" onClick={saveMenu} disabled={saving} className="bg-gradient-to-r from-orange-600 to-amber-600 text-white">
              {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />} সংরক্ষণ
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left font-medium">দিন</th>
                  <th className="p-2 text-left font-medium">সকালের নাস্তা</th>
                  <th className="p-2 text-left font-medium">দুপুরের খাবার</th>
                  <th className="p-2 text-left font-medium">রাতের খাবার</th>
                  <th className="p-2 text-left font-medium">স্ন্যাকস</th>
                </tr>
              </thead>
              <tbody>
                {menu.map((m, i) => (
                  <tr key={m.day} className={`border-b ${i === todayIndex ? "bg-orange-50/50 dark:bg-orange-950/20" : ""}`}>
                    <td className="p-2 font-medium">{DAYS[i]} {i === todayIndex && <Badge className="ml-1 text-[10px]">আজ</Badge>}</td>
                    {(["breakfast", "lunch", "dinner", "snacks"] as const).map((field) => (
                      <td key={field} className="p-2">
                        {editing ? (
                          <Input className="text-xs h-8" value={m[field]} onChange={(e) => updateMeal(i, field, e.target.value)} placeholder="মেনু লিখুন" />
                        ) : (
                          <span className="text-xs">{m[field] || "—"}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
