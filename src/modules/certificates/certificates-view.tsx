// CertificatesView — generate printable Islamic certificates for students.
// Header (amber/gold gradient tile) + 2-col layout: builder form | live preview.
"use client";
import { useCallback, useEffect, useState } from "react";
import { Award, AlertTriangle, Users } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CertificateBuilder } from "./certificate-builder";
import { CertificatePreview } from "./certificate-preview";
import type { CertType, CertStudent, CertificatesData } from "./certificate-types";

const ISLAMIC_PATTERN_STYLE: React.CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='white' stroke-width='1'><polygon points='20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14'/></g></svg>\")",
  backgroundSize: "40px 40px",
  backgroundRepeat: "repeat",
};

export function CertificatesView() {
  const { t, dir } = useApp();
  const [data, setData] = useState<CertificatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [student, setStudent] = useState<CertStudent | null>(null);
  const [certificateType, setCertificateType] = useState<CertType>("completion");
  const [customText, setCustomText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/certificates", { cache: "no-store", credentials: "include" });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setData(j.data as CertificatesData);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      setError(msg);
      toast.error(t("certificates.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  // Auto-suggest a Hafiz certificate when the student is a Hafiz
  const handleStudentChange = (s: CertStudent | null) => {
    setStudent(s);
    if (s?.isHafiz && certificateType === "completion") {
      setCertificateType("hifz");
    }
  };

  return (
    <div dir={dir()} className="space-y-6 p-4 sm:p-6">
      {/* Header — amber→gold gradient tile */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white shadow-lg shadow-amber-600/20 ring-1 ring-white/30">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.15]"
              aria-hidden="true"
              style={ISLAMIC_PATTERN_STYLE}
            />
            <Award className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("certificates.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("certificates.subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data?.students && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {data.students.length} {t("communications.students").toLowerCase()}
            </span>
          )}
        </div>
      </div>

      {error ? (
        <Card className="border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40">
          <CardContent className="flex items-center gap-3 py-4 text-sm text-rose-700 dark:text-rose-300">
            <AlertTriangle className="size-5 shrink-0" />
            <span className="flex-1">{error}</span>
            <Button size="sm" variant="outline" onClick={() => void load()}>
              {t("common.confirm")}
            </Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : !data || data.students.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-muted">
              <Users className="size-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">{t("certificates.noStudents")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("certificates.noStudentsDesc")}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          {/* LEFT: builder form */}
          <Card className="transition-all hover:shadow-md">
            <CardContent className="p-5 sm:p-6">
              <CertificateBuilder
                students={data.students}
                student={student}
                onStudentChange={handleStudentChange}
                certificateType={certificateType}
                onCertificateTypeChange={setCertificateType}
                customText={customText}
                onCustomTextChange={setCustomText}
              />
            </CardContent>
          </Card>

          {/* RIGHT: live preview */}
          <Card className="transition-all hover:shadow-md">
            <CardContent className="p-4 sm:p-5">
              <CertificatePreview
                student={student}
                tenant={data.tenant}
                certificateType={certificateType}
                customText={customText}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
