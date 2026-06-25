// Route page for /import — lazy-loads the ImportExportView module.
"use client";
import { lazy, Suspense } from "react";
import { ViewLoadingSkeleton } from "@/components/shell/view-loading-skeleton";

const Module = lazy(() =>
  import("@/modules/import-export/import-export-view").then((m) => ({ default: m.ImportExportView })),
);

export default function Page() {
  return (
    <Suspense fallback={<ViewLoadingSkeleton />}>
      <Module />
    </Suspense>
  );
}
