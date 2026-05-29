import { useRouter } from "@tanstack/react-router";
import {
  AudioLines,
  BookOpen,
  Grid3x3,
  Pencil,
  Speech,
  Waves,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import { playChimeSound } from "../utils/audio";
import { getUILabel } from "../data/arabicTranslations";

type MenuItem = {
  label: string;
  icon: LucideIcon;
  path: string;
  colorFrom: string;
  colorTo: string;
  shadow: string;
  desc: string;
};

const MENU: MenuItem[] = [
  {
    label: "Flashcards",
    icon: BookOpen,
    path: "/flashcards",
    colorFrom: "oklch(0.64 0.26 25)",
    colorTo: "oklch(0.50 0.26 15)",
    shadow: "oklch(0.46 0.24 15)",
    desc: "Learn A–Z letters",
  },
  {
    label: "Blending",
    icon: Waves,
    path: "/blending",
    colorFrom: "oklch(0.67 0.21 222)",
    colorTo: "oklch(0.52 0.20 222)",
    shadow: "oklch(0.46 0.19 222)",
    desc: "Blend sounds into words",
  },
  {
    label: "Tracing",
    icon: Pencil,
    path: "/tracing",
    colorFrom: "oklch(0.72 0.27 130)",
    colorTo: "oklch(0.56 0.25 130)",
    shadow: "oklch(0.50 0.23 130)",
    desc: "Practice writing",
  },
  {
    label: "Matching",
    icon: Grid3x3,
    path: "/matching",
    colorFrom: "oklch(0.62 0.22 280)",
    colorTo: "oklch(0.48 0.21 280)",
    shadow: "oklch(0.42 0.20 280)",
    desc: "Quiz: match & learn",
  },
  {
    label: "Pronunciation",
    icon: AudioLines,
    path: "/pronunciation",
    colorFrom: "oklch(0.86 0.21 88)",
    colorTo: "oklch(0.70 0.18 84)",
    shadow: "oklch(0.62 0.17 78)",
    desc: "Say the word aloud",
  },
  {
    label: "Phonics",
    icon: Speech,
    path: "/visual-learning",
    colorFrom: "oklch(0.66 0.24 310)",
    colorTo: "oklch(0.52 0.22 310)",
    shadow: "oklch(0.46 0.20 310)",
    desc: "Phonics",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { profiles, activeProfileId, progress } = useAppStore();
  const profile = profiles.find((p) => p.id === activeProfileId) ?? null;

  useEffect(() => {
    if (!profile) router.navigate({ to: "/" });
  }, [profile, router]);

  if (!profile) return null;

  const navigate = (path: string) => {
    playChimeSound();
    router.navigate({ to: path as "/" });
  };

  const totalStars = progress?.totalStars ?? 0;
  const xpPct = Math.min(100, (totalStars / 26) * 100);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-white border-b-2 border-border px-5 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => { playChimeSound(); router.navigate({ to: "/" }); }}
          className="flex items-center gap-3 active:scale-95 transition-smooth"
          data-ocid="home.switch_profile_button"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[oklch(0.72_0.27_130/0.15)] to-[oklch(0.67_0.21_222/0.15)] border-2 border-[oklch(0.88_0.012_260)] flex items-center justify-center text-2xl shadow-duo">
            {profile.avatar}
          </div>
          <div className="text-left">
            <p className="font-display font-black text-base text-foreground leading-tight">
              {profile.name}
            </p>
            <p className="text-xs font-body text-muted-foreground">
              Tap to switch
            </p>
          </div>
        </button>

        <button
          type="button"
          data-ocid="home.banner_progress"
          onClick={() => navigate("/progress")}
          className="flex items-center gap-2 bg-[oklch(0.86_0.21_88/0.15)] border-2 border-[oklch(0.86_0.21_88/0.4)] rounded-2xl px-3 py-2 active:scale-95 transition-smooth"
        >
          <span className="text-xl">⭐</span>
          <span className="font-display font-black text-xl text-[oklch(0.55_0.18_78)]">
            {totalStars}
          </span>
        </button>
      </header>

      {/* XP Banner */}
      <div
        className="px-5 py-5 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, oklch(0.72 0.27 130) 0%, oklch(0.56 0.25 130) 100%)` }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-6 translate-x-6" />
        <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/10 translate-y-6 -translate-x-4" />

        <div className="relative flex items-center gap-4">
          <div className="text-5xl float">📚</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-display font-black text-white">
                {getUILabel("Hi")}, {profile.name}! 👋
              </h2>
              <span className="text-white/80 text-sm font-bold font-body">{totalStars}/26 ⭐</span>
            </div>
            <div className="xp-bar">
              <motion.div
                className="xp-fill"
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              />
            </div>
            <p className="text-white/70 text-xs font-body mt-1.5">
              26 letters · 260 words · Keep learning!
            </p>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="flex-1 px-4 py-5 grid grid-cols-2 gap-3" data-ocid="home.features_section">
        {MENU.map((item, idx) => (
          <motion.button
            key={item.label}
            type="button"
            data-ocid={`home.${item.label.toLowerCase().replace(" ", "_")}_button`}
            onClick={() => navigate(item.path)}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: idx * 0.07 }}
            className="rounded-3xl p-5 flex flex-col items-start justify-between gap-2 text-white min-h-[140px] relative overflow-hidden transition-smooth active:scale-95 active:translate-y-1"
            style={{
              background: `linear-gradient(145deg, ${item.colorFrom} 0%, ${item.colorTo} 100%)`,
              boxShadow: `0 6px 0 0 ${item.shadow}, 0 8px 20px oklch(0 0 0 / 0.15)`,
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(135deg, oklch(1 0 0 / 0.14) 0%, transparent 50%)" }}
            />
            <item.icon className="w-10 h-10 text-white/90 relative z-10" strokeWidth={1.5} />
            <div className="relative z-10">
              <span className="text-xl font-display font-black leading-tight block">
                {item.label}
              </span>
              <span className="text-xs font-[var(--font-arabic)] opacity-90 block mt-0.5" dir="rtl">
                {getUILabel(item.label)}
              </span>
              <span className="text-xs font-body opacity-80 block mt-0.5">
                {item.desc}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
