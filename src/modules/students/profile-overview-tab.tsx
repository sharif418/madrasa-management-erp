"use client";
// ProfileOverviewTab — personal info, guardian info, wallet mini-list, quick stats
import {
  Phone, MapPin, Droplet, Calendar, User, UserCircle, Wallet as WalletIcon,
  BookOpenCheck, Sparkles, CalendarCheck, IndianRupee, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useT } from "./i18n";
import { ProfileData, fmtDate } from "./profile-types";

type Props = { data: ProfileData; locale: string };

export function ProfileOverviewTab({ data, locale }: Props) {
  const t = useT();
  const { student, wallet, hifz, attendance, fees } = data;

  return (
    <div className="space-y-4">
      {/* Quick stats row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickStat
          icon={<BookOpenCheck className="size-4 text-emerald-600" />}
          label={t("studentProfile.totalRecords")}
          value={String(hifz.totalRecords)}
        />
        <QuickStat
          icon={<Sparkles className="size-4 text-amber-500" />}
          label={t("studentProfile.avgQuality")}
          value={hifz.avgQuality > 0 ? `${hifz.avgQuality}/5` : "—"}
        />
        <QuickStat
          icon={<CalendarCheck className="size-4 text-teal-600" />}
          label={t("studentProfile.attendanceRate")}
          value={attendance.last30d.total > 0 ? `${attendance.last30d.rate}%` : "—"}
        />
        <QuickStat
          icon={<IndianRupee className="size-4 text-rose-600" />}
          label={t("studentProfile.feesDue")}
          value={fmtMoney(fees.totalDue)}
          tone={fees.totalDue > 0 ? "danger" : "ok"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Personal info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("studentProfile.personalInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row icon={<Calendar className="size-4 text-muted-foreground" />} label={t("studentProfile.dob")} value={fmtDate(student.dob, locale)} />
            <Row icon={<UserCircle className="size-4 text-muted-foreground" />} label={t("studentProfile.gender")} value={student.gender === "female" ? t("students.female") : t("students.male")} />
            <Row icon={<Droplet className="size-4 text-rose-500" />} label={t("studentProfile.bloodGroup")} value={student.bloodGroup ?? "—"} />
            <Row icon={<Phone className="size-4 text-muted-foreground" />} label={t("studentProfile.phone")} value={student.phone ?? "—"} />
            <Row icon={<MapPin className="size-4 text-muted-foreground" />} label={t("studentProfile.address")} value={student.address ?? "—"} />
            <Row icon={<Calendar className="size-4 text-muted-foreground" />} label={t("studentProfile.admissionDate")} value={fmtDate(student.admissionDate, locale)} />
          </CardContent>
        </Card>

        {/* Guardian info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("studentProfile.guardianInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row icon={<User className="size-4 text-muted-foreground" />} label={t("students.guardianName")} value={student.guardianName ?? "—"} />
            <Row icon={<Phone className="size-4 text-muted-foreground" />} label={t("students.guardianPhone")} value={student.guardianPhone ?? "—"} />
            <Row icon={<UserCircle className="size-4 text-muted-foreground" />} label={t("students.guardianRelation")} value={fmtRelation(student.guardianRelation, t)} />
            {student.guardianPhone && (
              <Button asChild size="sm" className="mt-2 w-full">
                <a href={`tel:${student.guardianPhone}`}>
                  <Phone className="size-4" /> {t("studentProfile.callGuardian")}
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Wallet */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <WalletIcon className="size-4 text-emerald-600" />
                {t("studentProfile.walletBalance")}
              </span>
              <Badge variant="outline" className="text-emerald-700 dark:text-emerald-300">
                {fmtMoney(wallet.balance)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{t("studentProfile.recentTransactions")}</p>
            {wallet.recentLogs.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">{t("studentProfile.noData")}</p>
            ) : (
              <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                {wallet.recentLogs.slice(0, 5).map((l) => {
                  const isCredit = l.amount >= 0;
                  return (
                    <li key={l.id} className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs">
                      <span className={`inline-flex size-6 items-center justify-center rounded-full ${isCredit ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"}`}>
                        {isCredit ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{l.description || l.trxType}</p>
                        <p className="text-muted-foreground">{fmtDate(l.createdAt, locale)}</p>
                      </div>
                      <span className={`font-semibold ${isCredit ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>
                        {isCredit ? "+" : ""}{fmtMoney(l.amount)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickStat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: "ok" | "danger" }) {
  return (
    <Card className="py-4">
      <CardContent className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-muted/60">{icon}</div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className={`text-lg font-semibold leading-tight ${tone === "danger" ? "text-rose-600 dark:text-rose-400" : ""}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);
}

function fmtRelation(rel: string | null, t: (k: string) => string): string {
  if (!rel) return "—";
  const map: Record<string, string> = {
    father: t("students.father"),
    mother: t("students.mother"),
    uncle: t("students.uncle"),
    other: t("students.other"),
  };
  return map[rel] ?? rel;
}
