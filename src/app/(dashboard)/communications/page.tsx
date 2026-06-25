// Route page for /communications — lazy-loads the CommunicationsView module.
"use client";
import { lazy, Suspense } from "react";
import { ViewLoadingSkeleton } from "@/components/shell/view-loading-skeleton";

const Module = lazy(() =>
  import("@/modules/communications/communications-view").then((m) => ({ default: m.CommunicationsView })),
);

export default function Page() {
  return (
    <Suspense fallback={<ViewLoadingSkeleton />}>
      <Module />
    </Suspense>
  );
}
