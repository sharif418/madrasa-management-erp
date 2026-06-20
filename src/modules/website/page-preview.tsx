"use client";
// PagePreview — simple stacked preview of page sections
import * as React from "react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/store/app-store";
import { type PageSection, SECTION_META } from "./page-section-types";

export function PagePreview({ sections }: { sections: PageSection[] }) {
  const { t, dir } = useApp();

  if (sections.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        {t("website.noPages")}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm" dir={dir()}>
      {sections.map((s) => (
        <SectionPreview key={s.id} section={s} />
      ))}
    </div>
  );
}

function SectionPreview({ section }: { section: PageSection }) {
  const meta = SECTION_META[section.type];
  const Icon = meta.icon;

  switch (section.type) {
    case "hero":
      return (
        <div className="relative bg-gradient-to-br from-emerald-600 to-teal-700 p-8 text-center text-white">
          <div className="relative space-y-2">
            <h2 className="text-2xl font-bold">{section.title}</h2>
            {section.subtitle && <p className="text-sm opacity-90">{section.subtitle}</p>}
            {section.ctaText && (
              <Button size="sm" variant="secondary" className="mt-2">
                {section.ctaText}
              </Button>
            )}
          </div>
        </div>
      );
    case "text":
      return (
        <div className="space-y-2 p-6">
          {section.title && <h3 className="text-lg font-semibold text-emerald-700">{section.title}</h3>}
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{section.content}</p>
        </div>
      );
    case "stats":
      return (
        <div className="bg-emerald-50/50 p-6 dark:bg-emerald-950/10">
          {section.title && <h3 className="mb-3 text-center text-lg font-semibold">{section.title}</h3>}
          <div className="grid grid-cols-3 gap-3">
            {(section.items || []).map((it, i) => (
              <div key={i} className="rounded-lg bg-white p-3 text-center shadow-sm dark:bg-card">
                <div className="text-xl font-bold text-emerald-600">{it.number}</div>
                <div className="text-xs text-muted-foreground">{it.label}</div>
              </div>
            ))}
          </div>
        </div>
      );
    case "features":
      return (
        <div className="p-6">
          {section.title && <h3 className="mb-3 text-lg font-semibold">{section.title}</h3>}
          <div className="grid gap-3 sm:grid-cols-3">
            {(section.items || []).map((it, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-emerald-600" />
                  <h4 className="text-sm font-semibold">{it.title}</h4>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{it.description}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case "gallery":
      return (
        <div className="p-6">
          {section.title && <h3 className="mb-3 text-lg font-semibold">{section.title}</h3>}
          <div className="grid grid-cols-3 gap-2">
            {(section.items || []).map((it, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-md bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                {it.image ? (
                  <img src={it.image} alt={it.title || ""} className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                    {it.title || "Image"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    case "contact":
      return (
        <div className="bg-teal-50/50 p-6 dark:bg-teal-950/10">
          {section.title && <h3 className="mb-3 text-lg font-semibold">{section.title}</h3>}
          <div className="grid gap-2 sm:grid-cols-3">
            {(section.items || []).map((it, i) => (
              <div key={i} className="rounded-lg border bg-white p-3 dark:bg-card">
                <div className="text-xs font-semibold text-emerald-700">{it.label}</div>
                <div className="text-sm">{it.description}</div>
              </div>
            ))}
          </div>
        </div>
      );
    case "cta":
      return (
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 text-center text-white">
          <h3 className="text-lg font-bold">{section.title}</h3>
          {section.subtitle && <p className="text-sm opacity-90">{section.subtitle}</p>}
          {section.ctaText && (
            <Button size="sm" variant="secondary" className="mt-2">{section.ctaText}</Button>
          )}
        </div>
      );
  }
}
