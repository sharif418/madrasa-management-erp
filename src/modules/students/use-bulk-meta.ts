"use client";
// useBulkMetadata — fetches fee structures + classes for bulk action dialogs
import { useQuery } from "@tanstack/react-query";

export type BulkFeeStructure = {
  id: string;
  name: string;
  amount: number;
  type: string;
  frequency: string;
  classId: string | null;
};

export type BulkClass = {
  id: string;
  name: string;
  code?: string | null;
  level?: number | null;
};

type BulkMeta = { feeStructures: BulkFeeStructure[]; classes: BulkClass[] };

export function useBulkMetadata() {
  return useQuery({
    queryKey: ["students", "bulk-meta"],
    queryFn: async () => {
      const res = await fetch("/api/students/bulk", { credentials: "same-origin" });
      const json = await res.json().catch(() => ({ ok: false }));
      if (!json.ok) throw new Error(json.error || "Failed to load bulk metadata");
      return json.data as BulkMeta;
    },
    staleTime: 60_000,
  });
}
