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
    <Layout title={getUILabel("Visual Learning")} headerColor="oklch(0.46 0.22 310)">
      <div className="px-5 py-6 flex flex-col gap-6">

        {/* Letters Grid */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          data-ocid="visual.letters_section"
        >
          <h2 className="text-sm font-display font-bold text-muted-foreground mb-3 text-center uppercase tracking-wider">
            {getUILabel("Tap a letter to hear its sound")}
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {PHONICS_DATA.map((ld, i) => {
              const isActive = activeLetter === ld.uppercase;
              return (
                <motion.button
                  key={ld.letter}
                  type="button"
                  data-ocid={`visual.letter_card.${i + 1}`}
                  onClick={() => handleLetterTap(ld.uppercase)}
                  animate={isActive ? { scale: 1.12 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  className="flex flex-col items-center justify-center rounded-2xl py-3 px-1 cursor-pointer active:scale-95 transition-smooth border"
                  style={{
                    background: isActive ? "oklch(0.94 0.06 310)" : "white",
                    border: isActive
                      ? "1.5px solid oklch(0.55 0.22 310)"
                      : "1px solid oklch(0.90 0.01 260)",
                    boxShadow: isActive
                      ? "0 0 12px oklch(0.55 0.22 310 / 0.20), 0 2px 8px oklch(0 0 0 / 0.06)"
                      : "0 1px 3px oklch(0 0 0 / 0.06)",
                  }}
                >
                  <span
                    className="text-2xl font-display font-black leading-none"
                    style={{ color: isActive ? "oklch(0.46 0.22 310)" : "oklch(0.18 0.02 260)" }}
                  >
                    {ld.uppercase}
                  </span>
                  <span
                    className="text-xs font-display font-semibold mt-0.5 leading-none"
                    style={{ color: isActive ? "oklch(0.55 0.22 310)" : "oklch(0.52 0.03 260)" }}
                  >
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
          <h2 className="text-sm font-display font-bold text-muted-foreground mb-3 text-center uppercase tracking-wider">
            Watch &amp; Learn
          </h2>
          <div
            className="rounded-2xl overflow-hidden border border-border shadow-card bg-muted"
          >
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
