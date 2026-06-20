// Page section type definitions & helpers for the page builder
import type { LucideIcon } from "lucide-react";
import {
  LayoutTemplate, FileText, BarChart3, LayoutGrid,
  Images, Phone, Megaphone,
} from "lucide-react";

export type SectionType =
  | "hero" | "text" | "stats" | "features"
  | "gallery" | "contact" | "cta";

export type SectionItem = {
  label?: string;
  number?: string;
  title?: string;
  description?: string;
  icon?: string;
  image?: string;
};

export type PageSection = {
  id: string;
  type: SectionType;
  title?: string;
  subtitle?: string;
  content?: string;
  ctaText?: string;
  items?: SectionItem[];
};

export type PageMeta = {
  id?: string;
  title: string;
  slug: string;
  sections: PageSection[];
  isPublished: boolean;
  isHomepage: boolean;
};

export const SECTION_META: Record<
  SectionType,
  { icon: LucideIcon; i18nKey: string }
> = {
  hero: { icon: LayoutTemplate, i18nKey: "website.sectionHero" },
  text: { icon: FileText, i18nKey: "website.sectionText" },
  stats: { icon: BarChart3, i18nKey: "website.sectionStats" },
  features: { icon: LayoutGrid, i18nKey: "website.sectionFeatures" },
  gallery: { icon: Images, i18nKey: "website.sectionGallery" },
  contact: { icon: Phone, i18nKey: "website.sectionContact" },
  cta: { icon: Megaphone, i18nKey: "website.sectionCTA" },
};

export const SECTION_ORDER: SectionType[] = [
  "hero", "text", "stats", "features", "gallery", "contact", "cta",
];

export function newSection(type: SectionType): PageSection {
  const id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const base: PageSection = { id, type };
  switch (type) {
    case "hero":
      return {
        ...base,
        title: "Welcome to Our Madrasa",
        subtitle: "Nurturing faith, knowledge & excellence",
        ctaText: "Learn More",
      };
    case "text":
      return { ...base, title: "About Us", content: "Write your paragraph here." };
    case "stats":
      return {
        ...base,
        title: "Our Impact",
        items: [
          { number: "500", label: "Students" },
          { number: "30", label: "Teachers" },
          { number: "25", label: "Years" },
        ],
      };
    case "features":
      return {
        ...base,
        title: "Our Programs",
        items: [
          { title: "Hifz Program", description: "Complete Quran memorization" },
          { title: "Alia Program", description: "Government-recognized education" },
          { title: "Qawmi Program", description: "Traditional Islamic education" },
        ],
      };
    case "gallery":
      return {
        ...base,
        title: "Gallery",
        items: [
          { image: "", title: "Image 1" },
          { image: "", title: "Image 2" },
          { image: "", title: "Image 3" },
        ],
      };
    case "contact":
      return {
        ...base,
        title: "Contact Us",
        items: [
          { label: "Phone", description: "+880…" },
          { label: "Email", description: "info@madrasa.edu" },
          { label: "Address", description: "Your address here" },
        ],
      };
    case "cta":
      return {
        ...base,
        title: "Ready to Join?",
        subtitle: "Apply for admission today",
        ctaText: "Apply Now",
      };
  }
}

export function parseSections(raw: string | null | undefined): PageSection[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as PageSection[];
  } catch {
    return [];
  }
}
