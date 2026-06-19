// App sidebar — module navigation with grouped sections
"use client";
import { useApp, type ViewKey } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Wallet,
  Bell, BookMarked, ClipboardList, Settings, Banknote, History,
  FileBarChart, Moon, X, ArrowUpDown,
} from "lucide-react";

type NavItem = { key: ViewKey; icon: typeof Users };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    label: "nav.main",
    items: [
      { key: "dashboard", icon: LayoutDashboard },
      { key: "students", icon: Users },
      { key: "teachers", icon: GraduationCap },
    ],
  },
  {
    label: "nav.management",
    items: [
      { key: "academic", icon: BookOpen },
      { key: "hifz", icon: BookMarked },
      { key: "attendance", icon: ClipboardList },
      { key: "exams", icon: BookOpen },
    ],
  },
  {
    label: "nav.system",
    items: [
      { key: "finance", icon: Banknote },
      { key: "wallet", icon: Wallet },
      { key: "notices", icon: Bell },
      { key: "reports", icon: FileBarChart },
      { key: "import", icon: ArrowUpDown },
      { key: "settings", icon: Settings },
      { key: "audit", icon: History },
    ],
  },
];

export function AppSidebar() {
  const { view, setView, t, sidebarOpen, setSidebarOpen, tenantName, user } = useApp();

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
          <nav className="space-y-6">
            {groups.map((g) => (
              <div key={g.label}>
                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-300/60">
                  {t(g.label)}
                </p>
                <div className="space-y-1">
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
              </div>
            ))}
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
