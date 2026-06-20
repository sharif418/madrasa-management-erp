// Saved searches store — persists user-defined filter combinations per module.
"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type SavedSearch = {
  id: string;
  name: string;
  module: string;
  filters: Record<string, unknown>;
  createdAt: number;
};

type SavedSearchesState = {
  savedSearches: SavedSearch[];
  addSearch: (name: string, module: string, filters: Record<string, unknown>) => void;
  removeSearch: (id: string) => void;
  getSearchesByModule: (module: string) => SavedSearch[];
};

export const useSavedSearches = create<SavedSearchesState>()(
  persist(
    (set, get) => ({
      savedSearches: [],
      addSearch: (name, module, filters) =>
        set((s) => ({
          savedSearches: [
            {
              id: `ss_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              name: name.trim(),
              module,
              filters,
              createdAt: Date.now(),
            },
            ...s.savedSearches,
          ],
        })),
      removeSearch: (id) =>
        set((s) => ({ savedSearches: s.savedSearches.filter((x) => x.id !== id) })),
      getSearchesByModule: (module) =>
        get().savedSearches.filter((x) => x.module === module),
    }),
    {
      name: "mm-saved-searches",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
