// TanStack Query hooks for Students CRUD
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StudentInput, StudentListResponse, Student, StudentClass } from "./types";

type ListParams = {
  search?: string;
  classId?: string;
  gender?: string;
  page?: number;
  limit?: number;
};

function buildQS(params: ListParams) {
  const sp = new URLSearchParams();
  if (params.search) sp.set("search", params.search);
  if (params.classId) sp.set("classId", params.classId);
  if (params.gender) sp.set("gender", params.gender);
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

async function parseRes<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({ ok: false, error: "Invalid response" }));
  if (!json.ok) throw new Error(json.error || "Request failed");
  return json.data as T;
}

export function useStudents(params: ListParams) {
  return useQuery({
    queryKey: ["students", "list", params],
    queryFn: async () => {
      const res = await fetch(`/api/students${buildQS(params)}`, {
        credentials: "same-origin",
      });
      return parseRes<StudentListResponse>(res);
    },
    placeholderData: (prev) => prev,
  });
}

export function useClasses() {
  return useQuery({
    queryKey: ["students", "classes"],
    queryFn: async () => {
      const res = await fetch("/api/students/classes", { credentials: "same-origin" });
      const data = await parseRes<{ items: StudentClass[] }>(res);
      return data.items;
    },
    staleTime: 60_000,
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: StudentInput) => {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(input),
      });
      return parseRes<Student>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: StudentInput }) => {
      const res = await fetch(`/api/students/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(input),
      });
      return parseRes<Student>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/students/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      return parseRes<{ id: string }>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });
}
