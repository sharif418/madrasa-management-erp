"use client";

import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function ClassesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl border overflow-hidden">
          <Skeleton className="h-20 w-full rounded-none" />
          <div className="px-4 pb-4 pt-3 space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-14" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
      ))}
      <span className="sr-only" aria-live="polite">
        <Loader2 className="size-4 animate-spin" />
        Loading classes...
      </span>
    </div>
  );
}

export function SubjectsSkeleton() {
  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="border-b bg-muted/40 px-4 py-3">
        <Skeleton className="h-4 w-40" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b last:border-0">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="h-4 flex-1 max-w-48" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="size-8 rounded-md" />
        </div>
      ))}
      <span className="sr-only" aria-live="polite">
        <Loader2 className="size-4 animate-spin" />
        Loading subjects...
      </span>
    </div>
  );
}
