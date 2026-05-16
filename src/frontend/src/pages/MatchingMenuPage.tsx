import { useRouter } from "@tanstack/react-router";
import { Grid3x3 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import { playTapSound } from "../utils/audio";

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

  const handleStart = (path: string) => {
    playTapSound();
    router.navigate({ to: path as "/" });
  };

  const MODES = [
    {
      emoji: "🔡",
      label: "Letters",
      desc: "Match uppercase to lowercase letters",
      colorClass: "gradient-blue",
      path: "/matching/level1",
      ocid: "matching_menu.level1_button",
    },
    {
      emoji: "📝",
      label: "Words",
      desc: "Match uppercase to lowercase words",
      colorClass: "gradient-green",
      path: "/matching/level2",
      ocid: "matching_menu.level2_button",
    },
    {
      emoji: "🖼️",
      label: "Pictures",
      desc: "Match pictures to their words",
      colorClass: "gradient-purple",
      path: "/matching/level3",
      ocid: "matching_menu.level3_button",
    },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border px-5 py-4 flex items-center gap-3 shadow-xs">
        <button
          type="button"
          data-ocid="matching_menu.back_button"
          onClick={handleBack}
          className="w-10 h-10 rounded-2xl bg-muted border border-border flex items-center justify-center text-foreground text-lg active:opacity-70 transition-smooth"
          aria-label="Back to home"
        >
          ←
        </button>
        <div className="flex items-center gap-2">
          <Grid3x3 className="w-5 h-5 text-[oklch(0.55_0.22_280)]" strokeWidth={2} />
          <div>
            <h1 className="font-display font-black text-lg text-foreground leading-tight">
              Matching Quiz
            </h1>
            <p className="text-xs font-body text-muted-foreground">Pick a mode to play</p>
          </div>
        </div>
      </header>

      {/* Banner */}
      <div
        className="px-6 py-8 text-center"
        style={{
          background: "linear-gradient(135deg, oklch(0.58 0.22 280) 0%, oklch(0.44 0.22 280) 100%)",
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <Grid3x3 className="w-12 h-12 mx-auto mb-3 text-white/90" strokeWidth={1.5} />
          <h2 className="text-2xl font-display font-black text-white">
            Match &amp; Learn!
          </h2>
          <p className="text-white/70 text-sm mt-1 font-body">
            5 pairs per round · Score 4+ to celebrate 🎉
          </p>
        </motion.div>
      </div>

      {/* Mode Cards */}
      <div className="flex-1 px-5 py-5 flex flex-col gap-3" data-ocid="matching_menu.levels_section">
        {MODES.map((item, idx) => (
          <motion.button
            key={item.label}
            type="button"
            data-ocid={item.ocid}
            onClick={() => handleStart(item.path)}
            className={`${item.colorClass} rounded-2xl p-5 flex items-center gap-4 active:scale-95 transition-smooth text-white relative overflow-hidden`}
            style={{ boxShadow: "0 4px 16px oklch(0 0 0 / 0.15)" }}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: idx * 0.08 }}
            whileTap={{ scale: 0.95 }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(135deg, oklch(1 0 0 / 0.12) 0%, transparent 55%)" }}
            />
            <span className="text-4xl shrink-0 relative z-10">{item.emoji}</span>
            <div className="text-left min-w-0 relative z-10">
              <p className="text-lg font-display font-black leading-tight">{item.label}</p>
              <p className="text-sm font-body opacity-80 mt-0.5">{item.desc}</p>
            </div>
            <span className="ml-auto text-xl opacity-50 shrink-0 relative z-10">›</span>
          </motion.button>
        ))}
      </div>

      <footer className="py-3 text-center bg-white border-t border-border">
        <p className="text-xs text-muted-foreground font-body">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.hostname : "",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[oklch(0.55_0.22_280)] transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
