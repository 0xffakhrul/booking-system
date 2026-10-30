import { createBrowserRouter, Navigate } from "react-router";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { GuestOnly, RequireAuth } from "@/features/auth/RequireAuth";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { HealthPage } from "@/features/health/HealthPage";

// Later: /book/:slug/* for customers (no login), and more /app/* pages for owners
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
    children: [{ path: "/app", element: <DashboardPage /> }],
  },
  { path: "*", element: <Navigate to="/app" replace /> },
]);
