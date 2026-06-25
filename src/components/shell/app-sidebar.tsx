// App sidebar — module navigation with 8 collapsible domain groups.
// Premium-feel navigation inspired by Linear / Notion / Vercel dashboards:
//   • domain-based groups (Overview, People, Academic, Quran & Ibadah, Finance,
//     Operations, Communication, Tools & System)
//   • each group is collapsible (click header to toggle) — true accordion mode
//   • RBAC: menu items filtered by user roles
//   • URL-based navigation using Next.js <Link>
//   • inline search/filter box
//   • dark emerald gradient (always dark, even in light theme)
//   • brand header + user footer preserved from previous design
"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/store/app-store";
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
  ChevronDown, ShieldCheck, Stethoscope, UtensilsCrossed, Activity,
  Search,
  type LucideIcon,
} from "lucide-react";

// ─── Route mapping ────────────────────────────────────────────────
// Each view key maps to a URL path under /(dashboard)/
const VIEW_ROUTES: Record<string, string> = {
  dashboard: "/dashboard",
  analytics: "/analytics",
  dailyreport: "/dailyreport",
  students: "/students",
  teachers: "/teachers",
  admission: "/admission",
  alumni: "/alumni",
  ptm: "/ptm",
  academic: "/academic",
  timetable: "/timetable",
  attendance: "/attendance",
  exams: "/exams",
  seatplan: "/seatplan",
  hifz: "/hifz",
  quranlog: "/quranlog",
  muhasaba: "/muhasaba",
  finance: "/finance",
  fees: "/fees",
  waivers: "/waivers",
  wallet: "/wallet",
  donors: "/donors",
  zakat: "/zakat",
  hostel: "/hostel",
  library: "/library",
  transport: "/transport",
  health: "/health",
  infirmary: "/infirmary",
  security: "/security",
  mess: "/mess",
  inventory: "/inventory",
  calendar: "/calendar",
  notices: "/notices",
  communications: "/communications",
  feedback: "/feedback",
  website: "/website",
  reports: "/reports",
  customreports: "/customreports",
  idcards: "/idcards",
  certificates: "/certificates",
  import: "/import",
  backup: "/backup",
  ai: "/ai",
  billing: "/billing",
  activity: "/activity",
  settings: "/settings",
  audit: "/audit",
};

// ─── RBAC Role → Module Permission Map ────────────────────────────
// Defines which roles can see which sidebar items.
// "Super Admin" and roles with "*" see everything (handled in code).
const ROLE_MODULE_ACCESS: Record<string, string[] | "*"> = {
  "Super Admin": "*",
  Admin: "*",
  Principal: [
    "dashboard", "analytics", "dailyreport",
    "students", "teachers", "admission", "alumni", "ptm",
    "academic", "timetable", "attendance", "exams", "seatplan",
    "hifz", "quranlog", "muhasaba",
    "finance", "fees", "waivers", "wallet", "donors", "zakat",
    "hostel", "library", "transport", "health", "infirmary", "security", "mess", "inventory", "calendar",
    "notices", "communications", "feedback", "website",
    "reports", "customreports", "idcards", "certificates", "import", "backup",
    "ai", "activity", "settings", "audit",
  ],
  Teacher: [
    "dashboard", "dailyreport",
    "students", "ptm",
    "academic", "timetable", "attendance", "exams", "seatplan",
    "hifz", "quranlog", "muhasaba",
    "notices", "feedback",
    "calendar", "library",
    "reports",
  ],
  Accountant: [
    "dashboard", "analytics", "dailyreport",
    "students",
    "finance", "fees", "waivers", "wallet", "donors", "zakat",
    "reports", "customreports",
    "billing",
    "notices",
  ],
  Librarian: [
    "dashboard",
    "library",
    "notices",
  ],
  Warden: [
    "dashboard",
    "students",
    "hostel", "mess", "security",
    "health", "infirmary",
    "attendance",
    "notices", "feedback",
  ],
  Parent: [
    "dashboard",
    "students",
    "hifz", "quranlog",
    "fees",
    "attendance", "exams",
    "notices",
    "feedback",
  ],
  Student: [
    "dashboard",
    "hifz", "quranlog", "muhasaba",
    "attendance", "exams",
    "notices",
    "library",
  ],
};

// ─── Navigation structure ─────────────────────────────────────────
type NavItem = { key: string; icon: LucideIcon };
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
      { key: "zakat", icon: Gift },
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
      { key: "infirmary", icon: Stethoscope },
      { key: "security", icon: ShieldCheck },
      { key: "mess", icon: UtensilsCrossed },
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
      { key: "activity", icon: Activity },
      { key: "settings", icon: Settings },
      { key: "audit", icon: History },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────

/** Check if a user's roles grant access to a module key */
function hasAccess(roles: string[], moduleKey: string): boolean {
  for (const role of roles) {
    const access = ROLE_MODULE_ACCESS[role];
    if (access === "*") return true;
    if (Array.isArray(access) && access.includes(moduleKey)) return true;
  }
  return false;
}

/** Get the active view key from pathname */
function getActiveKey(pathname: string): string {
  // Strip leading slash and get the first segment
  const segment = pathname.replace(/^\//, "").split("/")[0];
  return segment || "dashboard";
}

// ─── Component ────────────────────────────────────────────────────

export function AppSidebar() {
  const { t, sidebarOpen, setSidebarOpen, tenantName, user } = useApp();
  const pathname = usePathname();
  const activeKey = getActiveKey(pathname);

  // Inline search/filter
  const [searchQuery, setSearchQuery] = useState("");

  // True accordion — only one group open at a time (plus active group auto-open)
  const activeGroupId = GROUPS.find((g) => g.items.some((it) => it.key === activeKey))?.id ?? "overview";
  const [openGroupId, setOpenGroupId] = useState<string>(activeGroupId);

  const toggle = (id: string) => {
    setOpenGroupId((prev) => (prev === id ? "" : id));
  };

  // Always expand the group containing the active item
  const isExpanded = (id: string) => id === activeGroupId || id === openGroupId;

  // RBAC-filtered groups — memoized so it doesn't re-compute on every render
  const userRoles = user?.roles ?? [];
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return GROUPS.map((g) => {
      // Filter items by role access
      let items = g.items.filter((item) => hasAccess(userRoles, item.key));

      // Filter by search query (match against translated label)
      if (q) {
        items = items.filter((item) => {
          const label = t(`nav.${item.key}`).toLowerCase();
          return label.includes(q) || item.key.includes(q);
        });
      }

      return { ...g, items };
    }).filter((g) => g.items.length > 0); // Remove empty groups
  }, [userRoles, searchQuery, t]);

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
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-emerald-950 shadow-md">
              <Moon className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-sm font-bold truncate">{tenantName || t("common.appName")}</span>
              <span className="text-[10px] text-emerald-300/70">{t("common.tagline")}</span>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-emerald-100 hover:bg-emerald-800/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Inline Search */}
        <div className="px-3 pt-3 pb-1">
          <div className="relative">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-400/60" />
            <input
              type="text"
              placeholder={t("common.search") || "Search..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md bg-emerald-800/30 border border-emerald-700/30 py-1.5 ps-8 pe-3 text-xs text-emerald-100 placeholder:text-emerald-400/50 outline-none focus:border-emerald-500/50 focus:bg-emerald-800/50 transition-colors"
            />
          </div>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 px-3 py-3">
          <nav className="space-y-2">
            {filteredGroups.map((g) => {
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
                        const href = VIEW_ROUTES[item.key] || `/${item.key}`;
                        const active = activeKey === item.key;
                        return (
                          <Link
                            key={item.key}
                            href={href}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                              "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                              active
                                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-900/50"
                                : "text-emerald-100/80 hover:bg-emerald-800/40 hover:text-white"
                            )}
                          >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{t(`nav.${item.key}`)}</span>
                          </Link>
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
