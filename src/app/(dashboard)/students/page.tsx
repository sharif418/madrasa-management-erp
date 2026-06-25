// Route page for /students — lazy-loads the StudentsView module.
"use client";
import { lazy, Suspense } from "react";
import { ViewLoadingSkeleton } from "@/components/shell/view-loading-skeleton";

const Module = lazy(() =>
  import("@/modules/students/students-view").then((m) => ({ default: m.StudentsView })),
);

export default function Page() {
  return (
    <Suspense fallback={<ViewLoadingSkeleton />}>
      <Module />
    </Suspense>
  );
}
