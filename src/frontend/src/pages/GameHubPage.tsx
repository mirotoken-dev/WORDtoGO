import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, Clock, HelpCircle, Layers, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { getUILabel } from "../data/arabicTranslations";
import { useAppStore } from "../store/useAppStore";
import { playTapSound } from "../utils/audio";

interface GameCard {
  id: string;
  emoji: string;
  label: string;
  desc: string;
  path: string;
  colorFrom: string;
  colorTo: string;
  shadow: string;
  icon: React.ReactNode;
}

const GAMES: GameCard[] = [
  {
    id: "missing-letter",
    emoji: "🧩",
    label: "Missing Letter",
    desc: "Fill in the blank to complete the word",
    path: "/games/missing-letter",
    colorFrom: "oklch(0.67 0.21 222)",
    colorTo: "oklch(0.52 0.20 222)",
    shadow: "oklch(0.46 0.19 222)",
    icon: <HelpCircle className="w-6 h-6" />,
  },
  {
    id: "memory-match",
    emoji: "🃏",
    label: "Memory Match",
    desc: "Flip cards and find matching pairs",
    path: "/games/memory-match",
    colorFrom: "oklch(0.72 0.27 130)",
    colorTo: "oklch(0.56 0.25 130)",
    shadow: "oklch(0.50 0.23 130)",
    icon: <Layers className="w-6 h-6" />,
  },
  {
    id: "speed-challenge",
    emoji: "⚡",
    label: "Speed Challenge",
    desc: "Answer as fast as you can!",
    path: "/games/speed-challenge",
    colorFrom: "oklch(0.66 0.24 310)",
    colorTo: "oklch(0.52 0.22 310)",
    shadow: "oklch(0.46 0.20 310)",
    icon: <Zap className="w-6 h-6" />,
  },
  {
    id: "matching",
    emoji: "🔀",
    label: "Matching Quiz",
    desc: "Match letters, words, and pictures",
    path: "/matching",
    colorFrom: "oklch(0.65 0.22 280)",
    colorTo: "oklch(0.50 0.21 280)",
    shadow: "oklch(0.44 0.20 280)",
    icon: <Clock className="w-6 h-6" />,
  },
];

export default function GameHubPage() {
  const router = useRouter();
  const { profiles, activeProfileId } = useAppStore();
  const profile = profiles.find((p) => p.id === activeProfileId) ?? null;

  useEffect(() => {
    if (!profile) router.navigate({ to: "/" });
  }, [profile, router]);

  if (!profile) return null;

  const handleBack = () => {
    playTapSound();
    router.navigate({ to: "/home" });
  };

  const handleNavigate = (path: string) => {
    playTapSound();
    router.navigate({ to: path as "/" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-white border-b-2 border-border px-5 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="nav-btn"
          aria-label={getUILabel("Back to home")}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-black text-xl text-foreground leading-tight">
          Game Hub
        </h1>
      </header>

      {/* Banner */}
      <div
        className="px-6 py-10 text-center relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, oklch(0.62 0.22 280) 0%, oklch(0.48 0.21 280) 100%)",
        }}
      >
        <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/10 translate-y-6 -translate-x-4" />
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="relative"
        >
          <div className="text-6xl mb-3 float inline-block">🎮</div>
          <h2 className="text-3xl font-display font-black text-white">
            Let&apos;s Play &amp; Learn!
          </h2>
          <p className="text-white/70 text-sm mt-2 font-body">
            Pick a game and have fun learning!
          </p>
        </motion.div>
      </div>

      {/* Wave */}
      <div className="wave-divider -mt-px bg-background">
        <svg viewBox="0 0 390 30" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0 30V15C65 0 130 30 195 15C260 0 325 30 390 15V30H0Z" fill="oklch(0.99 0.008 95)" />
        </svg>
      </div>

      {/* Game Cards */}
      <div className="flex-1 px-5 py-4 flex flex-col gap-3">
        {GAMES.map((game, idx) => (
          <motion.button
            key={game.id}
            type="button"
            onClick={() => handleNavigate(game.path)}
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: idx * 0.09 }}
            whileTap={{ scale: 0.97, y: 4 }}
            className="rounded-3xl p-5 flex items-center gap-4 text-white relative overflow-hidden active:translate-y-1 text-left"
            style={{
              background: `linear-gradient(145deg, ${game.colorFrom} 0%, ${game.colorTo} 100%)`,
              boxShadow: `0 6px 0 0 ${game.shadow}, 0 8px 20px oklch(0 0 0 / 0.12)`,
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(135deg, oklch(1 0 0 / 0.14) 0%, transparent 55%)" }}
            />
            <span className="text-5xl shrink-0 relative z-10">{game.emoji}</span>
            <div className="text-left min-w-0 relative z-10 flex-1">
              <p className="text-xl font-display font-black leading-tight">{game.label}</p>
              <p className="text-sm font-body opacity-80 mt-0.5">{game.desc}</p>
            </div>
            <span className="ml-auto text-2xl opacity-60 shrink-0 relative z-10">›</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
