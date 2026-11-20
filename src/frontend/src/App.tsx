import { RouterProvider, createRouter } from "@tanstack/react-router";
import { Outlet, createRootRoute, createRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAppStore } from "./store/useAppStore";
import { preloadLetterAudio, prewarmSpeech } from "./utils/audio";

import BlendingPage from "./pages/BlendingPage";
import FlashcardsPage from "./pages/FlashcardsPage";
import GameHubPage from "./pages/GameHubPage";
import HomePage from "./pages/HomePage";
import MatchingLevel1Page from "./pages/MatchingLevel1Page";
import MatchingLevel2Page from "./pages/MatchingLevel2Page";
import MatchingLevel3Page from "./pages/MatchingLevel3Page";
import MatchingMenuPage from "./pages/MatchingMenuPage";
import MemoryMatchPage from "./pages/MemoryMatchPage";
import MissingLetterPage from "./pages/MissingLetterPage";
import ProfileWizard from "./pages/ProfileWizard";
import SpeedChallengePage from "./pages/SpeedChallengePage";
// Lazy page imports
import ProfilesPage from "./pages/ProfilesPage";
import ProgressPage from "./pages/ProgressPage";
import PronunciationPage from "./pages/PronunciationPage";
import TracingPage from "./pages/TracingPage";
import VisualLearningPage from "./pages/VisualLearningPage";

const rootRoute = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const loadFromStorage = useAppStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
    // Pre-warm speech synthesis and preload letter MP3s globally once at startup
    prewarmSpeech();
    void preloadLetterAudio();
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
const visualLearningRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/visual-learning",
  component: VisualLearningPage,
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

const pronunciationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pronunciation",
  component: PronunciationPage,
});

const profileWizardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/wizard",
  component: ProfileWizard,
});

const gamesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/games",
  component: GameHubPage,
});

const missingLetterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/games/missing-letter",
  component: MissingLetterPage,
});

const memoryMatchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/games/memory-match",
  component: MemoryMatchPage,
});

const speedChallengeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/games/speed-challenge",
  component: SpeedChallengePage,
});

const routeTree = rootRoute.addChildren([
  profilesRoute,
  profileWizardRoute,
  homeRoute,
  flashcardsRoute,
  blendingRoute,
  tracingRoute,
  visualLearningRoute,
  progressRoute,
  matchingRoute,
  matchingLevel1Route,
  matchingLevel2Route,
  matchingLevel3Route,
  pronunciationRoute,
  gamesRoute,
  missingLetterRoute,
  memoryMatchRoute,
  speedChallengeRoute,
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
