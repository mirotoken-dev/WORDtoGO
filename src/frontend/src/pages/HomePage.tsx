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
    emoji: "🎵",
    path: "/blending",
    colorClass: "gradient-blue",
    desc: "Blend sounds into words",
  },
  {
    label: "Tracing",
    emoji: "✏️",
    path: "/tracing",
    colorClass: "gradient-green",
    desc: "Practice writing",
  },
  {
    label: "Progress",
    emoji: "⭐",
    path: "/progress",
    colorClass: "gradient-yellow",
    desc: "See achievements",
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
      {/* Header */}
      <header className="bg-card border-b border-border shadow-playful px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-3xl">
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
            className="text-xs font-body text-muted-foreground underline px-2 py-1 active:opacity-70 transition-smooth"
          >
            Switch
          </button>
        </div>
      </header>

      {/* Banner */}
      <div className="gradient-purple px-6 py-8 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <div className="text-5xl mb-2 animate-bounce-joy">📚</div>
          <h2 className="text-3xl font-display font-black text-card">
            Phonics Playroom
          </h2>
          <p className="text-card/80 text-sm mt-1">26 letters · 260 words</p>
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
            data-ocid={`home.${item.label.toLowerCase()}_button`}
            onClick={() => navigate(item.path)}
            className={`${item.colorClass} rounded-3xl p-5 flex flex-col items-center justify-center gap-2 shadow-playful active:scale-95 transition-smooth text-card min-h-[140px]`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: idx * 0.08 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-5xl">{item.emoji}</span>
            <span className="text-xl font-display font-black leading-tight">
              {item.label}
            </span>
            <span className="text-xs font-body opacity-80 text-center">
              {item.desc}
            </span>
          </motion.button>
        ))}
      </div>

      <footer className="py-3 text-center bg-muted/40 border-t border-border">
        <p className="text-xs text-muted-foreground font-body">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.hostname : "",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
