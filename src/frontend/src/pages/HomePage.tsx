import { useRouter } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import { playChimeSound } from "../utils/audio";
import { getUILabel } from "../data/arabicTranslations";

/* ─── SVG Icons matching the reference design ─── */

function FlashcardsIconSVG() {
  return (
    <svg viewBox="0 0 64 64" className="w-14 h-14 drop-shadow-md" fill="none">
      {/* Back card (shadow) */}
      <rect x="18" y="10" width="34" height="26" rx="5" fill="white" opacity="0.35" />
      {/* Front card */}
      <rect x="10" y="16" width="36" height="28" rx="5" fill="white" opacity="0.92" />
      {/* A */}
      <text x="15" y="37" fontSize="16" fontWeight="900" fontFamily="Arial,sans-serif" fill="#E84040">A</text>
      {/* B */}
      <text x="27" y="37" fontSize="16" fontWeight="900" fontFamily="Arial,sans-serif" fill="#3A96F0">B</text>
      {/* C */}
      <text x="38" y="37" fontSize="16" fontWeight="900" fontFamily="Arial,sans-serif" fill="#F8B020">C</text>
      {/* Underline */}
      <rect x="14" y="40" width="28" height="2" rx="1" fill="white" opacity="0.5" />
    </svg>
  );
}

function BlendingIconSVG() {
  return (
    <svg viewBox="0 0 64 64" className="w-14 h-14 drop-shadow-md" fill="none">
      {/* Three wavy lines */}
      <path d="M8 18 Q16 12 24 18 Q32 24 40 18 Q48 12 56 18" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M8 30 Q16 24 24 30 Q32 36 40 30 Q48 24 56 30" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M8 42 Q16 36 24 42 Q32 48 40 42 Q48 36 56 42" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* Music note */}
      <circle cx="55" cy="14" r="3" fill="white" opacity="0.85" />
      <rect x="57.5" y="6" width="2" height="9" rx="1" fill="white" opacity="0.85" />
      <path d="M57.5 6 L62 4 L62 6 L57.5 8 Z" fill="white" opacity="0.85" />
    </svg>
  );
}

function TracingIconSVG() {
  return (
    <svg viewBox="0 0 64 64" className="w-14 h-14 drop-shadow-md" fill="none">
      {/* Pencil body */}
      <rect x="14" y="8" width="14" height="40" rx="3" fill="white" opacity="0.85" transform="rotate(35 21 28)" />
      {/* Pencil tip */}
      <polygon points="34,46 42,38 38,52" fill="white" opacity="0.65" />
      {/* Pencil eraser cap */}
      <rect x="8" y="8" width="14" height="7" rx="3" fill="white" opacity="0.5" transform="rotate(35 15 11.5)" />
      {/* Pencil line / writing trail */}
      <path d="M14 52 Q26 50 38 54" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" strokeDasharray="4 3" />
    </svg>
  );
}

function MatchingIconSVG() {
  return (
    <svg viewBox="0 0 64 64" className="w-14 h-14 drop-shadow-md" fill="none">
      {/* Left puzzle piece */}
      <path
        d="M8 20 L24 20 L24 26 Q28 24 28 28 Q28 32 24 30 L24 44 L8 44 L8 38 Q4 38 4 34 Q4 30 8 30 Z"
        fill="white"
        opacity="0.85"
      />
      {/* Right puzzle piece */}
      <path
        d="M56 20 L40 20 L40 26 Q36 24 36 28 Q36 32 40 30 L40 44 L56 44 L56 38 Q60 38 60 34 Q60 30 56 30 Z"
        fill="white"
        opacity="0.65"
      />
    </svg>
  );
}

function PronunciationIconSVG() {
  return (
    <svg viewBox="0 0 64 64" className="w-14 h-14 drop-shadow-md" fill="none">
      {/* Waveform bars of varying heights */}
      <rect x="6"  y="26" width="6" height="12" rx="3" fill="white" opacity="0.9" />
      <rect x="15" y="18" width="6" height="28" rx="3" fill="white" opacity="0.9" />
      <rect x="24" y="22" width="6" height="20" rx="3" fill="white" opacity="0.9" />
      <rect x="33" y="14" width="6" height="36" rx="3" fill="white" opacity="0.9" />
      <rect x="42" y="20" width="6" height="24" rx="3" fill="white" opacity="0.9" />
      <rect x="51" y="10" width="6" height="44" rx="3" fill="white" opacity="0.75" />
    </svg>
  );
}

function PhonicsIconSVG() {
  return (
    <svg viewBox="0 0 64 64" className="w-14 h-14 drop-shadow-md" fill="none">
      {/* Head circle */}
      <circle cx="24" cy="22" r="12" fill="white" opacity="0.9" />
      {/* Body (bust) */}
      <path d="M12 46 C12 38 36 38 36 46" fill="white" opacity="0.9" />
      {/* Sound waves radiating right */}
      <path d="M40 24 Q44 22 44 28 Q44 34 40 32" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />
      <path d="M46 20 Q52 18 52 28 Q52 38 46 36" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M52 16 Q60 14 60 28 Q60 42 52 40" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  );
}

/* ─── Menu config ─── */

type MenuItem = {
  label: string;
  path: string;
  bg: string;
  shadow: string;
  desc?: string;
  icon: React.ReactNode;
};

const MENU: MenuItem[] = [
  {
    label: "Flashcards",
    path: "/flashcards",
    bg: "linear-gradient(160deg, #F04545 0%, #C02222 100%)",
    shadow: "#8B1212",
    desc: "Learn A–Z letters",
    icon: <FlashcardsIconSVG />,
  },
  {
    label: "Blending",
    path: "/blending",
    bg: "linear-gradient(160deg, #42A0F5 0%, #1A72D4 100%)",
    shadow: "#0D4FA0",
    desc: "Blend sounds into words",
    icon: <BlendingIconSVG />,
  },
  {
    label: "Tracing",
    path: "/tracing",
    bg: "linear-gradient(160deg, #62D040 0%, #38A018 100%)",
    shadow: "#237010",
    desc: "Practice writing",
    icon: <TracingIconSVG />,
  },
  {
    label: "Matching",
    path: "/matching",
    bg: "linear-gradient(160deg, #A050E8 0%, #6A1EC8 100%)",
    shadow: "#420EA0",
    desc: "Quiz: match & learn",
    icon: <MatchingIconSVG />,
  },
  {
    label: "Pronunciation",
    path: "/pronunciation",
    bg: "linear-gradient(160deg, #F8B020 0%, #D48010 100%)",
    shadow: "#A05808",
    icon: <PronunciationIconSVG />,
  },
  {
    label: "Phonics",
    path: "/visual-learning",
    bg: "linear-gradient(160deg, #B070E8 0%, #7838C8 100%)",
    shadow: "#4C1E9A",
    icon: <PhonicsIconSVG />,
  },
];

/* ─── Component ─── */

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
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#72C8F0]">

      {/* ── Sky gradient background ── */}
      <div
        className="fixed inset-0 z-0"
        style={{ background: "linear-gradient(180deg,#5BB8F0 0%,#90D8F8 35%,#B8ECA0 65%,#5CC840 100%)" }}
      />

      {/* ── Clouds ── */}
      <div className="fixed top-6 left-4 z-0">
        <div className="relative w-24 h-10">
          <div className="absolute inset-0 bg-white rounded-full opacity-95" />
          <div className="absolute -top-4 left-4 w-12 h-12 bg-white rounded-full opacity-95" />
          <div className="absolute -top-3 left-11 w-9 h-9 bg-white rounded-full opacity-95" />
        </div>
      </div>
      <div className="fixed top-3 right-6 z-0">
        <div className="relative w-20 h-8">
          <div className="absolute inset-0 bg-white rounded-full opacity-90" />
          <div className="absolute -top-3 left-3 w-10 h-10 bg-white rounded-full opacity-90" />
          <div className="absolute -top-2 left-10 w-7 h-7 bg-white rounded-full opacity-90" />
        </div>
      </div>
      <div className="fixed top-14 right-28 z-0">
        <div className="relative w-14 h-5">
          <div className="absolute inset-0 bg-white rounded-full opacity-80" />
          <div className="absolute -top-2.5 left-2 w-7 h-7 bg-white rounded-full opacity-80" />
          <div className="absolute -top-1.5 left-7 w-5 h-5 bg-white rounded-full opacity-80" />
        </div>
      </div>

      {/* ── Butterfly & sparkles ── */}
      <div className="fixed top-20 right-16 z-0 text-xl select-none" style={{ animation: "float 4s ease-in-out infinite" }}>🦋</div>
      <div className="fixed top-12 left-1/3 z-0 text-yellow-300 text-base select-none" style={{ animation: "float 3s ease-in-out infinite 0.5s" }}>✦</div>
      <div className="fixed top-28 right-1/3 z-0 text-yellow-200 text-xs select-none">✦</div>
      <div className="fixed top-16 left-2/3 z-0 text-yellow-300 text-xs select-none" style={{ animation: "float 5s ease-in-out infinite 1s" }}>✦</div>

      {/* ── Green hills at bottom ── */}
      <div className="fixed bottom-0 left-0 right-0 z-0 pointer-events-none" style={{ height: "120px" }}>
        <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="w-full h-full">
          <ellipse cx="60"  cy="130" rx="120" ry="90" fill="#3DB820" />
          <ellipse cx="340" cy="130" rx="110" ry="80" fill="#3DB820" />
          <ellipse cx="200" cy="135" rx="220" ry="70" fill="#2E9F14" />
          <rect x="0" y="100" width="400" height="20" fill="#2E9F14" />
        </svg>
        {/* Flowers & plants */}
        <div className="absolute bottom-2 left-3  text-lg select-none">🌸</div>
        <div className="absolute bottom-0 left-14 text-sm select-none">🌼</div>
        <div className="absolute bottom-1 left-28 text-xs select-none">🌷</div>
        <div className="absolute bottom-2 right-4  text-lg select-none">🌸</div>
        <div className="absolute bottom-0 right-16 text-sm select-none">🌼</div>
        <div className="absolute bottom-1 right-28 text-xs select-none">🌷</div>
        <div className="absolute top-0  left-0  text-4xl select-none" style={{ color: "#27800E" }}>🌿</div>
        <div className="absolute top-0  right-0 text-4xl select-none transform -scale-x-100" style={{ color: "#27800E" }}>🌿</div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="relative z-10 flex flex-col flex-1 overflow-y-auto px-3 pt-4 pb-36">

        {/* Profile + Stars row */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => { playChimeSound(); router.navigate({ to: "/" }); }}
            className="flex items-center gap-2.5 bg-white rounded-2xl pl-2 pr-4 py-2 shadow-lg active:scale-95 transition-all"
            data-ocid="home.switch_profile_button"
          >
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-2xl">
              {profile.avatar}
            </div>
            <div className="text-left">
              <p className="font-black text-sm text-gray-800 leading-tight">{profile.name}</p>
              <p className="text-[11px] text-gray-400">Tap to switch</p>
            </div>
          </button>

          <button
            type="button"
            data-ocid="home.banner_progress"
            onClick={() => navigate("/progress")}
            className="flex items-center gap-1.5 bg-amber-50 border-2 border-amber-300 rounded-2xl px-4 py-2.5 shadow-lg active:scale-95 transition-all"
          >
            <span className="text-xl leading-none">⭐</span>
            <span className="font-black text-xl text-amber-700">{totalStars}</span>
          </button>
        </div>

        {/* Progress banner */}
        <motion.div
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl px-4 py-3.5 mb-4 flex items-center gap-3"
          style={{
            background: "linear-gradient(135deg, #5CC83A 0%, #3A9A1E 100%)",
            boxShadow: "0 5px 0 0 #237010, 0 8px 20px rgba(0,0,0,0.18)",
          }}
        >
          <div className="text-5xl leading-none select-none">📚</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-base font-black text-white leading-tight">
                {getUILabel("Hi")}, {profile.name}! 👋
              </h2>
              <span className="text-white/90 text-xs font-bold shrink-0 ml-2">{totalStars}/26 ⭐</span>
            </div>
            {/* Progress bar */}
            <div className="h-3.5 rounded-full overflow-hidden bg-white/25 border border-white/20">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg,#A0F060,#6EE030)" }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(6, xpPct)}%` }}
                transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
              />
            </div>
            <p className="text-white/75 text-[11px] mt-1 font-body">
              26 letters · 260 words · Keep learning!
            </p>
          </div>
        </motion.div>

        {/* Activity grid */}
        <div className="grid grid-cols-2 gap-3" data-ocid="home.features_section">
          {MENU.map((item, idx) => (
            <motion.button
              key={item.label}
              type="button"
              data-ocid={`home.${item.label.toLowerCase().replace(" ", "_")}_button`}
              onClick={() => navigate(item.path)}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 + idx * 0.07 }}
              whileHover={{ scale: 1.04, transition: { type: "spring", stiffness: 350, damping: 18 } }}
              whileTap={{
                scale: 0.91,
                y: 6,
                boxShadow: `0 1px 0 0 ${item.shadow}, 0 3px 10px rgba(0,0,0,0.18)`,
                transition: { type: "spring", stiffness: 500, damping: 20 },
              }}
              className="rounded-3xl flex flex-col items-center justify-center pt-5 pb-4 px-2 relative overflow-hidden text-white cursor-pointer"
              style={{
                background: item.bg,
                boxShadow: `0 6px 0 0 ${item.shadow}, 0 10px 24px rgba(0,0,0,0.2)`,
                minHeight: 158,
              }}
            >
              {/* Shine */}
              <div
                className="absolute inset-0 pointer-events-none rounded-3xl"
                style={{ background: "linear-gradient(145deg,rgba(255,255,255,0.22) 0%,transparent 50%)" }}
              />
              {/* Faint letter watermark */}
              <div className="absolute bottom-0 right-1 text-[72px] font-black opacity-[0.08] leading-none pointer-events-none select-none">
                {item.label[0]}
              </div>

              {/* Icon */}
              <div className="relative z-10 mb-2 flex items-center justify-center">
                {item.icon}
              </div>

              {/* Title */}
              <span className="relative z-10 text-[17px] font-black leading-tight text-white drop-shadow-sm text-center">
                {item.label}
              </span>

              {/* Arabic */}
              <span className="relative z-10 text-[12px] text-white/85 mt-0.5 text-center" dir="rtl">
                {getUILabel(item.label)}
              </span>

              {/* Description */}
              {item.desc && (
                <span className="relative z-10 text-[11px] text-white/70 mt-0.5 text-center leading-tight px-1">
                  {item.desc}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
