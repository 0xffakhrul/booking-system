import { createBrowserRouter, Navigate } from "react-router";
import { AppLayout } from "@/components/AppLayout";
import { Spinner } from "@/components/ui/spinner";
import { GuestOnly, RequireAuth } from "@/features/auth/RequireAuth";

// Each page is its own JavaScript chunk, downloaded the first time its route is visited.
// A customer opening a booking link gets the booking page, not the whole owner app.
export const router = createBrowserRouter([
  {
    // shown on the very first load while that page's chunk downloads
    HydrateFallback: () => (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    ),
    children: [
      { path: "/", element: <Navigate to="/app" replace /> },
      {
        path: "/book/:slug",
        lazy: async () => ({
          Component: (await import("@/features/booking/BookingPage"))
            .BookingPage,
        }),
      },
      {
        path: "/health",
        lazy: async () => ({
          Component: (await import("@/features/health/HealthPage")).HealthPage,
        }),
      },
      {
        element: <GuestOnly />,
        children: [
          {
            path: "/login",
            lazy: async () => ({
              Component: (await import("@/features/auth/LoginPage")).LoginPage,
            }),
          },
          {
            path: "/register",
            lazy: async () => ({
              Component: (await import("@/features/auth/RegisterPage"))
                .RegisterPage,
            }),
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                path: "/app",
                lazy: async () => ({
                  Component: (
                    await import("@/features/dashboard/DashboardPage")
                  ).DashboardPage,
                }),
              },
              {
                path: "/app/services",
                lazy: async () => ({
                  Component: (await import("@/features/services/ServicesPage"))
                    .ServicesPage,
                }),
              },
              {
                path: "/app/staff",
                lazy: async () => ({
                  Component: (await import("@/features/staff/StaffPage"))
                    .StaffPage,
                }),
              },
              {
                path: "/app/staff/:staffId/hours",
                lazy: async () => ({
                  Component: (await import("@/features/staff/WorkingHoursPage"))
                    .WorkingHoursPage,
                }),
              },
            ],
          },
        ],
      },
      { path: "*", element: <Navigate to="/app" replace /> },
    ],
  },
]);
