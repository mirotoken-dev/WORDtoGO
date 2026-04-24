import { useRouter } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import Layout from "../components/Layout";
import ProgressBar from "../components/ProgressBar";
import { PHONICS_DATA } from "../data/phonicsData";
import { useAppStore } from "../store/useAppStore";
import {
  playSuccessSound,
  playTapSound,
  playTone,
  speakLetter,
  speakWord,
} from "../utils/audio";

function playLetterSound(letter: string): void {
  const index = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(letter.toUpperCase());
  if (index === -1) return;
  const frequencies = [
    262, 294, 330, 349, 392, 440, 494, 523, 587, 659, 698, 784, 880, 988, 1047,
    1175, 1319, 1397, 1568, 1760, 1976, 523, 659, 784, 988, 1047,
  ];
  playTone(frequencies[index] ?? 440, 0.3, "sine", 0.25);
}

const COLOR_MAP: Record<string, string> = {
  red: "gradient-red",
  blue: "gradient-blue",
  green: "gradient-green",
  yellow: "gradient-yellow",
  purple: "gradient-purple",
};

export default function FlashcardsPage() {
  const router = useRouter();
  const { profiles, activeProfileId, progress, updateProgress } = useAppStore();
  const profile = profiles.find((p) => p.id === activeProfileId) ?? null;

  const [letterIdx, setLetterIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [dir, setDir] = useState<1 | -1>(1);

  if (!profile) {
    router.navigate({ to: "/" });
    return null;
  }

  const letter = PHONICS_DATA[letterIdx];
  const word = letter.words[wordIdx];
  const seenCount = Object.keys(progress?.flashcards ?? {}).length;

  const markSeen = () => {
    updateProgress((prev) => {
      const existing = prev.flashcards[letter.letter] ?? {
        letterId: letter.letter,
        wordsSeen: [],
        completed: false,
        lastVisited: 0,
      };
      const wordsSeen = Array.from(new Set([...existing.wordsSeen, word.word]));
      const updated = {
        ...existing,
        wordsSeen,
        completed: wordsSeen.length >= 5,
        lastVisited: Date.now(),
      };
      return {
        ...prev,
        flashcards: { ...prev.flashcards, [letter.letter]: updated },
        totalStars: Math.max(
          prev.totalStars,
          Object.values({
            ...prev.flashcards,
            [letter.letter]: updated,
          }).filter((f) => f.completed).length,
        ),
      };
    });
  };

  const handleFlip = () => {
    setFlipped((v) => !v);
    if (!flipped) {
      playSuccessSound();
      markSeen();
    }
  };

  const handleSound = () => {
    playLetterSound(letter.letter);
    speakLetter(letter.letter);
    setTimeout(() => speakWord(word.word), 700);
    markSeen();
  };

  const goNext = () => {
    playTapSound();
    setDir(1);
    setLetterIdx((i) => (i + 1) % PHONICS_DATA.length);
    setWordIdx(0);
    setFlipped(false);
  };

  const goPrev = () => {
    playTapSound();
    setDir(-1);
    setLetterIdx((i) => (i - 1 + PHONICS_DATA.length) % PHONICS_DATA.length);
    setWordIdx(0);
    setFlipped(false);
  };

  const isCompleted = progress?.flashcards[letter.letter]?.completed ?? false;

  return (
    <Layout title="Flashcards" headerColor="oklch(0.55 0.28 15)">
      <div className="px-5 py-5 flex flex-col gap-4">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-body text-muted-foreground">
            Letter {letterIdx + 1} / {PHONICS_DATA.length}
          </span>
          <span className="text-sm font-display font-bold text-accent">
            {seenCount} learned ⭐
          </span>
        </div>
        <ProgressBar value={(seenCount / 26) * 100} color="red" />

        {/* Letter row tabs */}
        <div
          className="flex gap-1.5 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {PHONICS_DATA.map((l, i) => {
            const done = progress?.flashcards[l.letter]?.completed;
            return (
              <button
                key={l.letter}
                type="button"
                data-ocid={`flashcards.letter_tab.${i + 1}`}
                onClick={() => {
                  playTapSound();
                  setLetterIdx(i);
                  setWordIdx(0);
                  setFlipped(false);
                }}
                className={`flex-shrink-0 w-9 h-9 rounded-xl text-sm font-display font-black transition-smooth active:scale-95 ${
                  i === letterIdx
                    ? "gradient-red text-card shadow-playful"
                    : done
                      ? "bg-accent/20 text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {l.letter}
              </button>
            );
          })}
        </div>

        {/* Main Card */}
        <AnimatePresence mode="wait">
          <motion.button
            key={`${letterIdx}-${flipped}`}
            type="button"
            data-ocid="flashcards.card"
            onClick={handleFlip}
            className={`letter-card w-full min-h-[220px] flex flex-col items-center justify-center cursor-pointer ${COLOR_MAP[letter.color]} text-card relative`}
            initial={{ x: dir * 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -dir * 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {isCompleted && (
              <span className="absolute top-3 right-3 text-xl">✅</span>
            )}
            {!flipped ? (
              <>
                <span className="text-[100px] font-display font-black leading-none">
                  {letter.uppercase}
                </span>
                <span className="text-4xl font-display font-bold opacity-70">
                  {letter.lowercase}
                </span>
                <span className="text-sm opacity-70 mt-2 font-body">
                  /{letter.phonicSound}/ tap to flip!
                </span>
              </>
            ) : (
              <>
                <span className="text-6xl mb-2">{word.emoji}</span>
                <span className="text-3xl font-display font-black">
                  {word.word}
                </span>
                <span className="text-sm opacity-80 mt-1 font-body">
                  {letter.letter.toLowerCase()} as in {word.word.toLowerCase()}
                </span>
              </>
            )}
          </motion.button>
        </AnimatePresence>

        {/* Sound Button */}
        <button
          type="button"
          data-ocid="flashcards.sound_button"
          onClick={handleSound}
          className="flex items-center justify-center gap-3 w-full py-4 gradient-red text-card rounded-3xl shadow-playful active:scale-95 transition-smooth font-display font-bold text-lg"
        >
          <Volume2 className="w-6 h-6" />
          Hear the Sound!
        </button>

        {/* Word Tabs */}
        <div
          className="flex flex-wrap gap-2"
          data-ocid="flashcards.word_selector"
        >
          {letter.words.map((w, i) => (
            <button
              key={w.word}
              type="button"
              data-ocid={`flashcards.word_button.${i + 1}`}
              onClick={() => {
                playTapSound();
                setWordIdx(i);
                setFlipped(true);
                speakWord(w.word);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-display font-bold transition-smooth active:scale-95 ${
                wordIdx === i && flipped
                  ? `${COLOR_MAP[letter.color]} text-card shadow-playful`
                  : "bg-muted text-foreground"
              }`}
            >
              <span>{w.emoji}</span>
              <span>{w.word}</span>
            </button>
          ))}
        </div>

        {/* Nav */}
        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            data-ocid="flashcards.prev_button"
            onClick={goPrev}
            className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center active:scale-95 transition-smooth"
            aria-label="Previous"
          >
            <ChevronLeft className="w-7 h-7 text-foreground" />
          </button>
          <div className="flex-1 text-center">
            <p className="text-xs font-body text-muted-foreground">
              swipe letters above
            </p>
          </div>
          <button
            type="button"
            data-ocid="flashcards.next_button"
            onClick={goNext}
            className="w-14 h-14 rounded-2xl gradient-red flex items-center justify-center active:scale-95 transition-smooth shadow-playful"
            aria-label="Next"
          >
            <ChevronRight className="w-7 h-7 text-card" />
          </button>
        </div>
      </div>
    </Layout>
  );
}
