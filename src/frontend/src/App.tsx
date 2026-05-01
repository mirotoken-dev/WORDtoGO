import { RouterProvider, createRouter } from "@tanstack/react-router";
import { Outlet, createRootRoute, createRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAppStore } from "./store/useAppStore";

import BlendingPage from "./pages/BlendingPage";
import FlashcardsPage from "./pages/FlashcardsPage";
import HomePage from "./pages/HomePage";
import MakingWordsPage from "./pages/MakingWordsPage";
import MatchingLevel1Page from "./pages/MatchingLevel1Page";
import MatchingLevel2Page from "./pages/MatchingLevel2Page";
import MatchingLevel3Page from "./pages/MatchingLevel3Page";
import MatchingMenuPage from "./pages/MatchingMenuPage";
// Lazy page imports
import ProfilesPage from "./pages/ProfilesPage";
import ProgressPage from "./pages/ProgressPage";
import TracingPage from "./pages/TracingPage";

const rootRoute = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const loadFromStorage = useAppStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return <Outlet />;
}

const profilesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: ProfilesPage,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/home",
  component: HomePage,
});

const flashcardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/flashcards",
  component: FlashcardsPage,
});

const blendingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blending",
  component: BlendingPage,
});

const tracingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tracing",
  component: TracingPage,
});

const progressRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/progress",
  component: ProgressPage,
});

const matchingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/matching",
  component: MatchingMenuPage,
});

const matchingLevel1Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/matching/level1",
  component: MatchingLevel1Page,
});

const matchingLevel2Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/matching/level2",
  component: MatchingLevel2Page,
});

const matchingLevel3Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/matching/level3",
  component: MatchingLevel3Page,
});

const makingWordsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/making-words",
  component: MakingWordsPage,
});

const routeTree = rootRoute.addChildren([
  profilesRoute,
  homeRoute,
  flashcardsRoute,
  blendingRoute,
  tracingRoute,
  progressRoute,
  matchingRoute,
  matchingLevel1Route,
  matchingLevel2Route,
  matchingLevel3Route,
  makingWordsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
