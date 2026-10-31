import { createBrowserRouter, Navigate } from "react-router";
import { AppLayout } from "@/components/AppLayout";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { GuestOnly, RequireAuth } from "@/features/auth/RequireAuth";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { HealthPage } from "@/features/health/HealthPage";
import { ServicesPage } from "@/features/services/ServicesPage";
import { StaffPage } from "@/features/staff/StaffPage";
import { WorkingHoursPage } from "@/features/staff/WorkingHoursPage";

// Later: /book/:slug/* for customers (no login)
export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/app" replace /> },
  { path: "/health", element: <HealthPage /> },
  {
    element: <GuestOnly />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/app", element: <DashboardPage /> },
          { path: "/app/services", element: <ServicesPage /> },
          { path: "/app/staff", element: <StaffPage /> },
          {
            path: "/app/staff/:staffId/hours",
            element: <WorkingHoursPage />,
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/app" replace /> },
]);
