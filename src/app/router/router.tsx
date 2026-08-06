// Import Dependencies
import { createBrowserRouter, Navigate, RouteObject } from "react-router";

// Local Imports
import Root from "@/app/layouts/Root";
import RootErrorBoundary from "@/app/pages/errors/RootErrorBoundary";
import { SplashScreen } from "@/components/template/SplashScreen";
import { protectedRoutes } from "./protected";
import { ghostRoutes } from "./ghost";
import { publicRoutes } from "./public";

/**
 * Main application router configuration
 * All routes are nested under /pos prefix.
 * Uses HashRouter so it works in Capacitor WebView (no real HTTP server).
 * Short paths like /settings/* redirect to /pos/settings/* for convenience.
 */
const router = createBrowserRouter([
  {
    id: "root",
    Component: Root,
    hydrateFallbackElement: <SplashScreen />,
    ErrorBoundary: RootErrorBoundary,
    children: [
      // Convenience redirects: short /settings/<path> -> /pos/settings/<path>
      {
        path: "settings",
        children: [
          { index: true, element: <Navigate to="/pos/settings" replace /> },
          { path: "*", element: <Navigate to="/pos/settings" replace /> },
          { path: "profile", element: <Navigate to="/pos/settings/profile" replace /> },
          { path: "general", element: <Navigate to="/pos/settings/general" replace /> },
          { path: "appearance", element: <Navigate to="/pos/settings/appearance" replace /> },
        ],
      },
      protectedRoutes,
      ghostRoutes,
      publicRoutes,
    ] as RouteObject[],
  },
]);

export default router;
