"use client";
// StudentProfileView — 360° detail view of a single student
// Header: avatar + name + Arabic name + roll + class + active/hafiz badges
// Tabs: Overview, Hifz, Attendance, Fees, Exam Results
import { useEffect, useState } from "react";
import {
  ArrowLeft, BadgeCheck, BookOpenCheck, CalendarCheck, GraduationCap,
  AlertCircle, Loader2, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { useT } from "./i18n";
import { ProfileData, initials } from "./profile-types";
import { ProfileOverviewTab } from "./profile-overview-tab";
import { ProfileHifzTab } from "./profile-hifz-tab";
import { ProfileAttendanceTab } from "./profile-attendance-tab";
import { ProfileFeesTab } from "./profile-fees-tab";
import { ProfileExamsTab } from "./profile-exams-tab";

type Props = {
  studentId: string;
  onBack: () => void;
};

export function StudentProfileView({ studentId, onBack }: Props) {
  const t = useT();
  const dir = useApp((s) => s.dir());
  const locale = useApp((s) => s.locale);
  const { toast } = useToast();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(`/api/students/${encodeURIComponent(studentId)}/profile`, {
          credentials: "same-origin",
        });
        const json = await res.json().catch(() => ({ ok: false, error: "Invalid response" }));
        if (!alive) return;
        if (!json.ok) throw new Error(json.error || "Failed");
        setData(json.data as ProfileData);
      } catch (e) {
        if (!alive) return;
        const msg = e instanceof Error ? e.message : "";
        setError(msg || "Error");
        toast({ title: t("studentProfile.loadError"), description: msg, variant: "destructive" });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [studentId, t, toast]);

  if (loading) return <ProfileSkeleton dir={dir} onBack={onBack} t={t} />;

  if (error || !data) {
    return (
      <div dir={dir} className="space-y-4 p-4 sm:p-6">
        <BackButton onClick={onBack} label={t("studentProfile.back")} dir={dir} />
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-6 text-destructive">
            <AlertCircle className="size-5 shrink-0" />
            <span className="flex-1 text-sm">{t("studentProfile.loadError")}</span>
            <Button size="sm" variant="outline" onClick={onBack}>{t("studentProfile.back")}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { student, class: klass } = data;

  return (
    <div dir={dir} className="space-y-6 p-4 sm:p-6">
      {/* Back */}
      <BackButton onClick={onBack} label={t("studentProfile.back")} dir={dir} />

      {/* Header card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-6 py-5 text-white">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl font-bold backdrop-blur ring-2 ring-white/40">
                {initials(student.name)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold truncate">{student.name}</h1>
                {student.nameArabic && (
                  <p dir="rtl" lang="ar" className="text-sm text-white/80">{student.nameArabic}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {student.rollNo && (
                    <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium">
                      #{student.rollNo}
                    </span>
                  )}
                  {klass && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium">
                      <GraduationCap className="size-3" /> {klass.name}
                    </span>
                  )}
                  {student.isActive && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium">
                      <BadgeCheck className="size-3" /> {t("students.active")}
                    </span>
                  )}
                  {student.isHafiz && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/30 px-2.5 py-0.5 text-xs font-medium">
                      <BookOpenCheck className="size-3" /> {t("students.hafiz")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="overview">{t("studentProfile.overview")}</TabsTrigger>
          <TabsTrigger value="hifz">{t("studentProfile.hifz")}</TabsTrigger>
          <TabsTrigger value="attendance">{t("studentProfile.attendance")}</TabsTrigger>
          <TabsTrigger value="fees">{t("studentProfile.fees")}</TabsTrigger>
          <TabsTrigger value="exams">{t("studentProfile.exams")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><ProfileOverviewTab data={data} locale={locale} /></TabsContent>
        <TabsContent value="hifz"><ProfileHifzTab data={data} locale={locale} /></TabsContent>
        <TabsContent value="attendance"><ProfileAttendanceTab data={data} locale={locale} /></TabsContent>
        <TabsContent value="fees"><ProfileFeesTab data={data} locale={locale} /></TabsContent>
        <TabsContent value="exams"><ProfileExamsTab data={data} locale={locale} /></TabsContent>
      </Tabs>
    </div>
  );
}

function BackButton({ onClick, label, dir }: { onClick: () => void; label: string; dir: "ltr" | "rtl" }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className="w-fit">
      <ArrowLeft className={`size-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
      {label}
    </Button>
  );
}

function ProfileSkeleton({ dir, onBack, t }: { dir: "ltr" | "rtl"; onBack: () => void; t: (k: string) => string }) {
  return (
    <div dir={dir} className="space-y-6 p-4 sm:p-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="w-fit" disabled>
        <ArrowLeft className="size-4" /> {t("studentProfile.back")}
      </Button>
      <Skeleton className="h-28 rounded-xl" />
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm">{t("common.loading")}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </div>
  );
}
