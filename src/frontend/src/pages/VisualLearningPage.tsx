import { useRouter } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { PHONICS_DATA } from "../data/phonicsData";
import { useAppStore } from "../store/useAppStore";
import { playLetterPhonetic, playTapSound } from "../utils/audio";

export default function VisualLearningPage() {
  const router = useRouter();
  const { profiles, activeProfileId } = useAppStore();
  const profile = profiles.find((p) => p.id === activeProfileId) ?? null;
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) router.navigate({ to: "/" });
  }, [profile, router]);

  if (!profile) return null;

  const handleLetterTap = (letter: string) => {
    playTapSound();
    setActiveLetter(letter);
    playLetterPhonetic(letter.toLowerCase());
    setTimeout(() => setActiveLetter(null), 600);
  };

  return (
    <Layout title="Visual Learning" headerColor="oklch(0.38 0.20 320)">
      <div className="px-5 py-6 flex flex-col gap-8">
        {/* ── Letters Grid Section ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          data-ocid="visual.letters_section"
        >
          <h2
            className="text-center text-base font-display font-bold mb-4"
            style={{ color: "oklch(0.92 0.18 84)" }}
          >
            Tap a letter to hear its sound
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
            {PHONICS_DATA.map((ld, i) => {
              const isActive = activeLetter === ld.uppercase;
              return (
                <motion.button
                  key={ld.letter}
                  type="button"
                  data-ocid={`visual.letter_card.${i + 1}`}
                  onClick={() => handleLetterTap(ld.uppercase)}
                  animate={isActive ? { scale: 1.15 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  className="relative flex flex-col items-center justify-center rounded-2xl py-3 px-1 cursor-pointer active:scale-95 transition-smooth"
                  style={{
                    background: isActive
                      ? "oklch(0.18 0.06 84)"
                      : "oklch(0.13 0.03 264)",
                    border: isActive
                      ? "1.5px solid oklch(0.82 0.17 84 / 0.9)"
                      : "1px solid oklch(0.82 0.17 84 / 0.2)",
                    boxShadow: isActive
                      ? "0 0 16px oklch(0.82 0.17 84 / 0.45), 0 2px 8px oklch(0 0 0 / 0.4)"
                      : "0 2px 8px oklch(0 0 0 / 0.3)",
                  }}
                >
                  <span
                    className="text-2xl font-display font-black leading-none"
                    style={{ color: "oklch(0.96 0.02 0)" }}
                  >
                    {ld.uppercase}
                  </span>
                  <span
                    className="text-xs font-display font-semibold mt-0.5 leading-none"
                    style={{ color: "oklch(0.75 0.12 84)" }}
                  >
                    {ld.lowercase}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {/* ── Educational Video Section ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          data-ocid="visual.video_section"
        >
          <h2
            className="text-center text-base font-display font-bold mb-4"
            style={{ color: "oklch(0.92 0.18 84)" }}
          >
            Watch &amp; Learn
          </h2>
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              border: "1.5px solid oklch(0.82 0.17 84 / 0.35)",
              boxShadow: "0 8px 32px oklch(0 0 0 / 0.5)",
            }}
          >
            {/* 16:9 aspect ratio wrapper */}
            <div
              className="relative w-full"
              style={{ paddingBottom: "56.25%" }}
            >
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/hq3yfQnllfQ"
                title="ABC Phonics Song – Learn the sounds of each letter"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                data-ocid="visual.video_player"
              />
            </div>
          </div>
          <p
            className="text-center text-xs font-body mt-3"
            style={{ color: "oklch(0.65 0.08 84)" }}
          >
            ABC Phonics Song – Learn the sounds of each letter
          </p>
        </motion.section>
      </div>
    </Layout>
  );
}
