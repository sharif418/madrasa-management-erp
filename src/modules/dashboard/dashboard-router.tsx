"use client";
// Dashboard router — renders the right dashboard based on the user's role.
// Falls back to the admin dashboard for unknown roles.
import { useApp } from "@/store/app-store";
import { DashboardView } from "./dashboard-view";
import { TeacherDashboard } from "./teacher-dashboard";
import { ParentDashboard } from "./parent-dashboard";
import { StudentDashboard } from "./student-dashboard";

/**
 * Role → dashboard mapping:
 *  - Super Admin / Principal → admin DashboardView
 *  - Teacher                 → TeacherDashboard
 *  - Parent                  → ParentDashboard
 *  - Student                 → StudentDashboard
 *  - default                 → admin DashboardView (safe fallback)
 *
 * The first matching role wins, so a user with multiple roles (e.g. Principal + Teacher)
 * gets the most privileged dashboard.
 */
export function DashboardRouter() {
  const { user } = useApp();
  const roles = user?.roles ?? [];

  if (roles.includes("Super Admin") || roles.includes("Principal")) {
    return <DashboardView />;
  }
  if (roles.includes("Teacher")) {
    return <TeacherDashboard />;
  }
  if (roles.includes("Parent")) {
    return <ParentDashboard />;
  }
  if (roles.includes("Student")) {
    return <StudentDashboard />;
  }
  return <DashboardView />;
}

export default DashboardRouter;
