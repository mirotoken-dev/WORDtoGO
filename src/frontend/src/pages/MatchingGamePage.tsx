import { useRouter } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { QuizLevel } from "../types";
import {
  playCelebrationSound,
  playCorrectSound,
  playLetterPhonetic,
  playTapSound,
  playWrongSound,
  speakWord,
} from "../utils/audio";
import { generatePairs, shuffleArray } from "../utils/quizUtils";

interface MatchingGamePageProps {
  level: QuizLevel;
  title: string;
  headerClass: string;
}

interface PairState {
  id: string;
  left: string;
  right: string;
  matched: boolean;
  firstAttemptCorrect: boolean;
}

const LEVEL_COLORS: Record<QuizLevel, string> = {
  1: "gradient-blue",
  2: "gradient-green",
  3: "gradient-purple",
};

const LEVEL_LABELS: Record<QuizLevel, string> = {
  1: "Level 1 · Letters",
  2: "Level 2 · Words",
  3: "Level 3 · Pictures",
};

const ENCOURAGING: string[] = [
  "Keep going, you can do it! 💪",
  "Practice makes perfect! 🌟",
  "Try again — you're learning! 🎯",
  "Almost there! Keep trying! 🌈",
];

export default function MatchingGamePage({
  level,
  title,
  headerClass,
}: MatchingGamePageProps) {
  const router = useRouter();
  const [pairs, setPairs] = useState<PairState[]>([]);
  const [leftItems, setLeftItems] = useState<string[]>([]);
  const [rightItems, setRightItems] = useState<string[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [wrongFlashLeft, setWrongFlashLeft] = useState<string | null>(null);
  const [wrongFlashRight, setWrongFlashRight] = useState<string | null>(null);
  const [phase, setPhase] = useState<"playing" | "results">("playing");
  const [score, setScore] = useState(0);
  const [celebrateScore, setCelebrateScore] = useState(false);
  const isAnimating = useRef(false);

  const startRound = useCallback(() => {
    const raw = generatePairs(level);
    const states: PairState[] = raw.map((p) => ({
      id: p.id,
      left: p.left,
      right: p.right,
      matched: false,
      firstAttemptCorrect: true,
    }));
    setPairs(states);
    setLeftItems(shuffleArray(raw.map((p) => p.left)));
    setRightItems(shuffleArray(raw.map((p) => p.right)));
    setSelectedLeft(null);
    setWrongFlashLeft(null);
    setWrongFlashRight(null);
    setPhase("playing");
    setScore(0);
    setCelebrateScore(false);
    isAnimating.current = false;
  }, [level]);

  useEffect(() => {
    startRound();
  }, [startRound]);

  const matchedLeftSet = new Set(
    pairs.filter((p) => p.matched).map((p) => p.left),
  );
  const matchedRightSet = new Set(
    pairs.filter((p) => p.matched).map((p) => p.right),
  );

  const handleLeftTap = (leftVal: string) => {
    if (isAnimating.current) return;
    if (matchedLeftSet.has(leftVal)) return;
    playTapSound();
    setSelectedLeft((prev) => (prev === leftVal ? null : leftVal));
  };

  const handleRightTap = (rightVal: string) => {
    if (isAnimating.current) return;
    if (matchedRightSet.has(rightVal)) return;
    if (!selectedLeft) {
      playTapSound();
      return;
    }
    playTapSound();

    if (level === 1) {
      void playLetterPhonetic(rightVal);
    } else {
      speakWord(rightVal);
    }

    const pair = pairs.find((p) => p.left === selectedLeft);
    if (!pair) return;

    if (pair.right === rightVal) {
      playCorrectSound();
      const updatedPairs = pairs.map((p) =>
        p.left === selectedLeft ? { ...p, matched: true } : p,
      );
      setPairs(updatedPairs);
      setSelectedLeft(null);

      const newMatchedCount = updatedPairs.filter((p) => p.matched).length;
      if (newMatchedCount === updatedPairs.length) {
        const finalScore = updatedPairs.filter(
          (p) => p.firstAttemptCorrect,
        ).length;
        setTimeout(() => {
          setScore(finalScore);
          setCelebrateScore(finalScore >= 4);
          if (finalScore >= 4) playCelebrationSound();
          setPhase("results");
        }, 600);
      }
    } else {
      isAnimating.current = true;
      playWrongSound();
      setPairs((prev) =>
        prev.map((p) =>
          p.left === selectedLeft ? { ...p, firstAttemptCorrect: false } : p,
        ),
      );
      setWrongFlashLeft(selectedLeft);
      setWrongFlashRight(rightVal);
      setTimeout(() => {
        setWrongFlashLeft(null);
        setWrongFlashRight(null);
        setSelectedLeft(null);
        isAnimating.current = false;
      }, 600);
    }
  };

  const handlePlayAgain = () => {
    playTapSound();
    startRound();
  };

  const handleBackToMenu = () => {
    playTapSound();
    router.navigate({ to: "/matching" });
  };

  const isLevel3 = level === 3;
  const matchedCount = pairs.filter((p) => p.matched).length;

  if (phase === "results") {
    return (
      <ResultsScreen
        score={score}
        celebrate={celebrateScore}
        levelLabel={LEVEL_LABELS[level]}
        headerClass={headerClass}
        colorClass={LEVEL_COLORS[level]}
        title={title}
        onPlayAgain={handlePlayAgain}
        onBack={handleBackToMenu}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header
        className={`sticky top-0 z-40 flex items-center justify-between px-4 py-3 ${headerClass}`}
        style={{
          boxShadow:
            "0 4px 16px oklch(0 0 0 / 0.5), 0 0 0 1px oklch(0.82 0.17 84 / 0.15) inset",
        }}
        data-ocid="matching_game.header"
      >
        <button
          type="button"
          onClick={handleBackToMenu}
          className="w-11 h-11 rounded-full bg-card/80 border border-[oklch(0.82_0.17_84/0.2)] flex items-center justify-center shadow-xs btn-tap transition-smooth hover:bg-card"
          aria-label="Back to matching menu"
          data-ocid="matching_game.back_button"
        >
          <span className="text-xl text-foreground">←</span>
        </button>
        <div className="text-center flex-1 px-2">
          <h1 className="font-display font-black text-lg text-foreground leading-tight">
            {title}
          </h1>
          <p className="text-xs font-body text-foreground/70">
            {LEVEL_LABELS[level]}
          </p>
        </div>
        <div
          className="w-11 h-11 rounded-full bg-card/90 border border-[oklch(0.82_0.17_84/0.3)] flex items-center justify-center shadow-xs"
          data-ocid="matching_game.score_badge"
        >
          <span
            className="font-display font-black text-sm"
            style={{ color: "oklch(0.88 0.17 84)" }}
          >
            {matchedCount}/5
          </span>
        </div>
      </header>

      {/* Game hint */}
      <div className="px-5 pt-4 pb-2 text-center">
        <p className="text-sm font-body text-muted-foreground">
          {selectedLeft
            ? "Now tap the matching item on the right 👉"
            : "Tap an item on the left to start 👈"}
        </p>
      </div>

      {/* Game area — two columns */}
      <div
        className="flex-1 px-4 pb-6 flex gap-3 items-start"
        data-ocid="matching_game.board"
      >
        {/* Left column */}
        <div
          className="flex-1 flex flex-col gap-3"
          data-ocid="matching_game.left_column"
        >
          {leftItems.map((val) => {
            const matched = matchedLeftSet.has(val);
            const selected = selectedLeft === val;
            const wrongFlash = wrongFlashLeft === val;
            const leftPos = leftItems.indexOf(val) + 1;
            return (
              <motion.button
                key={`left-${val}`}
                type="button"
                data-ocid={`matching_game.left_item.${leftPos}`}
                onClick={() => handleLeftTap(val)}
                disabled={matched}
                className={[
                  "rounded-2xl p-3 min-h-[64px] flex items-center justify-center font-display font-black transition-smooth btn-tap border-2",
                  isLevel3 ? "text-4xl" : "text-3xl",
                  matched
                    ? "bg-[oklch(0.72_0.27_131/0.2)] text-[oklch(0.72_0.27_131)] border-[oklch(0.72_0.27_131/0.4)] opacity-70 cursor-default"
                    : wrongFlash
                      ? "bg-destructive/20 text-destructive border-destructive/60 scale-95"
                      : selected
                        ? "bg-[oklch(0.82_0.17_84/0.15)] text-foreground border-[oklch(0.82_0.17_84/0.7)] scale-105 ring-2 ring-[oklch(0.82_0.17_84/0.3)]"
                        : "bg-card text-foreground border-border hover:border-[oklch(0.82_0.17_84/0.4)]",
                ].join(" ")}
                style={{
                  boxShadow: selected
                    ? "0 0 16px oklch(0.82 0.17 84 / 0.3)"
                    : matched
                      ? "0 0 12px oklch(0.72 0.27 131 / 0.2)"
                      : "0 2px 8px oklch(0 0 0 / 0.3)",
                }}
                animate={wrongFlash ? { x: [-4, 4, -4, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.3 }}
                whileTap={matched ? {} : { scale: 0.95 }}
              >
                {matched ? (
                  <span className="flex items-center gap-1">
                    <span>{val}</span>
                    <span className="text-lg">✓</span>
                  </span>
                ) : (
                  val
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="flex flex-col items-center justify-center self-stretch gap-1 py-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-1 h-8 rounded-full opacity-30"
              style={{ background: "oklch(0.82 0.17 84)" }}
            />
          ))}
        </div>

        {/* Right column */}
        <div
          className="flex-1 flex flex-col gap-3"
          data-ocid="matching_game.right_column"
        >
          {rightItems.map((val) => {
            const matched = matchedRightSet.has(val);
            const wrongFlash = wrongFlashRight === val;
            const rightPos = rightItems.indexOf(val) + 1;
            return (
              <motion.button
                key={`right-${val}`}
                type="button"
                data-ocid={`matching_game.right_item.${rightPos}`}
                onClick={() => handleRightTap(val)}
                disabled={matched}
                className={[
                  "rounded-2xl p-3 min-h-[64px] flex items-center justify-center font-display font-black transition-smooth btn-tap text-base border-2",
                  matched
                    ? "bg-[oklch(0.72_0.27_131/0.2)] text-[oklch(0.72_0.27_131)] border-[oklch(0.72_0.27_131/0.4)] opacity-70 cursor-default"
                    : wrongFlash
                      ? "bg-destructive/20 text-destructive border-destructive/60 scale-95"
                      : selectedLeft
                        ? "bg-card text-foreground border-[oklch(0.68_0.24_264/0.5)] hover:bg-[oklch(0.68_0.24_264/0.1)]"
                        : "bg-card text-foreground border-border hover:border-[oklch(0.82_0.17_84/0.4)]",
                ].join(" ")}
                style={{
                  boxShadow: matched
                    ? "0 0 12px oklch(0.72 0.27 131 / 0.2)"
                    : "0 2px 8px oklch(0 0 0 / 0.3)",
                }}
                animate={wrongFlash ? { x: [-4, 4, -4, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.3 }}
                whileTap={matched ? {} : { scale: 0.95 }}
              >
                {matched ? (
                  <span className="flex items-center gap-1">
                    <span>{val}</span>
                    <span className="text-lg">✓</span>
                  </span>
                ) : (
                  val
                )}
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

// ─── Results Screen ────────────────────────────────────────────────────────────

interface ResultsScreenProps {
  score: number;
  celebrate: boolean;
  levelLabel: string;
  headerClass: string;
  colorClass: string;
  title: string;
  onPlayAgain: () => void;
  onBack: () => void;
}

function ResultsScreen({
  score,
  celebrate,
  levelLabel,
  headerClass,
  colorClass,
  title,
  onPlayAgain,
  onBack,
}: ResultsScreenProps) {
  const encouragement = celebrate
    ? "Amazing! You're a star! 🌟"
    : ENCOURAGING[Math.floor(Math.random() * ENCOURAGING.length)];

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      data-ocid="matching_game.results_screen"
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-40 flex items-center justify-between px-4 py-3 ${headerClass}`}
        style={{
          boxShadow:
            "0 4px 16px oklch(0 0 0 / 0.5), 0 0 0 1px oklch(0.82 0.17 84 / 0.15) inset",
        }}
        data-ocid="matching_game.results_header"
      >
        <div className="w-11" />
        <h1 className="font-display font-black text-lg text-foreground">
          {title}
        </h1>
        <div className="w-11" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-6">
        {/* Celebration or trophy display */}
        <AnimatePresence mode="wait">
          {celebrate ? (
            <motion.div
              key="celebrate"
              className="text-center"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
            >
              <div className="relative flex justify-center mb-4 h-20">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.span
                    key={i}
                    className="text-3xl absolute"
                    initial={{ y: 0, opacity: 0, x: (i - 2) * 28 }}
                    animate={{ y: [-10, -45, -25], opacity: [0, 1, 0] }}
                    transition={{
                      delay: i * 0.15,
                      duration: 1.2,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatDelay: 0.8,
                    }}
                  >
                    ⭐
                  </motion.span>
                ))}
                <span className="text-6xl mt-4">🎉</span>
              </div>
              <h2
                className="font-display font-black text-3xl mt-2"
                style={{
                  background:
                    "linear-gradient(to right, oklch(0.95 0.18 84), oklch(0.82 0.17 84))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Amazing!
              </h2>
            </motion.div>
          ) : (
            <motion.div
              key="trophy"
              className="text-6xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 180 }}
            >
              🎯
            </motion.div>
          )}
        </AnimatePresence>

        {/* Score stars */}
        <motion.div
          className="flex gap-2 justify-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          data-ocid="matching_game.score_stars"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.span
              key={i}
              className="text-3xl"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.4 + i * 0.1,
                type: "spring",
                stiffness: 300,
              }}
            >
              {i < score ? "⭐" : "☆"}
            </motion.span>
          ))}
        </motion.div>

        {/* Score text */}
        <motion.div
          className="text-center"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="font-display font-black text-4xl text-foreground">
            {score} <span className="text-muted-foreground">/ 5</span>
          </p>
          <p className="text-base font-body text-muted-foreground mt-1">
            {levelLabel}
          </p>
          <p className="text-sm font-body text-foreground/80 mt-3 max-w-[240px] mx-auto">
            {encouragement}
          </p>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex flex-col gap-3 w-full max-w-xs"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <button
            type="button"
            onClick={onPlayAgain}
            className={`${colorClass} rounded-2xl py-4 px-6 font-display font-black text-lg text-card btn-tap transition-smooth`}
            style={{
              boxShadow:
                "0 4px 20px oklch(0 0 0 / 0.4), 0 0 0 1px oklch(1 0 0 / 0.1) inset",
            }}
            data-ocid="matching_game.play_again_button"
          >
            🔄 Play Again
          </button>
          <button
            type="button"
            onClick={onBack}
            className="rounded-2xl py-4 px-6 font-display font-black text-base text-foreground bg-muted border border-border shadow-xs btn-tap transition-smooth hover:bg-card hover:border-[oklch(0.82_0.17_84/0.4)]"
            data-ocid="matching_game.back_to_menu_button"
          >
            ← Back to Quiz Menu
          </button>
        </motion.div>
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
