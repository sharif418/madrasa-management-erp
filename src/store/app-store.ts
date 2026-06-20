// Global client state: auth, view navigation, language, theme
"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Locale } from "@/i18n/translations";
import { translate, localeDirs } from "@/i18n/translations";

export type ViewKey =
  | "dashboard"
  | "students"
  | "teachers"
  | "academic"
  | "hifz"
  | "finance"
  | "wallet"
  | "attendance"
  | "exams"
  | "notices"
  | "settings"
  | "audit"
  | "reports"
  | "import"
  | "hostel"
  | "muhasaba"
  | "library"
  | "donors"
  | "calendar"
  | "transport"
  | "health"
  | "inventory"
  | "feedback"
  | "admission"
  | "alumni"
  | "ai"
  | "timetable"
  | "website"
  | "billing"
  | "communications"
  | "analytics"
  | "idcards"
  | "certificates"
  | "dailyreport"
  | "fees";

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

  // Navigation
  view: ViewKey;
  setView: (v: ViewKey) => void;

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
        set({ user: null, tenantName: null, screen: "landing", view: "dashboard" });
      },

      view: "dashboard",
      setView: (v) => set({ view: v, sidebarOpen: false }),

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
        view: s.view,
      }),
    }
  )
);
