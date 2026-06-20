// App sidebar — module navigation with 8 collapsible domain groups.
// Premium-feel navigation inspired by Linear / Notion / Vercel dashboards:
//   • domain-based groups (Overview, People, Academic, Quran & Ibadah, Finance,
//     Operations, Communication, Tools & System)
//   • each group is collapsible (click header to toggle)
//   • first group expanded by default; the group containing the active view
//     is auto-expanded
//   • dark emerald gradient (always dark, even in light theme)
//   • brand header + user footer preserved from previous design
"use client";
import { useState } from "react";
import { useApp, type ViewKey } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Wallet,
  Bell, BookMarked, ClipboardList, Settings, Banknote, History,
  FileBarChart, Moon, X, ArrowUpDown,
  Bus, HeartPulse, MessageSquare, UserPlus, Package, Send,
  Library, Heart, Calendar, Building2, Sparkles, Bot, CalendarClock, Globe,
  CreditCard, TrendingUp, IdCard, Award, FileText, Receipt, Gift, Armchair,
  CalendarCheck, DatabaseBackup, LayoutList, BookOpenText, FileEdit, ScrollText,
  ChevronDown, type LucideIcon,
} from "lucide-react";

type NavItem = { key: ViewKey; icon: LucideIcon };
type NavGroup = { id: string; label: string; icon: LucideIcon; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    id: "overview",
    label: "nav.overview",
    icon: LayoutDashboard,
    items: [
      { key: "dashboard", icon: LayoutDashboard },
      { key: "analytics", icon: TrendingUp },
      { key: "dailyreport", icon: FileText },
    ],
  },
  {
    id: "people",
    label: "nav.people",
    icon: Users,
    items: [
      { key: "students", icon: Users },
      { key: "teachers", icon: GraduationCap },
      { key: "admission", icon: UserPlus },
      { key: "alumni", icon: Award },
      { key: "ptm", icon: CalendarCheck },
    ],
  },
  {
    id: "academic",
    label: "nav.academic",
    icon: BookOpen,
    items: [
      { key: "academic", icon: BookOpen },
      { key: "timetable", icon: CalendarClock },
      { key: "attendance", icon: ClipboardList },
      { key: "exams", icon: FileEdit },
      { key: "seatplan", icon: Armchair },
    ],
  },
  {
    id: "quranIbadah",
    label: "nav.quranIbadah",
    icon: BookMarked,
    items: [
      { key: "hifz", icon: BookMarked },
      { key: "quranlog", icon: BookOpenText },
      { key: "muhasaba", icon: Sparkles },
    ],
  },
  {
    id: "finance",
    label: "nav.finance",
    icon: Banknote,
    items: [
      { key: "finance", icon: Banknote },
      { key: "fees", icon: Receipt },
      { key: "waivers", icon: Gift },
      { key: "wallet", icon: Wallet },
      { key: "donors", icon: Heart },
    ],
  },
  {
    id: "operations",
    label: "nav.operations",
    icon: Building2,
    items: [
      { key: "hostel", icon: Building2 },
      { key: "library", icon: Library },
      { key: "transport", icon: Bus },
      { key: "health", icon: HeartPulse },
      { key: "inventory", icon: Package },
      { key: "calendar", icon: Calendar },
    ],
  },
  {
    id: "communication",
    label: "nav.communication",
    icon: Send,
    items: [
      { key: "notices", icon: Bell },
      { key: "communications", icon: Send },
      { key: "feedback", icon: MessageSquare },
      { key: "website", icon: Globe },
    ],
  },
  {
    id: "toolsSystem",
    label: "nav.toolsSystem",
    icon: Settings,
    items: [
      { key: "reports", icon: FileBarChart },
      { key: "customreports", icon: LayoutList },
      { key: "idcards", icon: IdCard },
      { key: "certificates", icon: ScrollText },
      { key: "import", icon: ArrowUpDown },
      { key: "backup", icon: DatabaseBackup },
      { key: "ai", icon: Bot },
      { key: "billing", icon: CreditCard },
      { key: "settings", icon: Settings },
      { key: "audit", icon: History },
    ],
  },
];

export function AppSidebar() {
  const { view, setView, t, sidebarOpen, setSidebarOpen, tenantName, user } = useApp();
  // Expanded groups — Overview expanded by default. Active-view's group is
  // force-expanded (independent of this state) so users always see where they are.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ overview: true });

  const activeGroupId = GROUPS.find((g) => g.items.some((it) => it.key === view))?.id;
  const isExpanded = (id: string) => id === activeGroupId || !!expanded[id];
  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 z-50 flex w-72 flex-col bg-gradient-to-b from-emerald-950 via-emerald-900 to-teal-950 text-emerald-50 transition-transform duration-300 lg:translate-x-0 rtl:lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full lg:translate-x-0",
          "start-0"
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-emerald-800/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-emerald-950 shadow-md">
              <Moon className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-sm font-bold truncate">{tenantName || t("common.appName")}</span>
              <span className="text-[10px] text-emerald-300/70">{t("common.tagline")}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-emerald-100 hover:bg-emerald-800/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-3">
            {GROUPS.map((g) => {
              const open = isExpanded(g.id);
              const isActiveGroup = g.id === activeGroupId;
              return (
                <div key={g.id}>
                  <button
                    type="button"
                    onClick={() => toggle(g.id)}
                    aria-expanded={open}
                    className={cn(
                      "group flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-start transition-colors",
                      "hover:bg-emerald-800/40"
                    )}
                  >
                    <g.icon
                      className={cn(
                        "size-3.5 shrink-0 transition-colors",
                        isActiveGroup ? "text-emerald-300" : "text-emerald-400/70"
                      )}
                    />
                    <span
                      className={cn(
                        "flex-1 text-[10px] font-semibold uppercase tracking-wider truncate",
                        isActiveGroup ? "text-emerald-200" : "text-emerald-300/60"
                      )}
                    >
                      {t(g.label)}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-3.5 shrink-0 text-emerald-300/60 transition-transform duration-200",
                        open && "rotate-180 rtl:-rotate-180"
                      )}
                    />
                  </button>
                  {open ? (
                    <div className="mt-1 space-y-0.5 ps-2">
                      {g.items.map((item) => {
                        const active = view === item.key;
                        return (
                          <button
                            key={item.key}
                            onClick={() => setView(item.key)}
                            className={cn(
                              "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                              active
                                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-900/50"
                                : "text-emerald-100/80 hover:bg-emerald-800/40 hover:text-white"
                            )}
                          >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{t(`nav.${item.key}`)}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User footer */}
        <div className="border-t border-emerald-800/50 p-3">
          <div className="flex items-center gap-3 rounded-lg bg-emerald-800/30 px-3 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-emerald-950 font-semibold text-sm">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-[10px] text-emerald-300/70 truncate" dir="ltr">{user?.phone}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
