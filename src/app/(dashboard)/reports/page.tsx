// Route page for /reports — lazy-loads the ReportsView module.
"use client";
import { lazy, Suspense } from "react";
import { ViewLoadingSkeleton } from "@/components/shell/view-loading-skeleton";

const Module = lazy(() =>
  import("@/modules/reports/reports-view").then((m) => ({ default: m.ReportsView })),
);

export default function Page() {
  return (
    <Suspense fallback={<ViewLoadingSkeleton />}>
      <Module />
    </Suspense>
  );
}
