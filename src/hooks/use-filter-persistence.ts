"use client";
// Filter persistence hook — saves/loads filter state to localStorage (debounced 500ms).
import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_PREFIX = "mm-filters-";

export function useFilterPersistence<T extends Record<string, unknown>>(
  module: string,
  defaultFilters: T
): [T, (next: Partial<T> | ((prev: T) => T)) => void, () => void] {
  const key = `${STORAGE_PREFIX}${module}`;
  const [filters, setFiltersState] = useState<T>(defaultFilters);
  const hydrated = useRef(false);
  const defaultsRef = useRef(defaultFilters);
  useEffect(() => { defaultsRef.current = defaultFilters; });

  // Hydrate from localStorage on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setFiltersState({ ...defaultsRef.current, ...(parsed as Partial<T>) });
        }
      }
    } catch { /* ignore corrupt entries */ }
    hydrated.current = true;
  }, [key]);

  // Debounced save on change.
  useEffect(() => {
    if (!hydrated.current) return;
    const id = setTimeout(() => {
      try { localStorage.setItem(key, JSON.stringify(filters)); } catch { /* ignore */ }
    }, 500);
    return () => clearTimeout(id);
  }, [filters, key]);

  const setFilters = useCallback(
    (next: Partial<T> | ((prev: T) => T)) => {
      setFiltersState((prev) =>
        typeof next === "function" ? (next as (p: T) => T)(prev) : { ...prev, ...next }
      );
    },
    []
  );

  const resetFilters = useCallback(() => {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
    setFiltersState(defaultsRef.current);
  }, [key]);

  return [filters, setFilters, resetFilters];
}
