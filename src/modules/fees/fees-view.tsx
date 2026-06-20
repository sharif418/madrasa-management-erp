// FeesView — main shell for Fee Management module.
// Emerald→teal gradient header with Islamic 8-point star pattern + 2 tabs
// (Structures / Collections). RTL-aware via useApp().dir().
"use client";
import { useApp } from "@/store/app-store";
import { Receipt, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { FeeStructuresTab } from "./fee-structures-tab";
import { CollectionsTab } from "./collections-tab";

const ISLAMIC_PATTERN: React.CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='white' stroke-width='1'><polygon points='20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14'/></g></svg>\")",
  backgroundSize: "40px 40px",
  backgroundRepeat: "repeat",
};

export function FeesView() {
  const { t, dir } = useApp();

  return (
    <div dir={dir()} className="space-y-6">
      {/* Header — emerald→teal gradient tile with Islamic 8-point star pattern */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/20 ring-1 ring-white/30">
            <div className="pointer-events-none absolute inset-0 opacity-[0.15]" aria-hidden="true" style={ISLAMIC_PATTERN} />
            <Receipt className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("fees.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("fees.subtitle")}</p>
          </div>
        </div>
      </header>

      <Tabs defaultValue="structures" dir={dir()} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="structures">{t("fees.structures")}</TabsTrigger>
          <TabsTrigger value="collections">{t("fees.collections")}</TabsTrigger>
        </TabsList>
        <TabsContent value="structures" className="mt-4">
          <FeeStructuresTab />
        </TabsContent>
        <TabsContent value="collections" className="mt-4">
          <CollectionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Lazy skeleton (kept for parity with other modules' loading states)
export function FeesViewSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-72" />
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
      <div className="sr-only" aria-live="polite">
        <Loader2 className="size-4 animate-spin" /> Loading fees...
      </div>
    </div>
  );
}
