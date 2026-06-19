"use client";
// Import/Export module — main view with header + Import/Export tabs.
// Import tab: 2 cards (students + teachers) with drag-and-drop CSV upload + results.
// Export tab: 4 export cards + a fee receipt lookup that opens print-friendly HTML.
import { useState } from "react";
import { ArrowUpDown, Upload, Download, Users, GraduationCap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from "@/store/app-store";
import { ImportCard } from "./import-card";
import { ExportCards } from "./export-cards";
import {
  STUDENTS_CSV_TEMPLATE,
  TEACHERS_CSV_TEMPLATE,
  STUDENTS_COLUMNS,
  TEACHERS_COLUMNS,
} from "./csv-templates";

export function ImportExportView() {
  const { t, dir, tenantName } = useApp();
  const [tab, setTab] = useState<"import" | "export">("import");

  return (
    <div dir={dir()} className="space-y-6">
      {/* Header — gradient icon tile + Islamic pattern overlay */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/20 ring-1 ring-white/30">
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
            <ArrowUpDown className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("importExport.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("importExport.subtitle")}
              {tenantName ? ` · ${tenantName}` : ""}
            </p>
          </div>
        </div>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "import" | "export")}>
        <TabsList>
          <TabsTrigger value="import">
            <Upload className="size-4" />
            {t("importExport.import")}
          </TabsTrigger>
          <TabsTrigger value="export">
            <Download className="size-4" />
            {t("importExport.export")}
          </TabsTrigger>
        </TabsList>

        {/* Import tab — two cards side-by-side */}
        <TabsContent value="import" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ImportCard
              title={t("importExport.importStudents")}
              hint={t("importExport.importHint")}
              icon={<Users className="size-5" />}
              endpoint="/api/import/students"
              templateFilename="students-template.csv"
              templateContent={STUDENTS_CSV_TEMPLATE}
              columns={STUDENTS_COLUMNS}
              accent="emerald"
            />
            <ImportCard
              title={t("importExport.importTeachers")}
              hint={t("importExport.importHint")}
              icon={<GraduationCap className="size-5" />}
              endpoint="/api/import/teachers"
              templateFilename="teachers-template.csv"
              templateContent={TEACHERS_CSV_TEMPLATE}
              columns={TEACHERS_COLUMNS}
              accent="teal"
            />
          </div>
        </TabsContent>

        {/* Export tab — 4 export cards + fee receipt lookup */}
        <TabsContent value="export" className="mt-4">
          <ExportCards />
        </TabsContent>
      </Tabs>
    </div>
  );
}
