// Route page for /security — lazy-loads the SecurityView module.
"use client";
import { lazy, Suspense } from "react";
import { ViewLoadingSkeleton } from "@/components/shell/view-loading-skeleton";

const Module = lazy(() =>
  import("@/modules/security/security-view").then((m) => ({ default: m.SecurityView })),
);

export default function Page() {
  return (
    <Suspense fallback={<ViewLoadingSkeleton />}>
      <Module />
    </Suspense>
  );
}
