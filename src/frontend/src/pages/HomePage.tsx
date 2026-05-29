import { useRouter } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import { playChimeSound } from "../utils/audio";
import { getUILabel } from "../data/arabicTranslations";

type MenuItem = {
  label: string;
  arabicLabel: string;
  path: string;
  bg: string;
  shadow: string;
  desc?: string;
  icon: React.ReactNode;
};

function FlashcardIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none">
      <rect x="8" y="14" width="30" height="22" rx="4" fill="white" opacity="0.35" />
      <rect x="4" y="10" width="30" height="22" rx="4" fill="white" opacity="0.6" />
      <rect x="10" y="16" width="24" height="3" rx="1.5" fill="white" opacity="0.8" />
      <rect x="10" y="22" width="16" height="2.5" rx="1.25" fill="white" opacity="0.6" />
    </svg>
  );
}

function BlendingIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none">
      <path d="M6 20 Q14 14 22 20 Q30 26 38 20" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.9" />
      <path d="M6 28 Q14 22 22 28 Q30 34 38 28" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.9" />
      <circle cx="40" cy="13" r="2.5" fill="white" opacity="0.7" />
      <path d="M38 10 L40 8 L42 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />
    </svg>
  );
}

function TracingIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none">
      <path d="M12 34 L28 12 L34 18 L18 40 L10 42 Z" fill="white" opacity="0.85" />
      <path d="M28 12 L34 18" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      <path d="M30 10 L36 8 L38 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
      <path d="M12 34 L10 42 L18 40" fill="white" opacity="0.5" />
    </svg>
  );
}

function MatchingIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none">
      <path d="M6 24 C6 20 10 18 13 20 C14 16 18 14 20 17 C22 13 27 14 27 18 C30 16 34 18 32 22 C35 22 36 27 33 28 C34 32 30 34 27 31 C26 35 21 35 20 31 C18 34 13 33 13 29 C9 30 6 27 6 24 Z" fill="white" opacity="0.9" />
      <path d="M28 26 C28 22 32 20 35 22 C36 18 40 16 42 19 C44 22 42 26 39 26 C41 28 40 32 37 32 C35 34 31 33 30 30 C27 31 26 28 28 26 Z" fill="white" opacity="0.6" />
    </svg>
  );
}

function PronunciationIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none">
      <rect x="10" y="18" width="4" height="12" rx="2" fill="white" opacity="0.9" />
      <rect x="17" y="12" width="4" height="24" rx="2" fill="white" opacity="0.9" />
      <rect x="24" y="16" width="4" height="16" rx="2" fill="white" opacity="0.9" />
      <rect x="31" y="20" width="4" height="8" rx="2" fill="white" opacity="0.9" />
      <rect x="38" y="14" width="4" height="20" rx="2" fill="white" opacity="0.9" />
    </svg>
  );
}

function PhonicsIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none">
      <circle cx="22" cy="22" r="12" stroke="white" strokeWidth="3" fill="none" opacity="0.9" />
      <circle cx="22" cy="18" r="4" fill="white" opacity="0.9" />
      <path d="M14 30 C14 26 17.5 24 22 24 C26.5 24 30 26 30 30" fill="white" opacity="0.9" />
      <path d="M34 18 C36 20 36 24 34 26" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
      <path d="M37 15 C40 18 40 26 37 29" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6" />
    </svg>
  );
}

const MENU: MenuItem[] = [
  {
    label: "Flashcards",
    arabicLabel: "بطاقات تعليمية",
    path: "/flashcards",
    bg: "linear-gradient(145deg, #E84040 0%, #B82828 100%)",
    shadow: "#8B1A1A",
    desc: "Learn A–Z letters",
    icon: <FlashcardIcon />,
  },
  {
    label: "Blending",
    arabicLabel: "دمج الأصوات",
    path: "/blending",
    bg: "linear-gradient(145deg, #3A96F0 0%, #1E6FCC 100%)",
    shadow: "#134E9E",
    desc: "Blend sounds into words",
    icon: <BlendingIcon />,
  },
  {
    label: "Tracing",
    arabicLabel: "تتبع الكتابة",
    path: "/tracing",
    bg: "linear-gradient(145deg, #5CC83A 0%, #3A9A1E 100%)",
    shadow: "#267010",
    desc: "Practice writing",
    icon: <TracingIcon />,
  },
  {
    label: "Matching",
    arabicLabel: "مطابقة",
    path: "/matching",
    bg: "linear-gradient(145deg, #9B4EE0 0%, #6E28B8 100%)",
    shadow: "#4A158A",
    desc: "Quiz: match & learn",
    icon: <MatchingIcon />,
  },
  {
    label: "Pronunciation",
    arabicLabel: "النطق",
    path: "/pronunciation",
    bg: "linear-gradient(145deg, #F5A623 0%, #D4821A 100%)",
    shadow: "#A05E0A",
    icon: <PronunciationIcon />,
  },
  {
    label: "Phonics",
    arabicLabel: "الفونيكس",
    path: "/visual-learning",
    bg: "linear-gradient(145deg, #A86EE0 0%, #7B44C0 100%)",
    shadow: "#5528A0",
    icon: <PhonicsIcon />,
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
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Sky background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: "linear-gradient(180deg, #87CEEB 0%, #B8E4F9 40%, #D4F0C0 70%, #5DBB3F 100%)",
        }}
      />

      {/* Decorative clouds */}
      <div className="fixed top-4 left-6 z-0 opacity-90">
        <div className="w-20 h-8 bg-white rounded-full relative">
          <div className="absolute -top-3 left-3 w-10 h-10 bg-white rounded-full" />
          <div className="absolute -top-2 left-9 w-7 h-7 bg-white rounded-full" />
        </div>
      </div>
      <div className="fixed top-8 right-10 z-0 opacity-80">
        <div className="w-16 h-6 bg-white rounded-full relative">
          <div className="absolute -top-3 left-2 w-8 h-8 bg-white rounded-full" />
          <div className="absolute -top-2 left-7 w-6 h-6 bg-white rounded-full" />
        </div>
      </div>

      {/* Butterfly */}
      <div className="fixed top-16 right-20 z-0 text-2xl animate-bounce" style={{ animationDuration: "3s" }}>
        🦋
      </div>

      {/* Stars sparkle */}
      <div className="fixed top-24 left-1/2 z-0 text-yellow-300 text-sm">✦</div>
      <div className="fixed top-32 left-1/4 z-0 text-yellow-200 text-xs">✦</div>
      <div className="fixed top-20 right-1/3 z-0 text-yellow-300 text-xs">✦</div>

      {/* Green hills at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-0 h-32">
        <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="w-full h-full">
          <ellipse cx="80" cy="120" rx="140" ry="80" fill="#4CAF35" />
          <ellipse cx="320" cy="120" rx="130" ry="70" fill="#4CAF35" />
          <ellipse cx="200" cy="125" rx="220" ry="60" fill="#3D9A28" />
          <rect x="0" y="90" width="400" height="30" fill="#3D9A28" />
        </svg>
        {/* Flowers */}
        <div className="absolute bottom-2 left-4 text-lg">🌸</div>
        <div className="absolute bottom-1 left-16 text-sm">🌼</div>
        <div className="absolute bottom-2 right-8 text-lg">🌸</div>
        <div className="absolute bottom-0 right-24 text-sm">🌼</div>
        {/* Leaves on sides */}
        <div className="absolute top-0 left-0 text-4xl text-green-700 opacity-70">🌿</div>
        <div className="absolute top-0 right-0 text-4xl text-green-700 opacity-70 scale-x-[-1]">🌿</div>
      </div>

      {/* Scrollable content */}
      <div className="relative z-10 flex flex-col flex-1 px-4 pt-4 pb-36 overflow-y-auto">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => { playChimeSound(); router.navigate({ to: "/" }); }}
            className="flex items-center gap-2 bg-white rounded-2xl px-3 py-2 shadow-md active:scale-95 transition-all"
            data-ocid="home.switch_profile_button"
          >
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-2xl">
              {profile.avatar}
            </div>
            <div className="text-left">
              <p className="font-black text-base text-gray-800 leading-tight font-display">
                {profile.name}
              </p>
              <p className="text-xs text-gray-400 font-body">Tap to switch</p>
            </div>
          </button>

          <button
            type="button"
            data-ocid="home.banner_progress"
            onClick={() => navigate("/progress")}
            className="flex items-center gap-2 bg-amber-100 border-2 border-amber-300 rounded-2xl px-4 py-2 shadow-md active:scale-95 transition-all"
          >
            <span className="text-xl">⭐</span>
            <span className="font-black text-xl text-amber-700 font-display">{totalStars}</span>
          </button>
        </div>

        {/* Progress banner */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl p-4 mb-5 flex items-center gap-4"
          style={{
            background: "linear-gradient(135deg, #5CC83A 0%, #3A9A1E 100%)",
            boxShadow: "0 5px 0 0 #267010, 0 8px 20px rgba(0,0,0,0.15)",
          }}
        >
          <div className="text-5xl">📚</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-lg font-black text-white font-display">
                {getUILabel("Hi")}, {profile.name}! 👋
              </h2>
              <span className="text-white/90 text-sm font-bold font-body">{totalStars}/26 ⭐</span>
            </div>
            <div className="h-4 rounded-full bg-white/30 overflow-hidden border border-white/20">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #8EE855, #5CC83A)" }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(8, xpPct)}%` }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              />
            </div>
            <p className="text-white/80 text-xs font-body mt-1">
              26 letters · 260 words · Keep learning!
            </p>
          </div>
        </motion.div>

        {/* Activity cards grid */}
        <div className="grid grid-cols-2 gap-3" data-ocid="home.features_section">
          {MENU.map((item, idx) => (
            <motion.button
              key={item.label}
              type="button"
              data-ocid={`home.${item.label.toLowerCase().replace(" ", "_")}_button`}
              onClick={() => navigate(item.path)}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 + idx * 0.07 }}
              whileTap={{ scale: 0.95, y: 4 }}
              className="rounded-3xl p-4 flex flex-col items-center justify-center gap-1.5 text-white relative overflow-hidden"
              style={{
                background: item.bg,
                boxShadow: `0 6px 0 0 ${item.shadow}, 0 10px 24px rgba(0,0,0,0.18)`,
                minHeight: "150px",
              }}
            >
              {/* Shine overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 55%)" }}
              />
              {/* Faint letter watermark */}
              <div className="absolute bottom-2 right-3 text-6xl font-black opacity-10 pointer-events-none select-none font-display">
                {item.label[0]}
              </div>

              <div className="relative z-10 flex items-center justify-center mb-1">
                {item.icon}
              </div>

              <span className="relative z-10 text-lg font-black leading-tight font-display text-white drop-shadow">
                {item.label}
              </span>
              <span className="relative z-10 text-xs font-body text-white/90" dir="rtl">
                {item.arabicLabel}
              </span>
              {item.desc && (
                <span className="relative z-10 text-[11px] font-body text-white/75 text-center leading-tight px-1">
                  {item.desc}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
