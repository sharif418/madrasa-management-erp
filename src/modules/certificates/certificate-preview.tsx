// Live preview of the certificate — visually mirrors the PDF output.
// Decorative CSS border (emerald + gold), madrasa name, title banner,
// student name, body text, date, signature line + drawn seal.
"use client";
import { Award, BookMarked, Trophy, Medal, Sparkles } from "lucide-react";
import { useApp } from "@/store/app-store";
import type { CertType, CertStudent, CertTenant } from "./certificate-types";

const TITLE_KEY: Record<CertType, string> = {
  completion: "certificates.completion",
  hifz: "certificates.hifz",
  merit: "certificates.merit",
  participation: "certificates.participation",
};

const TYPE_ICON: Record<CertType, typeof Award> = {
  completion: Award,
  hifz: BookMarked,
  merit: Trophy,
  participation: Medal,
};

const ISLAMIC_PATTERN_STYLE: React.CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='%23047857' stroke-width='1'><polygon points='20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14'/></g></svg>\")",
  backgroundSize: "40px 40px",
  backgroundRepeat: "repeat",
};

function formatHijri(date: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
      calendar: "islamic", day: "2-digit", month: "long", year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

export type CertificatePreviewProps = {
  student: CertStudent | null;
  tenant: CertTenant | null;
  certificateType: CertType;
  customText: string;
};

export function CertificatePreview({
  student, tenant, certificateType, customText,
}: CertificatePreviewProps) {
  const { t, dir, locale } = useApp();
  const tenantName = tenant?.name || "Madrasa";
  const contactParts = [tenant?.address, tenant?.phone, tenant?.email].filter(Boolean);
  const now = new Date();
  const gregStr = now.toLocaleDateString(locale === "ar" ? "ar-SA" : locale === "bn" ? "bn-BD" : "en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const hijriStr = formatHijri(now, locale);
  const TypeIcon = TYPE_ICON[certificateType];
  const title = t(TITLE_KEY[certificateType]);
  const bodyVerb = certificateType === "completion"
    ? t("certificates.hasSuccessfullyCompleted") + " " + t("certificates.courseProgram")
    : certificateType === "hifz"
      ? t("certificates.hasSuccessfullyCompleted") + " " + t("certificates.hifzProgram")
      : certificateType === "merit"
        ? t("certificates.hasSuccessfullyCompleted") + " " + t("certificates.meritProgram")
        : t("certificates.hasSuccessfullyCompleted") + " " + t("certificates.participationProgram");

  return (
    <div dir={dir()} className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Sparkles className="size-4 text-amber-500" />
        {t("certificates.preview")}
      </div>

      {/* The certificate — A4 landscape aspect ratio */}
      <div
        className="relative w-full overflow-hidden rounded-lg shadow-xl ring-1 ring-emerald-900/10"
        style={{ aspectRatio: "297 / 210", background: "linear-gradient(135deg, #fdfbeb 0%, #fef9e7 100%)" }}
      >
        {/* Decorative triple border */}
        <div className="pointer-events-none absolute inset-2 rounded border-[3px] border-emerald-600" />
        <div className="pointer-events-none absolute inset-3 rounded border-[1.5px] border-amber-500/80" />
        <div className="pointer-events-none absolute inset-4 rounded border border-emerald-800/60" />

        {/* Islamic pattern overlay (subtle) */}
        <div
          className="pointer-events-none absolute inset-5 opacity-[0.04]"
          aria-hidden="true"
          style={ISLAMIC_PATTERN_STYLE}
        />

        {/* Corner stars */}
        {[
          "top-4 left-4", "top-4 right-4", "bottom-4 left-4", "bottom-4 right-4",
        ].map((pos) => (
          <svg
            key={pos}
            className={`pointer-events-none absolute ${pos} size-5 text-amber-500`}
            viewBox="0 0 40 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <polygon points="20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14" />
          </svg>
        ))}

        {/* Content */}
        <div className="relative flex h-full flex-col items-center justify-between px-[5%] py-[4%] text-center">
          {/* Top emerald band */}
          <div className="relative w-full">
            <div className="flex items-center justify-center gap-2 rounded bg-gradient-to-r from-emerald-600 to-teal-600 py-1.5 text-[10px] font-medium italic text-white shadow-sm ring-1 ring-amber-500/60 sm:text-xs">
              {t("certificates.bismillah")}
            </div>
            {/* Madrasa name */}
            <h2 className="mt-2.5 text-lg font-bold uppercase tracking-wide text-emerald-800 sm:text-xl md:text-2xl">
              {tenantName}
            </h2>
            {contactParts.length > 0 && (
              <p className="mt-0.5 text-[8px] text-slate-500 sm:text-[9px] md:text-[10px]" dir="ltr">
                {contactParts.join("  ·  ")}
              </p>
            )}
            {/* Gold divider */}
            <div className="mx-auto mt-2 flex items-center justify-center gap-1.5">
              <span className="h-px w-16 bg-amber-500/70 sm:w-20 md:w-24" />
              <span className="size-1.5 rotate-45 bg-amber-500" />
              <span className="h-px w-16 bg-amber-500/70 sm:w-20 md:w-24" />
            </div>
          </div>

          {/* Title banner */}
          <div className="my-1 flex items-center gap-2 rounded-md bg-gradient-to-r from-emerald-700 to-teal-700 px-5 py-1.5 text-white shadow-md ring-1 ring-amber-500/70 sm:px-7 sm:py-2">
            <TypeIcon className="size-3.5 shrink-0 sm:size-4" />
            <span className="text-sm font-bold uppercase tracking-wider sm:text-base md:text-lg">
              {title}
            </span>
            <TypeIcon className="size-3.5 shrink-0 sm:size-4" />
          </div>

          {/* Student section */}
          <div className="flex w-full flex-col items-center">
            <p className="text-[9px] italic text-slate-500 sm:text-[10px] md:text-xs">
              {t("certificates.thisIsToCertify")}
            </p>
            {student ? (
              <>
                <p className="mt-1 max-w-full truncate text-base font-bold text-slate-800 sm:text-xl md:text-2xl">
                  {student.name}
                </p>
                {student.nameArabic && (
                  <p className="mt-0.5 text-xs text-emerald-700 sm:text-sm md:text-base" dir="rtl">
                    {student.nameArabic}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-1 text-base font-bold text-slate-300 sm:text-xl md:text-2xl">
                —
              </p>
            )}
            {/* Underline */}
            <div className="mt-1.5 h-px w-20 bg-amber-500/70 sm:w-28 md:w-36" />
          </div>

          {/* Body sentence */}
          <div className="space-y-0.5">
            <p className="text-[9px] text-slate-700 sm:text-[11px] md:text-sm">
              {student ? `${student.name} ` : ""}
              {bodyVerb}
            </p>
            <p className="text-xs font-bold text-emerald-800 sm:text-sm md:text-base">
              {tenantName}
            </p>
            {student?.className && (certificateType === "completion" || certificateType === "participation") && (
              <p className="text-[9px] italic text-slate-500 sm:text-[10px] md:text-xs">
                ({locale === "ar" ? "الصف" : locale === "bn" ? "শ্রেণী" : "Class"}: {student.className})
              </p>
            )}
            {certificateType === "hifz" && (
              <p className="text-[9px] italic text-emerald-700 sm:text-[10px] md:text-xs">
                {locale === "ar" ? "تقبل الله منه" : locale === "bn" ? "আল্লাহ্‌ কবুল করুন" : "May Allah accept"}
              </p>
            )}
            {customText.trim() && (
              <p className="mx-auto mt-1 max-w-[70%] text-[9px] italic text-slate-500 sm:text-[10px] md:text-xs">
                &ldquo;{customText.trim().slice(0, 120)}{customText.trim().length > 120 ? "…" : ""}&rdquo;
              </p>
            )}
          </div>

          {/* Footer: dates + signature + seal */}
          <div className="grid w-full grid-cols-3 items-end gap-2 pt-1">
            {/* Left: dates */}
            <div className="text-left text-[8px] sm:text-[9px] md:text-[10px]" dir="ltr">
              <p className="text-slate-500">
                <span className="font-bold">{t("certificates.date")}: </span>
                {gregStr}
              </p>
              {hijriStr && (
                <p className="text-slate-500">
                  <span className="font-bold">{t("certificates.hijriDate")}: </span>
                  {hijriStr}
                </p>
              )}
            </div>

            {/* Center: signature */}
            <div className="flex flex-col items-center">
              <div className="mb-0.5 h-px w-20 bg-slate-700 sm:w-24 md:w-28" />
              <p className="text-[8px] font-bold text-slate-700 sm:text-[9px] md:text-[10px]">
                {t("certificates.principal")}
              </p>
              <p className="text-[7px] text-slate-500 sm:text-[8px]" dir="ltr">
                {tenantName}
              </p>
            </div>

            {/* Right: seal */}
            <div className="flex justify-end">
              <div className="relative grid size-12 place-items-center rounded-full border-2 border-emerald-700 bg-amber-50/60 sm:size-14 md:size-16">
                <div className="absolute inset-1.5 rounded-full border border-amber-500/70" />
                <div className="text-center leading-tight">
                  <p className="text-[6px] font-bold text-emerald-800 sm:text-[7px] md:text-[8px]">
                    {t("certificates.seal").split(" ")[0]}
                  </p>
                  <p className="text-[6px] font-bold text-emerald-800 sm:text-[7px] md:text-[8px]">
                    {t("certificates.seal").split(" ").slice(1).join(" ") || "·"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom emerald band */}
          <div className="mt-1 w-full rounded bg-gradient-to-r from-emerald-600 to-teal-600 py-1 text-center text-[8px] italic text-white shadow-sm ring-1 ring-amber-500/60 sm:text-[9px] md:text-[10px]">
            {locale === "ar" ? "جزاكم الله خيراً" : locale === "bn" ? "জাযাকাল্লাহু খাইরান" : "Jazakallahu Khairan"}
          </div>
        </div>
      </div>
    </div>
  );
}
