import { useRouter } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout";
import { getUILabel } from "../data/arabicTranslations";
import { PHONICS_DATA } from "../data/phonicsData";
import { useAppStore } from "../store/useAppStore";
import { playLetterPhonetic, playTapSound } from "../utils/audio";

const VIDEO_SRC = "/video/lesson.mp4";
const GAIN_AMOUNT = 2.5;

const LETTER_COLORS = [
  { bg: "oklch(0.72 0.27 130)", press: "oklch(0.56 0.25 130)" },
  { bg: "oklch(0.67 0.21 222)", press: "oklch(0.52 0.20 222)" },
  { bg: "oklch(0.64 0.26 25)", press: "oklch(0.50 0.24 25)" },
  { bg: "oklch(0.66 0.24 310)", press: "oklch(0.52 0.22 310)" },
  { bg: "oklch(0.86 0.21 88)", press: "oklch(0.68 0.19 78)" },
];

export default function VisualLearningPage() {
  const router = useRouter();
  const { profiles, activeProfileId } = useAppStore();
  const profile = profiles.find((p) => p.id === activeProfileId) ?? null;
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    if (!profile) router.navigate({ to: "/" });
  }, [profile, router]);

  const setupAudioBoost = () => {
    const video = videoRef.current;
    if (!video || sourceRef.current) return;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaElementSource(video);
    sourceRef.current = source;
    const gainNode = ctx.createGain();
    gainNode.gain.value = GAIN_AMOUNT;
    gainNodeRef.current = gainNode;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    if (ctx.state === "suspended") ctx.resume();
  };

  useEffect(() => { return () => { audioCtxRef.current?.close(); }; }, []);

  if (!profile) return null;

  const handleLetterTap = (letter: string) => {
    playTapSound();
    setActiveLetter(letter);
    playLetterPhonetic(letter.toLowerCase());
    setTimeout(() => setActiveLetter(null), 600);
  };

  return (
    <Layout title={getUILabel("Visual Learning")}>
      <div className="px-4 py-5 flex flex-col gap-6">

        {/* Letters Grid */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          data-ocid="visual.letters_section"
        >
          <p className="text-sm font-display font-bold text-muted-foreground mb-3 text-center uppercase tracking-wider">
            {getUILabel("Tap a letter to hear its sound")}
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
            {PHONICS_DATA.map((ld, i) => {
              const isActive = activeLetter === ld.uppercase;
              const colorIdx = i % LETTER_COLORS.length;
              const { bg, press } = LETTER_COLORS[colorIdx];
              return (
                <motion.button
                  key={ld.letter}
                  type="button"
                  data-ocid={`visual.letter_card.${i + 1}`}
                  onClick={() => handleLetterTap(ld.uppercase)}
                  animate={isActive ? { scale: 1.1, y: 4 } : { scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  className="flex flex-col items-center justify-center rounded-2xl py-3 px-1 cursor-pointer transition-smooth relative overflow-hidden"
                  style={{
                    background: bg,
                    boxShadow: isActive ? `0 0 0 0 transparent` : `0 4px 0 0 ${press}`,
                    border: "none",
                  }}
                >
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(135deg, oklch(1 0 0 / 0.14) 0%, transparent 55%)" }}
                  />
                  <span className="text-2xl font-display font-black leading-none text-white relative z-10 drop-shadow">
                    {ld.uppercase}
                  </span>
                  <span className="text-xs font-display font-bold mt-0.5 leading-none text-white/75 relative z-10">
                    {ld.lowercase}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {/* Video Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          data-ocid="visual.video_section"
        >
          <p className="text-sm font-display font-bold text-muted-foreground mb-3 text-center uppercase tracking-wider">
            Watch &amp; Learn
          </p>
          <div className="rounded-3xl overflow-hidden border-2 border-border shadow-duo bg-muted">
            <video
              ref={videoRef}
              src={VIDEO_SRC}
              controls
              playsInline
              onPlay={setupAudioBoost}
              data-ocid="visual.video_player"
              className="w-full block"
            />
          </div>
        </motion.section>
      </div>
    </Layout>
  );
}
