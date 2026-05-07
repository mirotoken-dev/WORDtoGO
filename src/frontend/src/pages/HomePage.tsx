import { useRouter } from "@tanstack/react-router";
import { Grid3x3, Pencil, Users } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import BottomNav from "../components/BottomNav";
import { PHONICS_DATA } from "../data/phonicsData";
import { useAppStore } from "../store/useAppStore";
import { playTapSound } from "../utils/audio";

const FEATURE_CARDS = [
  {
    label: "Matching Quiz",
    sublabel: "3 Levels",
    icon: Grid3x3,
    path: "/matching",
    style: { background: "linear-gradient(135deg, oklch(0.55 0.22 264) 0%, oklch(0.42 0.22 280) 100%)" },
  },
  {
    label: "Trace Letters",
    sublabel: "A to Z",
    icon: Pencil,
    path: "/tracing",
    style: { background: "linear-gradient(135deg, oklch(0.56 0.18 185) 0%, oklch(0.44 0.18 165) 100%)" },
  },
] as const;

export default function HomePage() {
  const router = useRouter();
  const { profiles, activeProfileId, progress } = useAppStore();
  const profile = profiles.find((p) => p.id === activeProfileId) ?? null;

  useEffect(() => {
    if (!profile) router.navigate({ to: "/" });
  }, [profile, router]);

  if (!profile) return null;

  const navigate = (path: string) => {
    playTapSound();
    router.navigate({ to: path as "/" });
  };

  const lettersLearned = PHONICS_DATA.filter(
    (l) => progress?.tracing[l.letter]?.completed,
  ).length;

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div
      className="min-h-screen flex flex-col pb-20"
      style={{ background: "oklch(0.98 0.02 60)" }}
    >
      {/* Orange Header */}
      <header
        className="px-5 pt-12 pb-5"
        style={{ background: "linear-gradient(160deg, oklch(0.72 0.22 40) 0%, oklch(0.60 0.22 40) 100%)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar circle with initial */}
            <button
              type="button"
              onClick={() => { playTapSound(); router.navigate({ to: "/" }); }}
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-display font-black active:scale-95 transition-smooth"
              style={{ background: "oklch(0.80 0.14 40)", color: "white" }}
            >
              {getInitial(profile.name)}
            </button>
            <div>
              <h1 className="text-xl font-display font-black text-white leading-tight">
                Hi, {profile.name}!
              </h1>
              <p className="text-sm text-white/80 font-body">
                {lettersLearned}/26 letters learned
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { playTapSound(); router.navigate({ to: "/" }); }}
            className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-smooth"
            style={{ background: "oklch(0.80 0.14 40 / 0.5)" }}
            aria-label="Switch profile"
          >
            <Users className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {/* Feature Cards */}
      <div className="px-4 pt-4 grid grid-cols-2 gap-3" data-ocid="home.features_section">
        {FEATURE_CARDS.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.label}
              type="button"
              data-ocid={`home.${card.label.toLowerCase().replace(" ", "_")}_button`}
              onClick={() => navigate(card.path)}
              className="rounded-2xl p-4 flex flex-col gap-2 text-left active:scale-95 transition-smooth"
              style={{ ...card.style, boxShadow: "0 4px 16px oklch(0 0 0 / 0.15)" }}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.08 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className="w-7 h-7 text-white/90" strokeWidth={1.8} />
              <div>
                <p className="font-display font-black text-white text-base leading-tight">
                  {card.label}
                </p>
                <p className="text-white/70 text-xs font-body mt-0.5">{card.sublabel}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Learning Journey */}
      <div className="px-4 mt-5 flex-1">
        <h2 className="text-xl font-display font-black text-foreground">Your Learning Journey</h2>
        <p className="text-sm text-muted-foreground font-body mt-0.5">
          Complete each letter to unlock new levels
        </p>

        {/* Journey path */}
        <div className="mt-4 relative flex flex-col gap-0">
          {PHONICS_DATA.map((letter, idx) => {
            const done = progress?.tracing[letter.letter]?.completed ?? false;
            const isLeft = idx % 2 === 0;
            const isFirst = idx === 0;

            return (
              <motion.div
                key={letter.letter}
                className="relative flex items-center"
                style={{ justifyContent: isLeft ? "flex-start" : "flex-end" }}
                initial={{ opacity: 0, x: isLeft ? -16 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
              >
                {/* Dotted connector (for all but first) */}
                {!isFirst && (
                  <div
                    className="absolute top-0 pointer-events-none"
                    style={{
                      left: isLeft ? "52px" : "auto",
                      right: isLeft ? "auto" : "52px",
                      width: "2px",
                      height: "28px",
                      top: "-28px",
                      borderLeft: "2px dashed oklch(0.75 0.02 60)",
                    }}
                  />
                )}

                {/* Level badge on first of each set */}
                {isFirst && (
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-display font-bold text-white"
                    style={{ background: "oklch(0.68 0.22 40)", whiteSpace: "nowrap" }}
                  >
                    🚀 Level 1 · Starters
                  </div>
                )}

                {/* Row with circle + label */}
                <button
                  type="button"
                  onClick={() => navigate("/tracing")}
                  className="flex items-center gap-3 py-3 active:scale-95 transition-smooth"
                  style={{ flexDirection: isLeft ? "row" : "row-reverse" }}
                >
                  {/* Letter circle */}
                  <div
                    className="w-16 h-16 rounded-full flex flex-col items-center justify-center relative flex-shrink-0"
                    style={{
                      background: done ? "oklch(0.68 0.22 40)" : "oklch(0.97 0.04 40)",
                      border: `3px solid ${done ? "oklch(0.68 0.22 40)" : "oklch(0.72 0.22 40)"}`,
                      boxShadow: "0 2px 8px oklch(0 0 0 / 0.12)",
                    }}
                  >
                    <span
                      className="text-2xl font-display font-black leading-none"
                      style={{ color: done ? "white" : "oklch(0.68 0.22 40)" }}
                    >
                      {letter.uppercase}
                    </span>
                    {/* Emoji badge */}
                    <span className="text-sm leading-none mt-0.5">
                      {letter.words[0].emoji}
                    </span>
                    {/* Checkmark */}
                    {done && (
                      <div
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                        style={{ background: "oklch(0.55 0.22 40)" }}
                      >
                        ✓
                      </div>
                    )}
                  </div>

                  {/* Word label */}
                  <p
                    className="text-sm font-display font-bold"
                    style={{ color: done ? "oklch(0.68 0.22 40)" : "oklch(0.40 0.02 60)" }}
                  >
                    {letter.letter} for {letter.words[0].word}
                  </p>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      <BottomNav active="home" />
    </div>
  );
}
