// WebsitePreviewTab — mock browser window with a real public-website preview
"use client";
import {
  Heart, GraduationCap, Users, Award, Phone, Mail, MapPin,
  BookOpen, BookMarked, Sparkles, Star, Bell, Calendar,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import type { WebsiteData } from "./website-view";

const ISLAMIC_PATTERN_STYLE: React.CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><g fill='none' stroke='white' stroke-width='1'><polygon points='30,3 37,20 55,20 41,32 47,50 30,40 13,50 19,32 5,20 23,20'/></g></svg>\")",
  backgroundSize: "60px 60px",
  backgroundRepeat: "repeat",
};

const NOTICE_COLORS: Record<string, string> = {
  urgent: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  holiday: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  exam: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
  event: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300",
  general: "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300",
};

const EVENT_GRADIENTS: Record<string, string> = {
  exam: "from-rose-500 to-pink-600",
  holiday: "from-amber-500 to-orange-600",
  islamic: "from-emerald-500 to-teal-600",
  meeting: "from-violet-500 to-purple-600",
  admission: "from-sky-500 to-blue-600",
  result: "from-teal-500 to-cyan-600",
  event: "from-cyan-500 to-teal-600",
};

function formatPublished(iso: string, locale: string) {
  try {
    const lang = locale === "ar" ? "ar" : locale === "bn" ? "bn-BD" : "en-GB";
    return new Intl.DateTimeFormat(lang, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleDateString();
  }
}

function monthLabel(iso: string, locale: string) {
  try {
    const lang = locale === "ar" ? "ar" : locale === "bn" ? "bn-BD" : "en";
    return new Intl.DateTimeFormat(lang, { month: "short" }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function WebsitePreviewTab({
  data, aboutText,
}: { data: WebsiteData; aboutText: string }) {
  const { t, dir, locale } = useApp();
  const { tenant, stats, notices, events } = data;
  const subdomain = tenant.subdomain || "your-madrasa";
  const aboutPara = aboutText.trim() || t("website.aboutDesc");

  const programs = [
    { key: "qawmi", icon: BookOpen, gradient: "from-emerald-500 to-teal-600" },
    { key: "alia", icon: Sparkles, gradient: "from-amber-500 to-orange-600" },
    { key: "hifz", icon: BookMarked, gradient: "from-violet-500 to-purple-600" },
  ];

  const statCards = [
    { label: t("website.activeStudents"), value: stats.activeStudents, icon: Users, gradient: "from-emerald-500 to-teal-600" },
    { label: t("website.alumni"), value: stats.alumni, icon: GraduationCap, gradient: "from-amber-500 to-orange-600" },
    { label: t("website.yearsOfService"), value: stats.yearsOfService, icon: Award, gradient: "from-violet-500 to-purple-600" },
    { label: t("website.ourStaff"), value: stats.staff, icon: Heart, gradient: "from-cyan-500 to-teal-600" },
  ];

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-lg dark:bg-slate-950">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b bg-slate-100 px-4 py-3 dark:bg-slate-900">
        <div className="flex gap-1.5">
          <div className="size-3 rounded-full bg-rose-400" />
          <div className="size-3 rounded-full bg-amber-400" />
          <div className="size-3 rounded-full bg-emerald-400" />
        </div>
        <div className="ms-2 flex flex-1 items-center gap-2 rounded-md bg-white px-3 py-1.5 text-xs text-muted-foreground dark:bg-slate-800">
          <div className="size-3.5 rounded-full border-2 border-emerald-500/30" />
          <span dir="ltr" className="truncate">{subdomain}.madrasa-manager.app</span>
        </div>
        <span className="text-xs text-muted-foreground hidden sm:block">{t("website.viewLive")}</span>
      </div>

      {/* Scrollable preview content */}
      <div className="max-h-[calc(100vh-13rem)] overflow-y-auto" dir={dir()}>
        {/* Hero section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white">
          <div className="pointer-events-none absolute inset-0 opacity-[0.12]" aria-hidden="true" style={ISLAMIC_PATTERN_STYLE} />
          <div className="relative mx-auto max-w-5xl px-6 py-16 text-center sm:py-20">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium backdrop-blur ring-1 ring-white/30">
              <Star className="size-3.5" />
              {t("website.established", { year: stats.establishedYear })}
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">{tenant.name}</h1>
            <p className="mt-2 text-2xl text-white/90" dir="rtl">السلام عليكم ورحمة الله وبركاته</p>
            <p className="mx-auto mt-4 max-w-2xl text-base text-white/80 sm:text-lg">{t("website.tagline")}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 shadow-lg transition hover:bg-emerald-50">
                <Heart className="size-4" /> {t("website.donateNow")}
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/40 backdrop-blur transition hover:bg-white/25">
                <GraduationCap className="size-4" /> {t("website.applyAdmission")}
              </button>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="border-b bg-slate-50 dark:bg-slate-900/50">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 px-6 py-8 sm:grid-cols-4">
            {statCards.map((s) => (
              <div key={s.label} className="flex flex-col items-center text-center">
                <div className={`mb-2 grid size-12 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md ${s.gradient}`}>
                  <s.icon className="size-6" />
                </div>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{s.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* About section */}
        <section className="bg-white py-12 dark:bg-slate-950">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("website.aboutUs")}</h2>
            <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600" />
            <p className="mx-auto mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">{aboutPara}</p>
          </div>
        </section>

        {/* Programs */}
        <section className="bg-slate-50 py-12 dark:bg-slate-900/50">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">{t("website.ourPrograms")}</h2>
            <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600" />
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {programs.map((p) => (
                <div key={p.key} className="rounded-2xl border bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:bg-slate-950">
                  <div className={`mb-4 grid size-12 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md ${p.gradient}`}>
                    <p.icon className="size-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{t(`website.${p.key}Program`)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`website.${p.key}Desc`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Notices + Events */}
        <section className="bg-white py-12 dark:bg-slate-950">
          <div className="mx-auto grid max-w-5xl gap-8 px-6 lg:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Bell className="size-5 text-emerald-600" />
                <h3 className="text-xl font-bold">{t("website.latestNotices")}</h3>
              </div>
              {notices.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("website.noNotices")}</p>
              ) : (
                <div className="space-y-3">
                  {notices.map((n) => (
                    <div key={n.id} className="rounded-lg border bg-slate-50 p-4 dark:bg-slate-900/50">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${NOTICE_COLORS[n.type] || NOTICE_COLORS.general}`}>
                          {n.type}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{formatPublished(n.publishedAt, locale)}</span>
                      </div>
                      <p className="text-sm font-medium leading-snug">{n.title}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Calendar className="size-5 text-emerald-600" />
                <h3 className="text-xl font-bold">{t("website.upcomingEvents")}</h3>
              </div>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("website.noEvents")}</p>
              ) : (
                <div className="space-y-3">
                  {events.map((e) => (
                    <div key={e.id} className="flex items-stretch gap-3 rounded-lg border bg-slate-50 p-4 dark:bg-slate-900/50">
                      <div className={`flex w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-gradient-to-br text-white shadow ${EVENT_GRADIENTS[e.type] || EVENT_GRADIENTS.event}`}>
                        <span className="text-lg font-bold">{new Date(e.startDate).getDate()}</span>
                        <span className="text-[10px] uppercase">{monthLabel(e.startDate, locale)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug">{e.title}</p>
                        {e.location && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" /> <span className="truncate">{e.location}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Contact section */}
        <section className="bg-gradient-to-br from-emerald-50 to-teal-50 py-12 dark:from-slate-900/50 dark:to-emerald-950/20">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("website.contactUs")}</h2>
            <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600" />
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-950">
                <div className="mx-auto mb-3 grid size-12 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                  <Phone className="size-5" />
                </div>
                <p className="text-xs text-muted-foreground">{t("settings.phone")}</p>
                <p dir="ltr" className="mt-1 text-sm font-semibold">{tenant.phone || "—"}</p>
              </div>
              <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-950">
                <div className="mx-auto mb-3 grid size-12 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
                  <Mail className="size-5" />
                </div>
                <p className="text-xs text-muted-foreground">{t("settings.email")}</p>
                <p dir="ltr" className="mt-1 truncate text-sm font-semibold">{tenant.email || "—"}</p>
              </div>
              <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-950">
                <div className="mx-auto mb-3 grid size-12 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md">
                  <MapPin className="size-5" />
                </div>
                <p className="text-xs text-muted-foreground">{t("settings.address")}</p>
                <p className="mt-1 text-sm font-semibold">{tenant.address || "—"}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-emerald-950 px-6 py-8 text-center text-white">
          <p className="text-lg" dir="rtl">{t("website.bismillah")}</p>
          <p className="mt-2 text-sm font-semibold">{tenant.name}</p>
          <p className="mt-1 text-xs text-emerald-200/70">
            © {new Date().getFullYear()} · {t("website.copyright")}
          </p>
        </footer>
      </div>
    </div>
  );
}
