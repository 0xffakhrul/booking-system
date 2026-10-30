import { createBrowserRouter } from "react-router";
import { HealthPage } from "@/features/health/HealthPage";

// Later: /book/:slug/* for customers, /login, and /app/* for owners behind a guard
export const router = createBrowserRouter([
  { path: "/", element: <HealthPage /> },
]);
