import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Shuffle, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import CelebrationBurst from "../components/CelebrationBurst";
import ProgressBar from "../components/ProgressBar";
import StarBadge from "../components/StarBadge";
import WordIcon from "../components/WordIcon";
import { PHONICS_DATA } from "../data/phonicsData";
import { getUILabel } from "../data/arabicTranslations";
import { useAppStore } from "../store/useAppStore";
import {
  playCelebrationSound,
  playCorrectSound,
  playTapSound,
  playWrongSound,
  speakWord,
} from "../utils/audio";

type Status = "idle" | "correct" | "wrong";

interface MissingLetterTask {
  id: string;
  word: string;
  emoji: string;
  displayWord: string;
  missingIndex: number;
  correctLetter: string;
  options: string[];
  letterId: string;
}

function generateTask(letterIdx: number): MissingLetterTask {
  const letter = PHONICS_DATA[letterIdx];
  const task = letter.blendingTasks[Math.floor(Math.random() * letter.blendingTasks.length)];
  const word = task.word.toLowerCase();

  // Pick a random position to blank out (not first letter to keep it recognizable)
  const minIndex = 1;
  const maxIndex = word.length - 1;
  const missingIndex = Math.floor(Math.random() * (maxIndex - minIndex + 1)) + minIndex;
  const correctLetter = word[missingIndex];

  // Generate 2 wrong options from other letters in the word or random letters
  const wordLetters = word.split("").filter((_, i) => i !== missingIndex);
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("").filter((l) => l !== correctLetter);
  const distractors: string[] = [];

  // Try to pick one distractor from the same word (different position)
  const otherLetters = wordLetters.filter((l) => l !== correctLetter);
  if (otherLetters.length > 0) {
    distractors.push(otherLetters[Math.floor(Math.random() * otherLetters.length)]);
  }

  // Fill remaining with random letters
  while (distractors.length < 2) {
    const random = alphabet[Math.floor(Math.random() * alphabet.length)];
    if (!distractors.includes(random) && random !== correctLetter) {
      distractors.push(random);
    }
  }

  const options = shuffleArray([correctLetter, ...distractors]);

  const displayArr = word.split("");
  displayArr[missingIndex] = "_";

  return {
    id: task.id,
    word: task.word,
    emoji: task.emoji,
    displayWord: displayArr.join(""),
    missingIndex,
    correctLetter,
    options,
    letterId: letter.letter,
  };
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickRandomLetter(exclude?: number): number {
  const idx = Math.floor(Math.random() * PHONICS_DATA.length);
  if (exclude !== undefined && idx === exclude && PHONICS_DATA.length > 1) {
    return pickRandomLetter(exclude);
  }
  return idx;
}

export default function MissingLetterPage() {
  const router = useRouter();
  const { profiles, activeProfileId, progress, updateProgress } = useAppStore();
  const profile = profiles.find((p) => p.id === activeProfileId) ?? null;

  const [letterIdx, setLetterIdx] = useState(() => pickRandomLetter());
  const [task, setTask] = useState<MissingLetterTask>(() => generateTask(letterIdx));
  const [status, setStatus] = useState<Status>("idle");
  const [showCelebration, setShowCelebration] = useState(false);
  const [streak, setStreak] = useState(0);

  const completedCount = Object.values(progress?.missingLetter ?? {}).filter(
    (m) => m.tasksCompleted.length > 0,
  ).length;

  const letter = PHONICS_DATA[letterIdx];
  const isCompleted = (progress?.missingLetter[task.id]?.tasksCompleted.length ?? 0) > 0;

  const nextTask = useCallback(() => {
    const nextLetter = pickRandomLetter(letterIdx);
    setLetterIdx(nextLetter);
    setTask(generateTask(nextLetter));
    setStatus("idle");
  }, [letterIdx]);

  const handleOption = (option: string) => {
    if (status !== "idle") return;
    playTapSound();

    if (option === task.correctLetter) {
      playCorrectSound();
      setStatus("correct");
      setStreak((s) => s + 1);

      updateProgress((prev) => {
        const existing = prev.missingLetter[task.id] ?? {
          tasksCompleted: [],
          score: 0,
          completed: false,
          lastVisited: 0,
        };
        const updated = {
          ...existing,
          tasksCompleted: Array.from(new Set([...existing.tasksCompleted, task.id])),
          score: existing.score + 1,
          completed: true,
          lastVisited: Date.now(),
        };
        const totalDone = Object.values({ ...prev.missingLetter, [task.id]: updated }).filter(
          (m) => m.tasksCompleted.length > 0,
        ).length;
        return {
          ...prev,
          missingLetter: { ...prev.missingLetter, [task.id]: updated },
          totalStars: Math.max(prev.totalStars, totalDone),
        };
      });

      // Celebration on streak of 3 or completing a new task
      if (streak >= 2 || !isCompleted) {
        playCelebrationSound();
        setShowCelebration(true);
      }

      speakWord(task.word);

      setTimeout(() => {
        nextTask();
        setShowCelebration(false);
      }, 1500);
    } else {
      playWrongSound();
      setStatus("wrong");
      setStreak(0);
      setTimeout(() => setStatus("idle"), 1000);
    }
  };

  const handleShuffle = () => {
    playTapSound();
    nextTask();
  };

  const changeLetter = (idx: number) => {
    playTapSound();
    setLetterIdx(idx);
    setTask(generateTask(idx));
    setStatus("idle");
    setStreak(0);
  };

  if (!profile) {
    router.navigate({ to: "/" });
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CelebrationBurst active={showCelebration} intensity="medium" />

      {/* Header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 text-white"
        style={{
          background: "linear-gradient(135deg, oklch(0.67 0.21 222) 0%, oklch(0.52 0.20 222) 100%)",
        }}
      >
        <button
          type="button"
          onClick={() => { playTapSound(); router.navigate({ to: "/games" }); }}
          className="w-11 h-11 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center shadow-xs active:scale-95 transition-smooth hover:bg-white/30"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-center flex-1 px-2">
          <h1 className="font-display font-black text-lg text-white leading-tight">
            Missing Letter
          </h1>
          <p className="text-xs font-body text-white/70">
            Fill in the blank!
          </p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center shadow-xs">
          <StarBadge count={completedCount} size="sm" />
        </div>
      </header>

      <div className="px-5 py-5 flex flex-col gap-4">
        {/* Progress */}
        <ProgressBar
          value={(completedCount / (PHONICS_DATA.length * 3)) * 100}
          color="blue"
          showLabel
          label={`${completedCount} solved`}
        />

        {/* Letter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {PHONICS_DATA.map((l, i) => {
            const done = l.blendingTasks.filter(
              (t) => (progress?.missingLetter[t.id]?.tasksCompleted.length ?? 0) > 0,
            ).length;
            return (
              <button
                key={l.letter}
                type="button"
                onClick={() => changeLetter(i)}
                className={`flex-shrink-0 w-9 h-9 rounded-xl text-sm font-display font-black transition-smooth active:scale-95 relative border ${
                  i === letterIdx
                    ? "gradient-blue text-white border-transparent shadow-playful"
                    : done > 0
                      ? "bg-[oklch(0.94_0.06_145)] text-[oklch(0.48_0.22_145)] border-[oklch(0.85_0.10_145)]"
                      : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {l.letter}
                {done > 0 && done < l.blendingTasks.length && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-bold text-white bg-[oklch(0.62_0.22_145)]">
                    {done}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Streak indicator */}
        {streak > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center gap-1.5 text-sm font-display font-bold text-amber-600"
          >
            <span>🔥</span>
            <span>Streak: {streak}</span>
          </motion.div>
        )}

        {/* Word card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={task.id}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`letter-card flex items-center gap-4 ${
              letter.color === "red" ? "gradient-red"
              : letter.color === "blue" ? "gradient-blue"
              : letter.color === "green" ? "gradient-green"
              : letter.color === "yellow" ? "gradient-yellow"
              : "gradient-purple"
            } text-white`}
            style={{ boxShadow: "0 4px 20px oklch(0 0 0 / 0.15)" }}
          >
            <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: "linear-gradient(135deg, oklch(1 0 0 / 0.10) 0%, transparent 55%)" }} />
            <WordIcon icon={task.emoji} word={task.word} className="text-6xl relative z-10" imageClassName="w-20 h-20" />
            <div className="relative z-10">
              <p className="text-xs font-body opacity-80">What&apos;s the missing letter?</p>
              <p className="text-4xl font-display font-black tracking-widest">{task.displayWord}</p>
              {isCompleted && <span className="text-sm font-bold text-white/80">✅ Completed</span>}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Options */}
        <div className="flex justify-center gap-4 py-2">
          <AnimatePresence mode="wait">
            {task.options.map((option) => (
              <motion.button
                key={`${task.id}-${option}`}
                type="button"
                onClick={() => handleOption(option)}
                disabled={status !== "idle"}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  x: status === "wrong" && option !== task.correctLetter ? [0, -8, 8, -5, 5, 0] : 0,
                }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                whileTap={{ scale: 0.9, y: 4 }}
                className={`w-20 h-20 rounded-2xl font-display font-black text-3xl flex items-center justify-center transition-smooth border-2 ${
                  status === "correct" && option === task.correctLetter
                    ? "bg-[oklch(0.94_0.06_145)] text-[oklch(0.48_0.22_145)] border-[oklch(0.62_0.22_145)]"
                    : status === "wrong" && option !== task.correctLetter
                      ? "bg-[oklch(0.98_0.03_25)] text-destructive border-destructive"
                      : "bg-white text-foreground border-border hover:border-[oklch(0.67_0.21_222)]"
                }`}
                style={{
                  boxShadow: status === "correct" && option === task.correctLetter
                    ? "0 4px 0 0 oklch(0.62 0.22 145 / 0.35)"
                    : status === "wrong" && option !== task.correctLetter
                      ? "0 4px 0 0 oklch(0.60 0.24 25 / 0.35)"
                      : "0 4px 0 0 oklch(0.88 0.012 260)",
                }}
              >
                {option.toUpperCase()}
                {status === "correct" && option === task.correctLetter && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2"
                  >
                    <CheckCircle2 className="w-6 h-6 text-[oklch(0.62_0.22_145)]" />
                  </motion.span>
                )}
                {status === "wrong" && option !== task.correctLetter && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2"
                  >
                    <XCircle className="w-6 h-6 text-destructive" />
                  </motion.span>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Hint */}
        <p className="text-center text-sm text-muted-foreground font-body">
          Tap the letter that fills the blank!
        </p>

        {/* Shuffle */}
        <button
          type="button"
          onClick={handleShuffle}
          className="flex-1 h-12 rounded-2xl gradient-indigo text-white font-display font-bold text-base active:scale-95 transition-smooth shadow-playful flex items-center justify-center gap-2"
        >
          <Shuffle className="w-5 h-5" />
          New Word
        </button>
      </div>
    </div>
  );
}
