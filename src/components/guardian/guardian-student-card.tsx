"use client";
// GuardianStudentCard — compact card shown in the list of children.
// Shows avatar, name, Arabic name (if any), roll no, class, tenant name,
// and active/hafiz badges. Click → onSelect(id).
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { GraduationCap, BookOpenCheck, BadgeCheck, Building2, ChevronRight } from "lucide-react";
import { useApp } from "@/store/app-store";

export type GuardianStudentSummary = {
  id: string;
  tenantId: string;
  tenantName: string;
  name: string;
  nameArabic: string | null;
  rollNo: string | null;
  className: string | null;
  photoUrl: string | null;
  isHafiz: boolean;
  isActive: boolean;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function GuardianStudentCard({
  s,
  onSelect,
}: {
  s: GuardianStudentSummary;
  onSelect: (id: string) => void;
}) {
  const { t, dir } = useApp();
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onSelect(s.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(s.id);
        }
      }}
      className="group cursor-pointer border-0 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <CardContent className="flex items-center gap-3 p-3 sm:p-4">
        <Avatar className="size-12 shrink-0 ring-2 ring-emerald-500/20">
          {s.photoUrl ? <AvatarImage src={s.photoUrl} alt={s.name} /> : null}
          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-semibold text-white">
            {initials(s.name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1" dir={dir()}>
          <div className="flex items-center gap-2">
            <h4 className="truncate text-sm font-semibold sm:text-base">{s.name}</h4>
            {s.isHafiz && (
              <Badge variant="secondary" className="shrink-0 gap-1 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <BookOpenCheck className="size-3" /> {t("guardian.hafiz")}
              </Badge>
            )}
          </div>
          {s.nameArabic && (
            <p dir="rtl" lang="ar" className="truncate text-xs text-muted-foreground">
              {s.nameArabic}
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
            {s.rollNo && (
              <span className="inline-flex items-center gap-1">
                <BadgeCheck className="size-3 text-emerald-600" /> {t("guardian.roll")}: {s.rollNo}
              </span>
            )}
            {s.className && (
              <span className="inline-flex items-center gap-1">
                <GraduationCap className="size-3 text-teal-600" /> {s.className}
              </span>
            )}
            {s.tenantName && (
              <span className="inline-flex items-center gap-1">
                <Building2 className="size-3 text-violet-600" /> {s.tenantName}
              </span>
            )}
          </div>
        </div>

        <ChevronRight
          className={`size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 ${
            dir() === "rtl" ? "rotate-180 group-hover:-translate-x-0.5" : ""
          }`}
        />
      </CardContent>
    </Card>
  );
}
