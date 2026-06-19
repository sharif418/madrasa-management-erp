// App shell — wraps the authenticated experience: sidebar + header + content
"use client";
import { useApp } from "@/store/app-store";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { CommandPalette } from "./command-palette";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { DashboardView } from "@/modules/dashboard/dashboard-view";
import { StudentsView } from "@/modules/students/students-view";
import { TeachersView } from "@/modules/teachers/teachers-view";
import { AcademicView } from "@/modules/academic/academic-view";
import { HifzView } from "@/modules/hifz/hifz-view";
import { FinanceView } from "@/modules/finance/finance-view";
import { WalletView } from "@/modules/wallet/wallet-view";
import { AttendanceView } from "@/modules/attendance/attendance-view";
import { NoticesView } from "@/modules/notices/notices-view";
import { SettingsView } from "@/modules/settings/settings-view";
import { AuditView } from "@/modules/audit/audit-view";
import { ReportsView } from "@/modules/reports/reports-view";
import { ExamsView } from "@/modules/exams/exams-view";
import { ImportExportView } from "@/modules/import-export/import-export-view";

export function AppShell() {
  const { view } = useApp();
  const { open, setOpen } = useCommandPalette();

  const renderView = () => {
    switch (view) {
      case "dashboard": return <DashboardView />;
      case "students": return <StudentsView />;
      case "teachers": return <TeachersView />;
      case "academic": return <AcademicView />;
      case "hifz": return <HifzView />;
      case "finance": return <FinanceView />;
      case "wallet": return <WalletView />;
      case "attendance": return <AttendanceView />;
      case "notices": return <NoticesView />;
      case "settings": return <SettingsView />;
      case "audit": return <AuditView />;
      case "reports": return <ReportsView />;
      case "exams": return <ExamsView />;
      case "import": return <ImportExportView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/30 via-background to-background dark:from-emerald-950/10">
      <AppSidebar />
      <div className="lg:ps-72">
        <AppHeader onOpenCommandPalette={() => setOpen(true)} />
        <main className="p-4 lg:p-6 min-h-[calc(100vh-4rem)]">
          {renderView()}
        </main>
      </div>
      {/* Global Cmd+K command palette — always mounted, controlled by hook */}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </div>
  );
}
