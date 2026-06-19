"use client";
// GuardianStudentDetail — read-only comprehensive view for one child.
// Mobile-first vertical layout. Fetches /api/guardian/student/[id] then renders:
//   1) Header card (avatar, name, class, roll, badges, madrasa)
//   2) Attendance card (rate + 4 counts + 30-day bar chart)
//   3) Hifz card (memorized/in-progress counts + 30-para grid + recent records)
//   4) Fees card (due / paid / pending / next due)
//   5) Exams card (recent results)
//   6) Notices card (recent notices)
import { useEffect, useState } from "react";
import {
  ArrowLeft, BadgeCheck, BookOpenCheck, GraduationCap, Loader2,
  AlertCircle, Building2, Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useApp } from "@/store/app-store";
import { AttendanceCard, HifzCard } from "./guardian-student-cards";
import { FeesCard, ExamsCard, NoticesCard } from "./guardian-detail-cards-2";

export type GuardianDetail = {
  student: {
    id: string; name: string; nameArabic: string | null; rollNo: string | null;
    photoUrl: string | null; isHafiz: boolean; isActive: boolean;
    admissionDate: string; guardianPhone: string | null;
  };
  tenantName: string;
  class: { name: string; curriculum: string } | null;
  attendance: {
    last30d: { present: number; absent: number; late: number; leave: number; rate: number; total: number };
    series: { date: string; status: string }[];
  };
  hifz: {
    totalRecords: number; avgQuality: number;
    memorizedCount: number; inProgressCount: number;
    parasCovered: { para: number; status: "memorized" | "in-progress" | "not-started" }[];
    recentRecords: { type: string; paraNumber: number; surahName: string | null; qualityRating: number | null; status: string; recordedAt: string }[];
  };
  fees: {
    totalDue: number; totalPaid: number; pendingCount: number;
    nextDue: { dueDate: string | null; amount: number; paidAmount: number } | null;
  };
  examResults: { subject: string; marks: number; total: number; grade: string | null; exam: { name: string; term: string | null } }[];
  notices: { id: string; title: string; content: string; type: string; publishedAt: string }[];
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function GuardianStudentDetail({
  studentId,
  onBack,
}: {
  studentId: string;
  onBack: () => void;
}) {
  const { t, dir, locale } = useApp();
  const [data, setData] = useState<GuardianDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(`/api/guardian/student/${encodeURIComponent(studentId)}`);
        const json = await res.json().catch(() => ({ ok: false, error: "Invalid response" }));
        if (!alive) return;
        if (!json.ok) throw new Error(json.error || "Failed");
        setData(json.data as GuardianDetail);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [studentId]);

  if (loading) {
    return (
      <div dir={dir} className="space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm">{t("guardian.loading")}</span>
        </div>
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div dir={dir} className="space-y-4">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-6 text-destructive">
            <AlertCircle className="size-5 shrink-0" />
            <span className="flex-1 text-sm">{t("guardian.loadError")}</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { student, class: klass, attendance: att, hifz, fees, examResults, notices } = data;

  return (
    <div dir={dir} className="space-y-4">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="w-fit -ml-2">
        <ArrowLeft className={`size-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
        {t("guardian.backToList")}
      </Button>

      {/* Header card */}
      <Card className="overflow-hidden border-0 shadow-md">
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-4 py-5 text-white sm:px-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <Avatar className="size-14 shrink-0 ring-2 ring-white/40 sm:size-16">
                {student.photoUrl ? <AvatarImage src={student.photoUrl} alt={student.name} /> : null}
                <AvatarFallback className="bg-white/20 text-lg font-bold backdrop-blur">
                  {initials(student.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-semibold sm:text-xl">{student.name}</h3>
                {student.nameArabic && (
                  <p dir="rtl" lang="ar" className="truncate text-sm text-white/80">{student.nameArabic}</p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {student.rollNo && (
                    <span className="inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium">
                      {t("guardian.roll")}: {student.rollNo}
                    </span>
                  )}
                  {klass && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium">
                      <GraduationCap className="size-3" /> {klass.name}
                    </span>
                  )}
                  {student.isHafiz && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/30 px-2 py-0.5 text-[11px] font-medium">
                      <BookOpenCheck className="size-3" /> {t("guardian.hafiz")}
                    </span>
                  )}
                  {student.isActive && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium">
                      <BadgeCheck className="size-3" /> {t("guardian.active")}
                    </span>
                  )}
                </div>
                {data.tenantName && (
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-white/70">
                    <Building2 className="size-3" /> {data.tenantName}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail cards */}
      <AttendanceCard last30d={att.last30d} series={att.series} t={t} locale={locale} />
      <HifzCard hifz={hifz} t={t} locale={locale} />
      <FeesCard fees={fees} t={t} locale={locale} />
      <ExamsCard exams={examResults} t={t} />
      <NoticesCard notices={notices} t={t} locale={locale} />

      {/* Footer flourish */}
      <div className="flex items-center justify-center gap-1.5 pt-2 text-[10px] text-muted-foreground">
        <Moon className="size-3" />
        <span>{t("common.appName")}</span>
      </div>
    </div>
  );
}
