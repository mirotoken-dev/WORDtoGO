import { useRouter } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import ProgressBar from "../components/ProgressBar";
import { PHONICS_DATA } from "../data/phonicsData";
import { useAppStore } from "../store/useAppStore";
import { getArabicWord, getUILabel } from "../data/arabicTranslations";
import { playLetterNameAsync, playSuccessSound, playTapSound, preloadWordAudio, speakWord } from "../utils/audio";

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

  const letter = PHONICS_DATA[letterIdx];
  const word = letter.words[wordIdx];

  // Preload word audio as soon as the word is shown — eliminates tap delay
  useEffect(() => {
    preloadWordAudio(word.word);
    // Also preload all words for this letter so tab switching is instant
    letter.words.forEach((w) => preloadWordAudio(w.word));
  }, [letterIdx, wordIdx]);

  if (!profile) { router.navigate({ to: "/" }); return null; }
  const seenCount = Object.keys(progress?.flashcards ?? {}).length;

  const markSeen = () => {
    updateProgress((prev) => {
      const existing = prev.flashcards[letter.letter] ?? { letterId: letter.letter, wordsSeen: [], completed: false, lastVisited: 0 };
      const wordsSeen = Array.from(new Set([...existing.wordsSeen, word.word]));
      const updated = { ...existing, wordsSeen, completed: wordsSeen.length >= 5, lastVisited: Date.now() };
      return {
        ...prev,
        flashcards: { ...prev.flashcards, [letter.letter]: updated },
        totalStars: Math.max(prev.totalStars, Object.values({ ...prev.flashcards, [letter.letter]: updated }).filter((f) => f.completed).length),
      };
    });
  };

  const handleFlip = () => {
    setFlipped((v) => !v);
    if (!flipped) { playSuccessSound(); markSeen(); }
  };

  const handleSound = () => {
    markSeen();
    void playLetterNameAsync(letter.letter).then(() => {
      setTimeout(() => speakWord(word.word), 120);
    });
  };

  const goNext = () => { playTapSound(); setDir(1); setLetterIdx((i) => (i + 1) % PHONICS_DATA.length); setWordIdx(0); setFlipped(false); };
  const goPrev = () => { playTapSound(); setDir(-1); setLetterIdx((i) => (i - 1 + PHONICS_DATA.length) % PHONICS_DATA.length); setWordIdx(0); setFlipped(false); };

  const isCompleted = progress?.flashcards[letter.letter]?.completed ?? false;

  return (
    <Layout title={getUILabel("Flashcards")} headerColor="oklch(0.50 0.26 15)">
      <div className="px-5 py-5 flex flex-col gap-4">

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-body text-muted-foreground">
            Letter {letterIdx + 1} / {PHONICS_DATA.length}
          </span>
          <span className="text-sm font-display font-bold text-[oklch(0.60_0.22_145)]">
            {seenCount} learned ⭐
          </span>
        </div>
        <ProgressBar value={(seenCount / 26) * 100} color="red" />

        {/* Letter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {PHONICS_DATA.map((l, i) => {
            const done = progress?.flashcards[l.letter]?.completed;
            return (
              <button
                key={l.letter}
                type="button"
                data-ocid={`flashcards.letter_tab.${i + 1}`}
                onClick={() => { playTapSound(); setLetterIdx(i); setWordIdx(0); setFlipped(false); }}
                className={`flex-shrink-0 w-9 h-9 rounded-xl text-sm font-display font-black transition-smooth active:scale-95 border ${
                  i === letterIdx
                    ? "gradient-red text-white border-transparent shadow-playful"
                    : done
                      ? "bg-[oklch(0.94_0.06_145)] text-[oklch(0.48_0.22_145)] border-[oklch(0.85_0.10_145)]"
                      : "bg-muted text-muted-foreground border-border"
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
            className={`letter-card w-full min-h-[220px] flex flex-col items-center justify-center cursor-pointer ${COLOR_MAP[letter.color]} text-white relative`}
            style={{ boxShadow: "0 8px 28px oklch(0 0 0 / 0.18)" }}
            initial={{ x: dir * 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -dir * 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: "linear-gradient(135deg, oklch(1 0 0 / 0.12) 0%, transparent 55%)" }} />
            {isCompleted && <span className="absolute top-3 right-3 text-xl">✅</span>}
            {!flipped ? (
              <>
                <span className="text-[100px] font-display font-black leading-none drop-shadow">{letter.uppercase}</span>
                <span className="text-4xl font-display font-bold opacity-75">{letter.lowercase}</span>
                <span className="text-sm opacity-70 mt-2 font-body">/{letter.phonicSound}/ {getUILabel("tap to flip!")}</span>
              </>
            ) : (
              <>
                <span className="text-6xl mb-2">{word.emoji}</span>
                <span className="text-3xl font-display font-black">{word.word}</span>
                {word.arabic && (
                  <span className="text-xl font-[var(--font-arabic)] mt-1" dir="rtl">
                    {word.arabic}
                  </span>
                )}
                <span className="text-sm opacity-80 mt-1 font-body">
                  {letter.letter.toLowerCase()} {getUILabel("as in")} {word.word.toLowerCase()}
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
          className="flex items-center justify-center gap-3 w-full py-4 gradient-red text-white rounded-2xl active:scale-95 transition-smooth font-display font-bold text-base shadow-playful"
        >
          <Volume2 className="w-5 h-5" />
          Hear the Sound!
        </button>

        {/* Word Tabs */}
        <div className="flex flex-wrap gap-2" data-ocid="flashcards.word_selector">
          {letter.words.map((w, i) => (
            <button
              key={w.word}
              type="button"
              data-ocid={`flashcards.word_button.${i + 1}`}
              onClick={() => { playTapSound(); setWordIdx(i); setFlipped(true); speakWord(w.word); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-display font-bold transition-smooth active:scale-95 ${
                wordIdx === i && flipped
                  ? `${COLOR_MAP[letter.color]} text-white shadow-playful`
                  : "bg-white text-foreground border border-border hover:bg-muted"
              }`}
            >
              <span>{w.emoji}</span>
              <span>{w.word}</span>
              {w.arabic && <span className="text-xs font-[var(--font-arabic)] ml-1 opacity-80" dir="rtl">{w.arabic}</span>}
            </button>
          ))}
        </div>

        {/* Nav */}
        <div className="flex items-center gap-3 mt-1">
          <button
            type="button"
            data-ocid="flashcards.prev_button"
            onClick={goPrev}
            className="w-13 h-13 w-12 h-12 rounded-2xl bg-white border border-border flex items-center justify-center active:scale-95 transition-smooth hover:bg-muted"
            aria-label={getUILabel("Previous")}
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <div className="flex-1 text-center">
            <p className="text-xs font-body text-muted-foreground">swipe letters above</p>
          </div>
          <button
            type="button"
            data-ocid="flashcards.next_button"
            onClick={goNext}
            className="w-12 h-12 rounded-2xl gradient-red flex items-center justify-center active:scale-95 transition-smooth shadow-playful"
            aria-label={getUILabel("Next")}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </Layout>
  );
}
