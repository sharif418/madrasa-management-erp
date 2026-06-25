// Global client state: auth, view navigation, language, theme
"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Locale } from "@/i18n/translations";
import { translate, localeDirs } from "@/i18n/translations";

// Navigation keys kept for type compatibility with translation files if needed,
// but actual navigation state is now driven by Next.js URL routing.
export type ViewKey = string;

type AuthScreen = "landing" | "login" | "signup";

export type SessionUser = {
  userId: string;
  tenantId: string;
  name: string;
  phone: string;
  roles: string[];
};

type AppState = {
  // Auth
  screen: AuthScreen;
  user: SessionUser | null;
  tenantName: string | null;
  setUser: (user: SessionUser | null, tenantName?: string | null) => void;
  setScreen: (s: AuthScreen) => void;
  logout: () => void;

  // Navigation state is now handled by Next.js URL router

  // Language
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dir: () => "ltr" | "rtl";

  // Theme
  themeColor: string;
  setThemeColor: (c: string) => void;

  // Sidebar (mobile)
  sidebarOpen: boolean;
  setSidebarOpen: (o: boolean) => void;
};

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      screen: "landing",
      user: null,
      tenantName: null,
      setUser: (user, tenantName = null) =>
        set({ user, tenantName, screen: user ? "landing" : "landing" }),
      setScreen: (s) => set({ screen: s }),
      logout: () => {
        set({ user: null, tenantName: null, screen: "landing" });
      },

      locale: "bn",
      setLocale: (l) => set({ locale: l }),
      t: (key, params) => translate(get().locale, key, params),
      dir: () => localeDirs[get().locale],

      themeColor: "emerald",
      setThemeColor: (c) => set({ themeColor: c }),

      sidebarOpen: false,
      setSidebarOpen: (o) => set({ sidebarOpen: o }),
    }),
    {
      name: "mm-app-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        locale: s.locale,
        themeColor: s.themeColor,
        user: s.user,
        tenantName: s.tenantName,
        screen: s.screen,
      }),
    }
  )
);
