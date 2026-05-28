import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { getUILabel } from "../data/arabicTranslations";
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
      emoji: "🔤",
      label: "Letters",
      desc: "Match uppercase to lowercase letters",
      colorFrom: "oklch(0.67 0.21 222)",
      colorTo: "oklch(0.52 0.20 222)",
      shadow: "oklch(0.46 0.19 222)",
      path: "/matching/level1",
      ocid: "matching_menu.level1_button",
    },
    {
      emoji: "💬",
      label: "Words",
      desc: "Match uppercase to lowercase words",
      colorFrom: "oklch(0.72 0.27 130)",
      colorTo: "oklch(0.56 0.25 130)",
      shadow: "oklch(0.50 0.23 130)",
      path: "/matching/level2",
      ocid: "matching_menu.level2_button",
    },
    {
      emoji: "🌈",
      label: "Pictures",
      desc: "Match pictures to their words",
      colorFrom: "oklch(0.66 0.24 310)",
      colorTo: "oklch(0.52 0.22 310)",
      shadow: "oklch(0.46 0.20 310)",
      path: "/matching/level3",
      ocid: "matching_menu.level3_button",
    },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-white border-b-2 border-border px-5 py-3 flex items-center gap-3">
        <button
          type="button"
          data-ocid="matching_menu.back_button"
          onClick={handleBack}
          className="nav-btn"
          aria-label={getUILabel("Back to home")}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-black text-xl text-foreground leading-tight">
          Matching Quiz
        </h1>
      </header>

      {/* Banner */}
      <div
        className="px-6 py-10 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, oklch(0.62 0.22 280) 0%, oklch(0.48 0.21 280) 100%)" }}
      >
        <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/10 translate-y-6 -translate-x-4" />
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="relative"
        >
          <div className="text-6xl mb-3 float inline-block">🔀</div>
          <h2 className="text-3xl font-display font-black text-white">
            Match &amp; Learn!
          </h2>
          <p className="text-white/70 text-sm mt-2 font-body">
            5 pairs per round · Score 4+ to celebrate 🎉
          </p>
        </motion.div>
      </div>

      {/* Wave */}
      <div className="wave-divider -mt-px bg-background">
        <svg viewBox="0 0 390 30" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0 30V15C65 0 130 30 195 15C260 0 325 30 390 15V30H0Z" fill="oklch(0.99 0.008 95)" />
        </svg>
      </div>

      {/* Mode Cards */}
      <div className="flex-1 px-5 py-4 flex flex-col gap-3" data-ocid="matching_menu.levels_section">
        {MODES.map((item, idx) => (
          <motion.button
            key={item.label}
            type="button"
            data-ocid={item.ocid}
            onClick={() => handleStart(item.path)}
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: idx * 0.09 }}
            whileTap={{ scale: 0.97, y: 4 }}
            className="rounded-3xl p-5 flex items-center gap-4 text-white relative overflow-hidden active:translate-y-1"
            style={{
              background: `linear-gradient(145deg, ${item.colorFrom} 0%, ${item.colorTo} 100%)`,
              boxShadow: `0 6px 0 0 ${item.shadow}, 0 8px 20px oklch(0 0 0 / 0.12)`,
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(135deg, oklch(1 0 0 / 0.14) 0%, transparent 55%)" }}
            />
            <span className="text-5xl shrink-0 relative z-10">{item.emoji}</span>
            <div className="text-left min-w-0 relative z-10 flex-1">
              <p className="text-xl font-display font-black leading-tight">{item.label}</p>
              <p className="text-sm font-body opacity-80 mt-0.5">{item.desc}</p>
            </div>
            <span className="ml-auto text-2xl opacity-60 shrink-0 relative z-10">›</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
