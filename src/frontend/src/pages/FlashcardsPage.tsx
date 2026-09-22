import { useRouter } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import WordIcon from "../components/WordIcon";
import { PHONICS_DATA } from "../data/phonicsData";
import { useAppStore } from "../store/useAppStore";
import { getUILabel } from "../data/arabicTranslations";
import { playLetterNameAsync, playSuccessSound, playTapSound, preloadWordAudio, speakWord } from "../utils/audio";

const WORD_CARD_COLORS = [
  "bg-[#ffe8ee]",
  "bg-[#e7f6df]",
  "bg-[#e4f3ff]",
  "bg-[#fff4d7]",
  "bg-[#eee8ff]",
];

export default function FlashcardsPage() {
  const router = useRouter();
  const { profiles, activeProfileId, progress, updateProgress } = useAppStore();
  const profile = profiles.find((p) => p.id === activeProfileId) ?? null;

  const [letterIdx, setLetterIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
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

  const handleSound = () => {
    markSeen();
    playSuccessSound();
    void playLetterNameAsync(letter.letter).then(() => {
      setTimeout(() => speakWord(word.word), 120);
    });
  };

  const goNext = () => { playTapSound(); setDir(1); setLetterIdx((i) => (i + 1) % PHONICS_DATA.length); setWordIdx(0); };
  const goPrev = () => { playTapSound(); setDir(-1); setLetterIdx((i) => (i - 1 + PHONICS_DATA.length) % PHONICS_DATA.length); setWordIdx(0); };

  const isCompleted = progress?.flashcards[letter.letter]?.completed ?? false;

  return (
    <Layout title={getUILabel("Flashcards")} headerColor="oklch(0.50 0.26 15)">
      <div className="min-h-full bg-[#fbfdff] px-4 pb-7 pt-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          {/* Letter tabs: uppercase only, like the reference design */}
          <div
            className="flex gap-2 overflow-x-auto px-1 pb-2"
            style={{ scrollbarWidth: "none" }}
            data-ocid="flashcards.letter_selector"
          >
          {PHONICS_DATA.map((l, i) => {
            const done = progress?.flashcards[l.letter]?.completed;
            return (
              <button
                key={l.letter}
                type="button"
                data-ocid={`flashcards.letter_tab.${i + 1}`}
                onClick={() => { playTapSound(); setLetterIdx(i); setWordIdx(0); }}
                className={`relative flex h-14 min-w-14 flex-shrink-0 items-center justify-center rounded-2xl border-2 text-xl font-display font-black transition-smooth active:scale-95 sm:h-16 sm:min-w-16 ${
                  i === letterIdx
                    ? "border-[#2d78e6] bg-[#2d78e6] text-white shadow-[0_5px_0_#b9d5f4]"
                    : done
                      ? "border-[#b9d9ef] bg-[#e7f6df] text-[#164074]"
                      : "border-[#cbdceb] bg-[#f0f6fc] text-[#15365e] shadow-[0_3px_0_#dce9f5]"
                }`}
              >
                {l.letter}
                {done && i !== letterIdx && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#69c653] text-[10px] text-white">✓</span>
                )}
              </button>
            );
          })}
          </div>

          {/* Featured letter card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${letterIdx}-${wordIdx}`}
              data-ocid="flashcards.card"
              className="rounded-[2rem] border-[5px] border-[#d9efff] bg-white px-4 py-5 shadow-[0_4px_0_#e4f3fc] sm:px-8 sm:py-7"
              initial={{ x: dir * 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -dir * 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="grid items-center gap-4 sm:grid-cols-[1.1fr_0.9fr] sm:gap-7">
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-end justify-center gap-2 leading-none">
                    <span className="font-display text-[7rem] font-black tracking-[-0.08em] text-[#ee2945] sm:text-[9rem]">
                      {letter.uppercase}
                    </span>
                    <span className="mb-3 font-display text-[5rem] font-black tracking-[-0.08em] text-[#ee2945] sm:mb-4 sm:text-[7rem]">
                      {letter.lowercase}
                    </span>
                  </div>
                  <span className="mt-1 text-3xl font-black tracking-wide text-[#37577d] sm:text-4xl">
                    /{letter.phonicSound}/
                  </span>
                  {isCompleted && <span className="mt-1 text-sm font-bold text-[#52ab45]">Letter learned ✓</span>}
                </div>

                <div className="flex min-h-40 flex-col items-center justify-center">
                  <WordIcon icon={word.emoji} word={word.word} className="text-[7rem] leading-none" imageClassName="h-36 w-36 object-contain sm:h-40 sm:w-40" />
                  <p className="mt-1 text-center text-2xl font-black text-[#15365e]">{word.word}</p>
                  {word.arabic && (
                    <p className="text-lg font-[var(--font-arabic)] text-[#53708f]" dir="rtl">
                      {word.arabic}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                data-ocid="flashcards.sound_button"
                onClick={handleSound}
                className="mx-auto mt-5 flex w-full max-w-xs items-center justify-center gap-3 rounded-full bg-[#2583ee] px-5 py-3.5 text-lg font-black text-white shadow-[0_5px_0_#1261bb] transition-smooth active:translate-y-1 active:shadow-none"
              >
                <Volume2 className="h-7 w-7" />
                Hear the Sound
              </button>
            </motion.div>
          </AnimatePresence>

          {/* Word cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4" data-ocid="flashcards.word_selector">
            {letter.words.map((w, i) => (
              <button
                key={w.word}
                type="button"
                data-ocid={`flashcards.word_button.${i + 1}`}
                onClick={() => { playTapSound(); setWordIdx(i); speakWord(w.word); }}
                className={`flex min-h-[92px] items-center gap-2 rounded-2xl px-3 py-3 text-left transition-smooth active:scale-[0.97] sm:min-h-[106px] sm:px-5 ${
                  WORD_CARD_COLORS[i % WORD_CARD_COLORS.length]
                } ${
                  wordIdx === i
                    ? "ring-4 ring-[#2583ee]/25 ring-offset-2"
                    : "hover:-translate-y-0.5"
                }`}
              >
                <WordIcon icon={w.emoji} word={w.word} className="shrink-0 text-5xl leading-none" imageClassName="h-14 w-14 object-contain sm:h-16 sm:w-16" />
                <span className="min-w-0">
                  <span className="block truncate text-base font-black text-[#15365e] sm:text-xl">{w.word}</span>
                  {w.arabic && (
                    <span className="block truncate text-sm font-[var(--font-arabic)] text-[#4c6682] sm:text-base" dir="rtl">
                      {w.arabic}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>

          {/* Letter navigation */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              data-ocid="flashcards.prev_button"
              onClick={goPrev}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#e5f2ff] text-[#15365e] transition-smooth active:scale-90 sm:h-16 sm:w-16"
              aria-label={getUILabel("Previous")}
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            <div className="flex items-center justify-center gap-2" aria-label={`Letter ${letterIdx + 1} of ${PHONICS_DATA.length}`}>
              {PHONICS_DATA.map((l, i) => (
                <span
                  key={l.letter}
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    i === letterIdx ? "w-4 bg-[#2583ee]" : "bg-[#d6e3ef]"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              data-ocid="flashcards.next_button"
              onClick={goNext}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#2583ee] text-white shadow-[0_5px_0_#1261bb] transition-smooth active:translate-y-1 active:shadow-none sm:h-16 sm:w-16"
              aria-label={getUILabel("Next")}
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
