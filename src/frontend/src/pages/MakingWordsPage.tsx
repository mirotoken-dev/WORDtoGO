import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, Delete, Volume2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { PHONICS_DATA } from "../data/phonicsData";
import {
  playLetterPhonetic,
  playLetterSequence,
  playTapSound,
  preloadLetterAudio,
} from "../utils/audio";

const MAX_LETTERS = 6;

const COLOR_CLASSES: Record<string, string> = {
  red: "gradient-red",
  blue: "gradient-blue",
  green: "gradient-green",
  yellow: "gradient-yellow",
  purple: "gradient-purple",
};

// Vivid chip colors that pop on dark backgrounds with a subtle glow
const CHIP_COLORS: Record<string, { bg: string; text: string; glow: string }> =
  {
    red: {
      bg: "bg-[oklch(0.72_0.28_15)]",
      text: "text-white",
      glow: "oklch(0.72 0.28 15 / 0.5)",
    },
    blue: {
      bg: "bg-[oklch(0.68_0.24_264)]",
      text: "text-white",
      glow: "oklch(0.68 0.24 264 / 0.5)",
    },
    green: {
      bg: "bg-[oklch(0.72_0.27_131)]",
      text: "text-white",
      glow: "oklch(0.72 0.27 131 / 0.5)",
    },
    yellow: {
      bg: "bg-[oklch(0.90_0.18_84)]",
      text: "text-[oklch(0.08_0_0)]",
      glow: "oklch(0.90 0.18 84 / 0.5)",
    },
    purple: {
      bg: "bg-[oklch(0.68_0.22_320)]",
      text: "text-white",
      glow: "oklch(0.68 0.22 320 / 0.5)",
    },
  };

type SelectedLetter = {
  letter: string;
  phonicSound: string;
  color: string;
  id: number;
};

export default function MakingWordsPage() {
  const router = useRouter();
  const [sequence, setSequence] = useState<SelectedLetter[]>([]);
  const [shakeStrip, setShakeStrip] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [idCounter, setIdCounter] = useState(0);

  // Preload mp3 files when page mounts
  useEffect(() => {
    void preloadLetterAudio();
  }, []);

  const handleLetterTap = useCallback(
    (letterData: (typeof PHONICS_DATA)[0]) => {
      if (sequence.length >= MAX_LETTERS) {
        setShakeStrip(true);
        setTimeout(() => setShakeStrip(false), 500);
        return;
      }
      playTapSound();
      // Play the user-supplied mp3 phonetic sound (falls back to speech synthesis for u–z)
      void playLetterPhonetic(letterData.letter);
      setSequence((prev) => [
        ...prev,
        {
          letter: letterData.letter,
          phonicSound: letterData.phonicSound,
          color: letterData.color,
          id: idCounter,
        },
      ]);
      setIdCounter((c) => c + 1);
    },
    [sequence.length, idCounter],
  );

  const handleBackspace = useCallback(() => {
    if (sequence.length === 0) return;
    playTapSound();
    setSequence((prev) => prev.slice(0, -1));
  }, [sequence.length]);

  const handleClear = useCallback(() => {
    if (sequence.length === 0) return;
    playTapSound();
    setSequence([]);
  }, [sequence.length]);

  const handleSayIt = useCallback(() => {
    if (sequence.length === 0 || isSpeaking) return;
    playTapSound();
    setIsSpeaking(true);
    // Play each letter's mp3 phonetic sound in sequence with a gap between each
    const letters = sequence.map((s) => s.letter);
    playLetterSequence(letters).finally(() => {
      setIsSpeaking(false);
    });
  }, [sequence, isSpeaking]);

  const isEmpty = sequence.length === 0;
  const isFull = sequence.length >= MAX_LETTERS;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header — luxury dark */}
      <header
        className="border-b border-[oklch(0.82_0.17_84/0.2)] px-4 py-3 flex items-center gap-3 backdrop-blur-sm"
        style={{ background: "oklch(0.10 0.02 264 / 0.95)" }}
      >
        <motion.button
          type="button"
          data-ocid="making-words.back_button"
          onClick={() => {
            playTapSound();
            router.navigate({ to: "/home" });
          }}
          className="w-10 h-10 rounded-2xl bg-muted border border-[oklch(0.82_0.17_84/0.25)] flex items-center justify-center text-[oklch(0.82_0.17_84)] active:scale-95 transition-smooth hover:border-[oklch(0.82_0.17_84/0.5)]"
          whileTap={{ scale: 0.9 }}
        >
          <ArrowLeft size={20} />
        </motion.button>
        <div>
          <h1 className="font-display font-black text-lg text-foreground leading-tight">
            Making Words 🔤
          </h1>
          <p className="text-xs font-body text-muted-foreground">
            Tap letters to build sounds!
          </p>
        </div>
      </header>

      {/* Letter Display Strip */}
      <div
        className="border-b border-[oklch(0.82_0.17_84/0.15)] px-4 py-3"
        style={{ background: "oklch(0.12 0.02 264)" }}
      >
        <div className="flex items-center gap-2 min-h-[56px] flex-wrap">
          <motion.div
            className="flex gap-2 flex-wrap flex-1"
            animate={shakeStrip ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            data-ocid="making-words.sequence_strip"
          >
            <AnimatePresence mode="popLayout">
              {sequence.map((item, idx) => {
                const chip = CHIP_COLORS[item.color] ?? CHIP_COLORS.blue;
                return (
                  <motion.div
                    key={item.id}
                    data-ocid={`making-words.chip.${idx + 1}`}
                    initial={{ scale: 0, opacity: 0, y: -10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className={`${chip.bg} ${chip.text} w-11 h-11 rounded-2xl flex items-center justify-center font-display font-black text-xl flex-shrink-0`}
                    style={{ boxShadow: `0 0 12px ${chip.glow}` }}
                  >
                    {item.letter}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {isEmpty && (
              <p className="text-muted-foreground font-body text-sm self-center italic">
                Tap a letter to start…
              </p>
            )}
          </motion.div>

          {/* Counter */}
          <span
            className={`text-xs font-display font-bold px-2 py-1 rounded-full border ${isFull ? "bg-destructive/20 text-destructive border-destructive/30" : "bg-muted text-muted-foreground border-border"}`}
          >
            {sequence.length}/{MAX_LETTERS}
          </span>
        </div>

        {/* Action buttons row */}
        <div className="flex gap-2 mt-2">
          {/* Backspace */}
          <motion.button
            type="button"
            data-ocid="making-words.backspace_button"
            onClick={handleBackspace}
            disabled={isEmpty}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border font-body text-sm text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-smooth active:scale-95 hover:border-[oklch(0.82_0.17_84/0.4)]"
            whileTap={!isEmpty ? { scale: 0.93 } : {}}
          >
            <Delete size={16} />
            <span>Back</span>
          </motion.button>

          {/* Clear */}
          <motion.button
            type="button"
            data-ocid="making-words.clear_button"
            onClick={handleClear}
            disabled={isEmpty}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border font-body text-sm text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-smooth active:scale-95 hover:border-[oklch(0.82_0.17_84/0.4)]"
            whileTap={!isEmpty ? { scale: 0.93 } : {}}
          >
            <X size={16} />
            <span>Clear</span>
          </motion.button>

          {/* Say It — gold luxury CTA */}
          <motion.button
            type="button"
            data-ocid="making-words.say_it_button"
            onClick={handleSayIt}
            disabled={isEmpty || isSpeaking}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl gradient-gold text-[oklch(0.08_0_0)] font-display font-black text-base disabled:opacity-40 disabled:cursor-not-allowed transition-smooth active:scale-95"
            style={{
              boxShadow: isEmpty
                ? "none"
                : "0 4px 16px oklch(0.82 0.17 84 / 0.4)",
            }}
            whileTap={!isEmpty ? { scale: 0.95 } : {}}
            animate={isSpeaking ? { scale: [1, 1.03, 1] } : { scale: 1 }}
            transition={
              isSpeaking
                ? { repeat: Number.POSITIVE_INFINITY, duration: 0.6 }
                : {}
            }
          >
            <Volume2 size={18} />
            {isSpeaking ? "Saying…" : "Say it!"}
          </motion.button>
        </div>
      </div>

      {/* Letter Grid */}
      <div
        className="flex-1 px-3 py-4 overflow-y-auto"
        data-ocid="making-words.letter_grid"
      >
        <div className="grid grid-cols-5 gap-2 max-w-sm mx-auto sm:grid-cols-6 sm:max-w-md">
          {PHONICS_DATA.map((letterData, idx) => {
            const gradientClass =
              COLOR_CLASSES[letterData.color] ?? "gradient-blue";
            const disabled = isFull;
            return (
              <motion.button
                key={letterData.letter}
                type="button"
                data-ocid={`making-words.letter_tile.${idx + 1}`}
                onClick={() => handleLetterTap(letterData)}
                disabled={disabled}
                className={`${gradientClass} rounded-2xl aspect-square flex flex-col items-center justify-center font-display font-black select-none transition-smooth ${disabled ? "opacity-40 cursor-not-allowed" : "active:scale-90"}`}
                style={{
                  boxShadow: disabled
                    ? "none"
                    : "0 4px 12px oklch(0 0 0 / 0.4), 0 0 0 1px oklch(1 0 0 / 0.1) inset",
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: idx * 0.02,
                  type: "spring",
                  stiffness: 300,
                }}
                whileTap={!disabled ? { scale: 0.85, rotate: [-3, 3, 0] } : {}}
              >
                <span className="text-2xl text-card leading-none">
                  {letterData.letter}
                </span>
                <span className="text-[9px] text-card/80 leading-none mt-0.5 font-body tracking-tight">
                  {letterData.phonicSound}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <footer className="py-3 text-center bg-card/60 border-t border-[oklch(0.82_0.17_84/0.15)]">
        <p className="text-xs text-muted-foreground font-body">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.hostname : "",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[oklch(0.82_0.17_84)] transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
