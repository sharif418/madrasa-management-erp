// App shell — wraps the authenticated experience: sidebar + header + content
"use client";
import { useApp } from "@/store/app-store";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { CommandPalette } from "./command-palette";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { DashboardRouter } from "@/modules/dashboard/dashboard-router";
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
import { HostelView } from "@/modules/hostel/hostel-view";
import { MuhasabaView } from "@/modules/muhasaba/muhasaba-view";
import { LibraryView } from "@/modules/library/library-view";
import { DonorsView } from "@/modules/donors/donors-view";
import { CalendarView } from "@/modules/calendar/calendar-view";
import { TransportView } from "@/modules/transport/transport-view";
import { HealthView } from "@/modules/health/health-view";
import { FeedbackView } from "@/modules/feedback/feedback-view";
import { AdmissionView } from "@/modules/admission/admission-view";
import { AlumniView } from "@/modules/alumni/alumni-view";
import { InventoryView } from "@/modules/inventory/inventory-view";
import { AiView } from "@/modules/ai/ai-view";
import { TimetableView } from "@/modules/timetable/timetable-view";
import { WebsiteView } from "@/modules/website/website-view";
import { BillingView } from "@/modules/billing/billing-view";
import { CommunicationsView } from "@/modules/communications/communications-view";
import { AnalyticsView } from "@/modules/analytics/analytics-view";
import { CertificatesView } from "@/modules/certificates/certificates-view";
import { IdCardsView } from "@/modules/idcards/idcards-view";
import { DailyReportView } from "@/modules/daily-report/daily-report-view";
import { FeesView } from "@/modules/fees/fees-view";
import { SeatPlanView } from "@/modules/seatplan/seatplan-view";
import { WaiversView } from "@/modules/waivers/waivers-view";
import { PtmView } from "@/modules/ptm/ptm-view";
import { QuranLogView } from "@/modules/quranlog/quranlog-view";
import { OfflineIndicator } from "@/components/shared/offline-indicator";

export function AppShell() {
  const { view } = useApp();
  const { open, setOpen } = useCommandPalette();

  const renderView = () => {
    switch (view) {
      case "dashboard": return <DashboardRouter />;
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
      case "hostel": return <HostelView />;
      case "muhasaba": return <MuhasabaView />;
      case "library": return <LibraryView />;
      case "donors": return <DonorsView />;
      case "calendar": return <CalendarView />;
      case "transport": return <TransportView />;
      case "health": return <HealthView />;
      case "feedback": return <FeedbackView />;
      case "admission": return <AdmissionView />;
      case "alumni": return <AlumniView />;
      case "inventory": return <InventoryView />;
      case "ai": return <AiView />;
      case "timetable": return <TimetableView />;
      case "website": return <WebsiteView />;
      case "billing": return <BillingView />;
      case "communications": return <CommunicationsView />;
      case "analytics": return <AnalyticsView />;
      case "idcards": return <IdCardsView />;
      case "certificates": return <CertificatesView />;
      case "dailyreport": return <DailyReportView />;
      case "fees": return <FeesView />;
      case "waivers": return <WaiversView />;
      case "seatplan": return <SeatPlanView />;
      case "ptm": return <PtmView />;
      case "quranlog": return <QuranLogView />;
      default: return <DashboardRouter />;
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
      <OfflineIndicator />
    </div>
  );
}
