import { useRouter } from "@tanstack/react-router";
import {
  AudioLines,
  BarChart2,
  BookOpen,
  Grid3x3,
  Mic,
  Pencil,
  Video,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import StarBadge from "../components/StarBadge";
import { useAppStore } from "../store/useAppStore";
import { playTapSound } from "../utils/audio";
import { getUILabel } from "../data/arabicTranslations";

const MENU = [
  {
    label: "Flashcards",
    icon: BookOpen,
    path: "/flashcards",
    colorClass: "gradient-red",
    desc: "Learn A–Z letters",
  },
  {
    label: "Blending",
    icon: AudioLines,
    path: "/blending",
    colorClass: "gradient-blue",
    desc: "Blend sounds into words",
  },
  {
    label: "Tracing",
    icon: Pencil,
    path: "/tracing",
    colorClass: "gradient-green",
    desc: "Practice writing",
  },
  {
    label: "Visual",
    icon: Video,
    path: "/visual-learning",
    colorClass: "gradient-purple",
    desc: "Videos & audio lessons",
  },
  {
    label: "Progress",
    icon: BarChart2,
    path: "/progress",
    colorClass: "gradient-yellow",
    desc: "See achievements",
  },
  {
    label: "Matching",
    icon: Grid3x3,
    path: "/matching",
    colorClass: "gradient-indigo",
    desc: "Quiz: match & learn",
  },
  {
    label: "Pronunciation",
    icon: Mic,
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
      {/* Header */}
      <header className="bg-white border-b border-border px-5 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-muted border border-border flex items-center justify-center text-2xl flex-shrink-0">
            {profile.avatar}
          </div>
          <div>
            <p className="font-display font-bold text-base text-foreground leading-tight">
              {getUILabel("Hi")}, {profile.name}! 👋
            </p>
            <p className="text-xs font-body text-muted-foreground">{getUILabel("Ready to learn?")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StarBadge count={progress?.totalStars ?? 0} size="sm" />
          <button
            type="button"
            data-ocid="home.switch_profile_button"
            onClick={() => { playTapSound(); router.navigate({ to: "/" }); }}
            className="text-xs font-body text-[oklch(0.55_0.22_280)] underline px-2 py-1 active:opacity-70 transition-smooth"
          >
            Switch
          </button>
        </div>
      </header>

      {/* Banner */}
      <div
        className="px-6 py-7 flex items-center gap-5"
        style={{
          background: "linear-gradient(135deg, oklch(0.58 0.22 280) 0%, oklch(0.44 0.22 280) 100%)",
        }}
      >
        <div className="text-5xl">📚</div>
        <div>
          <h2 className="text-2xl font-display font-black text-white leading-tight">
            Word to Go
          </h2>
          <p className="text-white/70 text-sm font-body mt-0.5">
            26 letters · 260 words
          </p>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="flex-1 px-5 py-5 grid grid-cols-2 gap-3" data-ocid="home.features_section">
        {MENU.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              type="button"
              data-ocid={`home.${item.label.toLowerCase().replace(" ", "_")}_button`}
              onClick={() => navigate(item.path)}
              className={`${item.colorClass} rounded-2xl p-5 flex flex-col items-start justify-between gap-3 active:scale-95 transition-smooth text-white min-h-[130px] relative overflow-hidden`}
              style={{ boxShadow: "0 4px 20px oklch(0 0 0 / 0.15)" }}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.06 }}
              whileTap={{ scale: 0.95 }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(135deg, oklch(1 0 0 / 0.12) 0%, transparent 55%)" }}
              />
              <Icon className="w-7 h-7 relative z-10 opacity-95" strokeWidth={2} />
              <div className="relative z-10">
                <span className="text-lg font-display font-black leading-tight block">
                  {item.label}
                </span>
                <span className="text-sm font-[var(--font-arabic)] opacity-90 mt-0.5 block" dir="rtl">
                  {getUILabel(item.label)}
                </span>
                <span className="text-xs font-body opacity-80 mt-0.5 block">
                  {item.desc}
                </span>
                <span className="text-xs font-[var(--font-arabic)] opacity-70 block" dir="rtl">
                  {getUILabel(item.desc)}
                </span>
              </div>
            </motion.button>
          );
        })}
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
