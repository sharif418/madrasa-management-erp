// App shell — wraps the authenticated experience: sidebar + header + content.
// Module views are lazily loaded so Turbopack only compiles the active module,
// shrinking the initial bundle and preventing dev-server OOM with 433+ files.
"use client";
import { lazy, Suspense } from "react";
import { useApp } from "@/store/app-store";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { CommandPalette } from "./command-palette";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { OfflineIndicator } from "@/components/shared/offline-indicator";
import { ViewLoadingSkeleton } from "./view-loading-skeleton";

// Dashboard router already has a default export.
const DashboardRouter = lazy(() => import("@/modules/dashboard/dashboard-router"));

// Every other view uses a named export — wrap with .then() to expose `default`.
const StudentsView = lazy(() =>
  import("@/modules/students/students-view").then((m) => ({ default: m.StudentsView })),
);
const TeachersView = lazy(() =>
  import("@/modules/teachers/teachers-view").then((m) => ({ default: m.TeachersView })),
);
const AcademicView = lazy(() =>
  import("@/modules/academic/academic-view").then((m) => ({ default: m.AcademicView })),
);
const HifzView = lazy(() => import("@/modules/hifz/hifz-view").then((m) => ({ default: m.HifzView })));
const FinanceView = lazy(() =>
  import("@/modules/finance/finance-view").then((m) => ({ default: m.FinanceView })),
);
const WalletView = lazy(() =>
  import("@/modules/wallet/wallet-view").then((m) => ({ default: m.WalletView })),
);
const AttendanceView = lazy(() =>
  import("@/modules/attendance/attendance-view").then((m) => ({ default: m.AttendanceView })),
);
const NoticesView = lazy(() =>
  import("@/modules/notices/notices-view").then((m) => ({ default: m.NoticesView })),
);
const SettingsView = lazy(() =>
  import("@/modules/settings/settings-view").then((m) => ({ default: m.SettingsView })),
);
const AuditView = lazy(() => import("@/modules/audit/audit-view").then((m) => ({ default: m.AuditView })));
const ReportsView = lazy(() =>
  import("@/modules/reports/reports-view").then((m) => ({ default: m.ReportsView })),
);
const ExamsView = lazy(() => import("@/modules/exams/exams-view").then((m) => ({ default: m.ExamsView })));
const ImportExportView = lazy(() =>
  import("@/modules/import-export/import-export-view").then((m) => ({ default: m.ImportExportView })),
);
const HostelView = lazy(() =>
  import("@/modules/hostel/hostel-view").then((m) => ({ default: m.HostelView })),
);
const MuhasabaView = lazy(() =>
  import("@/modules/muhasaba/muhasaba-view").then((m) => ({ default: m.MuhasabaView })),
);
const LibraryView = lazy(() =>
  import("@/modules/library/library-view").then((m) => ({ default: m.LibraryView })),
);
const DonorsView = lazy(() =>
  import("@/modules/donors/donors-view").then((m) => ({ default: m.DonorsView })),
);
const CalendarView = lazy(() =>
  import("@/modules/calendar/calendar-view").then((m) => ({ default: m.CalendarView })),
);
const TransportView = lazy(() =>
  import("@/modules/transport/transport-view").then((m) => ({ default: m.TransportView })),
);
const HealthView = lazy(() =>
  import("@/modules/health/health-view").then((m) => ({ default: m.HealthView })),
);
const FeedbackView = lazy(() =>
  import("@/modules/feedback/feedback-view").then((m) => ({ default: m.FeedbackView })),
);
const AdmissionView = lazy(() =>
  import("@/modules/admission/admission-view").then((m) => ({ default: m.AdmissionView })),
);
const AlumniView = lazy(() =>
  import("@/modules/alumni/alumni-view").then((m) => ({ default: m.AlumniView })),
);
const InventoryView = lazy(() =>
  import("@/modules/inventory/inventory-view").then((m) => ({ default: m.InventoryView })),
);
const AiView = lazy(() => import("@/modules/ai/ai-view").then((m) => ({ default: m.AiView })));
const TimetableView = lazy(() =>
  import("@/modules/timetable/timetable-view").then((m) => ({ default: m.TimetableView })),
);
const WebsiteView = lazy(() =>
  import("@/modules/website/website-view").then((m) => ({ default: m.WebsiteView })),
);
const BillingView = lazy(() =>
  import("@/modules/billing/billing-view").then((m) => ({ default: m.BillingView })),
);
const CommunicationsView = lazy(() =>
  import("@/modules/communications/communications-view").then((m) => ({ default: m.CommunicationsView })),
);
const AnalyticsView = lazy(() =>
  import("@/modules/analytics/analytics-view").then((m) => ({ default: m.AnalyticsView })),
);
const CertificatesView = lazy(() =>
  import("@/modules/certificates/certificates-view").then((m) => ({ default: m.CertificatesView })),
);
const IdCardsView = lazy(() =>
  import("@/modules/idcards/idcards-view").then((m) => ({ default: m.IdCardsView })),
);
const DailyReportView = lazy(() =>
  import("@/modules/daily-report/daily-report-view").then((m) => ({ default: m.DailyReportView })),
);
const FeesView = lazy(() => import("@/modules/fees/fees-view").then((m) => ({ default: m.FeesView })));
const SeatPlanView = lazy(() =>
  import("@/modules/seatplan/seatplan-view").then((m) => ({ default: m.SeatPlanView })),
);
const WaiversView = lazy(() =>
  import("@/modules/waivers/waivers-view").then((m) => ({ default: m.WaiversView })),
);
const PtmView = lazy(() => import("@/modules/ptm/ptm-view").then((m) => ({ default: m.PtmView })));
const QuranLogView = lazy(() =>
  import("@/modules/quranlog/quranlog-view").then((m) => ({ default: m.QuranLogView })),
);

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
          <Suspense fallback={<ViewLoadingSkeleton />}>{renderView()}</Suspense>
        </main>
      </div>
      {/* Global Cmd+K command palette — always mounted, controlled by hook */}
      <CommandPalette open={open} onOpenChange={setOpen} />
      <OfflineIndicator />
    </div>
  );
}
