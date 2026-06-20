// ID Card visual preview — shows what the printed ID card looks like.
// Renders a card with madrasa name header, photo placeholder, name, ID badge,
// blood group, guardian phone, valid dates, and a barcode-like pattern.
"use client";
import { useApp } from "@/store/app-store";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type IdCardPerson = {
  id: string;
  name: string;
  nameArabic?: string | null;
  rollNo?: string | null;
  className?: string | null;
  classId?: string | null;
  designation?: string | null;
  bloodGroup?: string | null;
  guardianPhone?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  dob?: string | null;
};

export type IdCardTenant = {
  name: string;
  logoUrl?: string | null;
  address?: string | null;
  phone?: string | null;
};

type Props = {
  person: IdCardPerson;
  tenant: IdCardTenant | null;
  type: "student" | "teacher";
  selected: boolean;
  onToggle: (id: string) => void;
};

const VALID_UNTIL = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
})();
const ISSUED = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export function IdCardPreview({ person, tenant, type, selected, onToggle }: Props) {
  const { t, dir } = useApp();
  const isRtl = dir() === "rtl";
  const initials = getInitials(person.name);
  const idValue = person.rollNo || person.id.slice(-6).toUpperCase();
  const madrasaName = tenant?.name || t("idcards.madrasa");
  const contact = [tenant?.address, tenant?.phone].filter(Boolean).join("  |  ");

  return (
    <div
      className={cn(
        "group relative rounded-2xl bg-white shadow-md ring-1 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl",
        selected ? "ring-2 ring-emerald-500 shadow-emerald-500/10" : "ring-border",
      )}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Select checkbox overlay */}
      <button
        type="button"
        onClick={() => onToggle(person.id)}
        aria-pressed={selected}
        aria-label={selected ? "Deselect" : "Select"}
        className={cn(
          "absolute z-10 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all",
          selected
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-slate-300 bg-white/90 text-transparent hover:border-emerald-400",
          isRtl ? "left-2" : "right-2",
        )}
      >
        <Check className="h-4 w-4" />
      </button>

      {/* Card body — emerald accent strip on the side */}
      <div className="flex overflow-hidden rounded-2xl">
        <div className="w-1.5 bg-gradient-to-b from-emerald-500 to-teal-500" />
        <div className="flex-1">
          {/* Header — deep emerald band */}
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 px-3 py-2">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><g fill='none' stroke='white' stroke-width='0.8'><polygon points='14,2 17,10 25,10 18.5,15 21,23 14,18 7,23 9.5,15 3,10 11,10'/></g></svg>\")",
                backgroundSize: "28px 28px",
                backgroundRepeat: "repeat",
              }}
            />
            <div className="relative flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-xs font-bold text-white shadow ring-1 ring-white/40">
                {tenant?.logoUrl ? (
                  <img src={tenant.logoUrl} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  "M"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-bold leading-tight text-white">{madrasaName}</p>
                <p className="text-[8px] uppercase tracking-wider text-emerald-200/80">
                  {type === "student" ? t("idcards.student") : t("idcards.staff")} ID Card
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-2 p-3">
            <div className="flex items-start gap-3">
              {/* Photo placeholder */}
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 text-xl font-bold text-emerald-600 ring-2 ring-emerald-200">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold leading-tight text-slate-800">{person.name}</p>
                {person.nameArabic && (
                  <p className="truncate text-xs text-slate-500" dir="rtl">{person.nameArabic}</p>
                )}
                <span className="mt-1 inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                  {t("idcards.idNumber")}: {idValue}
                </span>
              </div>
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {type === "student" ? (
                <>
                  <Detail label={t("idcards.class")} value={person.className} />
                  <Detail label={t("idcards.bloodGroup")} value={person.bloodGroup} />
                  <Detail label={t("idcards.guardianPhone")} value={person.guardianPhone} />
                  <Detail label="DOB" value={person.dob} />
                </>
              ) : (
                <>
                  <Detail label={t("idcards.designation")} value={person.designation} />
                  <Detail label={t("common.phone") || "Phone"} value={person.phone} />
                </>
              )}
            </div>

            {/* Validity + barcode */}
            <div className="flex items-end justify-between gap-2 rounded-lg bg-emerald-50/60 px-2 py-1.5">
              <div className="text-[9px] leading-tight">
                <p className="text-slate-400">Issued: <span className="font-semibold text-slate-600">{ISSUED}</span></p>
                <p className="text-emerald-600">{t("idcards.validUntil")}: <span className="font-bold">{VALID_UNTIL}</span></p>
              </div>
              <BarcodePattern seed={person.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="truncate text-[11px] font-semibold text-slate-700">{value || "—"}</p>
    </div>
  );
}

function BarcodePattern({ seed }: { seed: string }) {
  // Deterministic barcode-like SVG bars based on the id hash
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const bars: { x: number; w: number; skip: boolean }[] = [];
  let cx = 0, i = 0;
  while (cx < 70) {
    const barW = ((hash >> (i % 24)) & 1) ? 3 : 1.5;
    bars.push({ x: cx, w: barW, skip: i % 5 === 0 });
    cx += barW + 1.8;
    i++;
  }
  return (
    <svg width="70" height="22" viewBox="0 0 70 22" aria-hidden="true" className="flex-shrink-0">
      {bars.map((b, idx) =>
        b.skip ? null : <rect key={idx} x={b.x} y={2} width={b.w} height={18} fill="#334155" />,
      )}
    </svg>
  );
}

function getInitials(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
