// Route page for /dashboard — lazy-loads the default module.
"use client";
import { lazy, Suspense } from "react";
import { ViewLoadingSkeleton } from "@/components/shell/view-loading-skeleton";

const Module = lazy(() => import("@/modules/dashboard/dashboard-router"));

export default function Page() {
  return (
    <Suspense fallback={<ViewLoadingSkeleton />}>
      <Module />
    </Suspense>
  );
}
