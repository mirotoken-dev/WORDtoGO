import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import { playTapSound } from "../utils/audio";

const LEVELS = [
  {
    level: 1,
    emoji: "🔡",
    label: "Letters",
    desc: "Match uppercase letters to lowercase",
    style: { background: "linear-gradient(135deg, oklch(0.55 0.22 264) 0%, oklch(0.42 0.22 280) 100%)" },
    path: "/matching/level1",
    ocid: "matching_menu.level1_button",
  },
  {
    level: 2,
    emoji: "📝",
    label: "Words",
    desc: "Match uppercase words to lowercase words",
    style: { background: "linear-gradient(135deg, oklch(0.56 0.18 185) 0%, oklch(0.44 0.18 165) 100%)" },
    path: "/matching/level2",
    ocid: "matching_menu.level2_button",
  },
  {
    level: 3,
    emoji: "🖼️",
    label: "Pictures",
    desc: "Match pictures to their words",
    style: { background: "linear-gradient(135deg, oklch(0.58 0.22 280) 0%, oklch(0.44 0.22 280) 100%)" },
    path: "/matching/level3",
    ocid: "matching_menu.level3_button",
  },
] as const;

export default function MatchingMenuPage() {
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

  const handleLevel = (path: string) => {
    playTapSound();
    router.navigate({ to: path as "/" });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.98 0.02 60)" }}>
      {/* Header */}
      <header
        className="px-5 py-4 flex items-center gap-3"
        style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 264) 0%, oklch(0.42 0.22 280) 100%)", boxShadow: "0 2px 8px oklch(0 0 0 / 0.12)" }}
      >
        <button
          type="button"
          data-ocid="matching_menu.back_button"
          onClick={handleBack}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-smooth"
          style={{ background: "oklch(1 0 0 / 0.25)" }}
          aria-label="Back to home"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="font-display font-black text-xl text-white leading-tight">Matching Quiz</h1>
          <p className="text-xs font-body text-white/70">Pick a level to play</p>
        </div>
      </header>

      {/* Banner */}
      <div
        className="px-6 py-8 text-center"
        style={{ background: "linear-gradient(160deg, oklch(0.55 0.22 264) 0%, oklch(0.42 0.22 280) 100%)" }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <div className="text-5xl mb-2">🧩</div>
          <h2 className="text-2xl font-display font-black text-white">Match &amp; Learn!</h2>
          <p className="text-white/70 text-sm mt-1">5 pairs per round · Score 4+ to celebrate 🎉</p>
        </motion.div>
      </div>

      {/* Level Cards */}
      <div className="flex-1 px-5 py-6 flex flex-col gap-4" data-ocid="matching_menu.levels_section">
        {LEVELS.map((item, idx) => (
          <motion.button
            key={item.level}
            type="button"
            data-ocid={item.ocid}
            onClick={() => handleLevel(item.path)}
            className="rounded-2xl p-5 flex items-center gap-4 active:scale-95 transition-smooth text-white"
            style={{ ...item.style, boxShadow: "0 4px 16px oklch(0 0 0 / 0.15)" }}
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: idx * 0.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-5xl shrink-0">{item.emoji}</span>
            <div className="text-left min-w-0">
              <p className="text-xl font-display font-black leading-tight">
                Level {item.level} · {item.label}
              </p>
              <p className="text-sm font-body opacity-80 mt-0.5">{item.desc}</p>
            </div>
            <span className="ml-auto text-2xl opacity-60 shrink-0">›</span>
          </motion.button>
        ))}
      </div>

      <footer className="py-3 text-center border-t bg-white" style={{ borderColor: "oklch(0.90 0.02 60)" }}>
        <p className="text-xs text-muted-foreground font-body">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.hostname : "",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: "oklch(0.68 0.22 40)" }}
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
