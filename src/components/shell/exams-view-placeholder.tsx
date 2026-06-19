// Exams view placeholder — full implementation will come later
// For now, a clean empty state so the nav item works
"use client";
import { useApp } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export function ExamsView() {
  const { t } = useApp();
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-dashed">
        <CardContent className="py-20 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg mb-4">
            <BookOpen className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold">{t("nav.exams")}</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            The Exams & Results module is coming soon. You&apos;ll be able to create exams,
            record marks, and generate digital report cards.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
