import { useRouter } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect } from "react";
import StarBadge from "../components/StarBadge";
import { useAppStore } from "../store/useAppStore";
import { playTapSound } from "../utils/audio";

const MENU = [
  {
    label: "Flashcards",
    emoji: "🃏",
    path: "/flashcards",
    colorClass: "gradient-red",
    desc: "Learn A–Z letters",
  },
  {
    label: "Blending",
    emoji: "✏️",
    path: "/blending",
    colorClass: "gradient-blue",
    desc: "Blend sounds into words",
  },
  {
    label: "Tracing",
    emoji: "🖋️",
    path: "/tracing",
    colorClass: "gradient-green",
    desc: "Practice writing",
  },
  {
    label: "Visual",
    emoji: "🎬",
    path: "/visual-learning",
    colorClass: "gradient-purple",
    desc: "Videos & audio lessons",
  },
  {
    label: "Progress",
    emoji: "⭐",
    path: "/progress",
    colorClass: "gradient-yellow",
    desc: "See achievements",
  },
  {
    label: "Matching",
    emoji: "🧩",
    path: "/matching",
    colorClass: "gradient-purple",
    desc: "Quiz: match & learn",
  },
  {
    label: "Pronunciation",
    emoji: "🎤",
    path: "/pronunciation",
    colorClass: "gradient-gold",
    desc: "Say the word aloud",
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header — luxury dark with gold accents */}
      <header className="bg-card/90 border-b border-[oklch(0.82_0.17_84/0.2)] shadow-luxury backdrop-blur-sm px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-muted border border-[oklch(0.82_0.17_84/0.3)] flex items-center justify-center text-3xl glow-gold-sm">
            {profile.avatar}
          </div>
          <div>
            <p className="font-display font-bold text-lg text-foreground leading-tight">
              Hi, {profile.name}! 👋
            </p>
            <p className="text-xs font-body text-muted-foreground">
              Ready to learn?
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StarBadge count={progress?.totalStars ?? 0} size="sm" />
          <button
            type="button"
            data-ocid="home.switch_profile_button"
            onClick={() => {
              playTapSound();
              router.navigate({ to: "/" });
            }}
            className="text-xs font-body text-[oklch(0.82_0.17_84)] underline px-2 py-1 active:opacity-70 transition-smooth"
          >
            Switch
          </button>
        </div>
      </header>

      {/* Hero Banner — luxurious dark with gold gradient title */}
      <div
        className="px-6 py-8 text-center relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.10 0.03 264) 0%, oklch(0.08 0.01 264) 100%)",
          borderBottom: "1px solid oklch(0.82 0.17 84 / 0.2)",
        }}
      >
        {/* Decorative gold orb */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, oklch(0.82 0.17 84 / 0.12) 0%, transparent 70%)",
          }}
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="relative z-10"
        >
          <div className="text-5xl mb-3">📚</div>
          <h2
            className="text-3xl font-display font-black leading-tight mb-1"
            style={{
              background:
                "linear-gradient(to right, oklch(0.95 0.18 84), oklch(0.82 0.17 84), oklch(0.95 0.18 84))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Word to Go
          </h2>
          <p className="text-muted-foreground text-sm mt-1 font-body">
            26 letters · 260 words
          </p>
        </motion.div>
      </div>

      {/* Feature Grid */}
      <div
        className="flex-1 px-5 py-6 grid grid-cols-2 gap-4"
        data-ocid="home.features_section"
      >
        {MENU.map((item, idx) => (
          <motion.button
            key={item.label}
            type="button"
            data-ocid={`home.${item.label.toLowerCase().replace(" ", "_")}_button`}
            onClick={() => navigate(item.path)}
            className={`${item.colorClass} rounded-3xl p-5 flex flex-col items-center justify-center gap-2 active:scale-95 transition-smooth text-card min-h-[140px] relative overflow-hidden`}
            style={{
              boxShadow:
                "0 4px 24px oklch(0 0 0 / 0.5), 0 0 0 1px oklch(0.82 0.17 84 / 0.15) inset",
            }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: idx * 0.08 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Gold shimmer overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, oklch(1 0 0 / 0.08) 0%, transparent 60%)",
              }}
            />
            <span className="text-5xl relative z-10">{item.emoji}</span>
            <span className="text-xl font-display font-black leading-tight relative z-10">
              {item.label}
            </span>
            <span className="text-xs font-body opacity-80 text-center relative z-10">
              {item.desc}
            </span>
          </motion.button>
        ))}
      </div>

      <footer className="py-3 text-center bg-card/60 border-t border-[oklch(0.82_0.17_84/0.15)]">
        <p className="text-xs text-muted-foreground font-body">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.hostname : "",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[oklch(0.82_0.17_84)] transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
