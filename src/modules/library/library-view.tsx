"use client";
// LibraryView — main shell: header (amber→orange gradient) + Catalog/Lendings tabs.
import * as React from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Library as LibraryIcon, BookOpen, BookCheck } from "lucide-react";
import { useApp } from "@/store/app-store";
import { LibraryCatalogTab } from "./library-catalog-tab";
import { LibraryLendingsTab } from "./library-lendings-tab";

export function LibraryView() {
  const { t, dir } = useApp();

  return (
    <div className="space-y-6" dir={dir()}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-600/20 ring-1 ring-white/30">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.15]"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='white' stroke-width='1'><polygon points='20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14'/></g></svg>\")",
                backgroundSize: "40px 40px",
                backgroundRepeat: "repeat",
              }}
            />
            <LibraryIcon className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("library.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("library.subtitle")}</p>
          </div>
        </div>
        <Badge variant="outline" className="self-start sm:self-auto px-2.5 py-1 text-xs">
          <BookOpen className="size-3 me-1" />
          {t("library.catalog")}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="catalog" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="catalog" className="gap-1.5">
            <BookOpen className="size-3.5" /> {t("library.catalog")}
          </TabsTrigger>
          <TabsTrigger value="lendings" className="gap-1.5">
            <BookCheck className="size-3.5" /> {t("library.lendings")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <LibraryCatalogTab />
          </motion.div>
        </TabsContent>

        <TabsContent value="lendings" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <LibraryLendingsTab />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
