import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, Bolt, Clock, RotateCcw, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CelebrationBurst from "../components/CelebrationBurst";
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

type GamePhase = "intro" | "playing" | "results";

interface Question {
  id: string;
  type: "word-picture" | "letter-sound" | "word-complete";
  prompt: string;
  emoji?: string;
  options: string[];
  correctIndex: number;
  letterColor: string;
}

const GAME_DURATION = 60;
const STREAK_BONUS = [1, 2, 3, 4, 5]; // bonus multiplier at each streak level

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateQuestion(): Question {
  const types = ["word-picture", "letter-sound", "word-complete"] as const;
  const type = types[Math.floor(Math.random() * types.length)];
  const letter = PHONICS_DATA[Math.floor(Math.random() * PHONICS_DATA.length)];
  const color = letter.color;

  if (type === "word-picture") {
    const word = letter.words[Math.floor(Math.random() * letter.words.length)];
    const distractors = PHONICS_DATA.filter((l) => l.letter !== letter.letter)
      .slice(0, 3)
      .map((l) => l.words[0].word);
    const options = shuffleArray([word.word, ...distractors]);
    return {
      id: Math.random().toString(36).slice(2),
      type,
      prompt: `What word is this?`,
      emoji: word.emoji,
      options,
      correctIndex: options.indexOf(word.word),
      letterColor: color,
    };
  }

  if (type === "letter-sound") {
    const options = shuffleArray([letter.letter, ...getRandomLetters(letter.letter, 3)]);
    return {
      id: Math.random().toString(36).slice(2),
      type,
      prompt: `What letter says \"${letter.phonicSound}\"?`,
      options,
      correctIndex: options.indexOf(letter.letter),
      letterColor: color,
    };
  }

  // word-complete: show emoji, ask for first letter
  const word = letter.words[Math.floor(Math.random() * letter.words.length)];
  const firstLetter = word.word[0].toUpperCase();
  const options = shuffleArray([firstLetter, ...getRandomLetters(firstLetter, 3)]);
  return {
    id: Math.random().toString(36).slice(2),
    type,
    prompt: `What letter does \"${word.word}\" start with?`,
    emoji: word.emoji,
    options,
    correctIndex: options.indexOf(firstLetter),
    letterColor: color,
  };
}

function getRandomLetters(exclude: string, count: number): string[] {
  const all = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").filter((l) => l !== exclude.toUpperCase());
  const shuffled = shuffleArray(all);
  return shuffled.slice(0, count);
}

function formatTime(seconds: number): string {
  return `${seconds.toString().padStart(2, "0")}`;
}

export default function SpeedChallengePage() {
  const router = useRouter();
  const { profiles, activeProfileId, progress, updateProgress } = useAppStore();
  const profile = profiles.find((p) => p.id === activeProfileId) ?? null;

  const [phase, setPhase] = useState<GamePhase>("intro");
  const [question, setQuestion] = useState<Question>(() => generateQuestion());
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [comboAnim, setComboAnim] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const streakBonus = useMemo(() => {
    if (streak >= 5) return 3;
    if (streak >= 3) return 2;
    return 1;
  }, [streak]);

  const startGame = () => {
    playTapSound();
    setPhase("playing");
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setStreak(0);
    setFeedback(null);
    setQuestion(generateQuestion());

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("results");

    const bestTime = progress?.speedChallenge?.bestTime ?? Infinity;
    const gamesPlayed = (progress?.speedChallenge?.gamesPlayed ?? 0) + 1;
    const bestStreak = progress?.speedChallenge?.bestStreak ?? 0;
    const highScore = progress?.speedChallenge?.highScore ?? 0;

    updateProgress((prev) => {
      const existing = prev.speedChallenge ?? {
        bestTime: Infinity,
        bestStreak: 0,
        gamesPlayed: 0,
        highScore: 0,
        completed: false,
        lastVisited: 0,
      };
      return {
        ...prev,
        speedChallenge: {
          ...existing,
          bestTime: Math.min(existing.bestTime, GAME_DURATION - timeLeft),
          bestStreak: Math.max(existing.bestStreak, streak),
          gamesPlayed,
          highScore: Math.max(existing.highScore, score),
          completed: true,
          lastVisited: Date.now(),
        },
      };
    });

    if (score >= 10) {
      playCelebrationSound();
      setShowCelebration(true);
    }
  }, [progress, score, streak, timeLeft, updateProgress]);

  const handleAnswer = (index: number) => {
    if (phase !== "playing" || feedback) return;
    playTapSound();

    if (index === question.correctIndex) {
      playCorrectSound();
      const points = 1 * streakBonus;
      setScore((s) => s + points);
      setCorrectCount((c) => c + 1);
      setStreak((s) => s + 1);
      setFeedback("correct");

      if (streak >= 2) {
        setComboAnim(true);
        setTimeout(() => setComboAnim(false), 800);
      }

      speakWord(question.options[index]);
    } else {
      playWrongSound();
      setWrongCount((w) => w + 1);
      setStreak(0);
      setFeedback("wrong");
    }

    setTimeout(() => {
      setFeedback(null);
      setQuestion(generateQuestion());
    }, feedback === "wrong" ? 1200 : 800);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!profile) {
    router.navigate({ to: "/" });
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CelebrationBurst active={showCelebration} intensity="high" />

      {/* Header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 text-white"
        style={{
          background: "linear-gradient(135deg, oklch(0.66 0.24 310) 0%, oklch(0.52 0.22 310) 100%)",
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
            Speed Challenge
          </h1>
          <p className="text-xs font-body text-white/70">
            Fast & Furious!
          </p>
        </div>
        <div className="w-11" />
      </header>

      {/* Intro screen */}
      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-6"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-center"
            >
              <div className="text-7xl mb-4">⚡</div>
              <h2 className="font-display font-black text-3xl text-foreground">
                Speed Challenge
              </h2>
              <p className="text-muted-foreground font-body mt-2 max-w-xs mx-auto">
                Answer as many questions as you can in {GAME_DURATION} seconds!
              </p>
            </motion.div>

            <div className="duo-card w-full max-w-xs px-6 py-5">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-[oklch(0.66_0.24_310)]" />
                <span className="font-body text-sm text-muted-foreground">
                  {GAME_DURATION} seconds on the clock
                </span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-5 h-5 text-[oklch(0.72_0.27_130)]" />
                <span className="font-body text-sm text-muted-foreground">
                  Build streaks for bonus points
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Bolt className="w-5 h-5 text-[oklch(0.67_0.21_222)]" />
                <span className="font-body text-sm text-muted-foreground">
                  Words, letters, and sounds
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={startGame}
              className="press-btn w-full max-w-xs h-16 text-xl text-white"
              style={{
                background: "linear-gradient(135deg, oklch(0.66 0.24 310) 0%, oklch(0.52 0.22 310) 100%)",
                boxShadow: "0 5px 0 0 oklch(0.46 0.20 310)",
              }}
            >
              Start Challenge! 🚀
            </button>
          </motion.div>
        )}

        {phase === "playing" && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Top bar */}
            <div
              className="px-5 py-3 flex items-center justify-between text-white"
              style={{
                background: timeLeft <= 10
                  ? "linear-gradient(135deg, oklch(0.58 0.24 25) 0%, oklch(0.44 0.20 25) 100%)"
                  : "linear-gradient(135deg, oklch(0.55 0.20 280) 0%, oklch(0.42 0.19 280) 100%)",
              }}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className={`font-display font-black text-lg ${timeLeft <= 10 ? "animate-pulse" : ""}`}>
                  {formatTime(timeLeft)}s
                </span>
              </div>
              <div className="flex items-center gap-3">
                {streak > 0 && (
                  <motion.span
                    key={streak}
                    animate={comboAnim ? { scale: [1, 1.4, 1] } : {}}
                    className="flex items-center gap-1 font-display font-bold text-sm"
                  >
                    🔥 x{streak}
                    {streakBonus > 1 && (
                      <span className="text-[oklch(0.72_0.27_130)]">+{streakBonus}x</span>
                    )}
                  </motion.span>
                )}
                <span className="font-display font-black text-lg">{score} pts</span>
              </div>
            </div>

            {/* Timer bar */}
            <div className="w-full h-2 bg-muted">
              <motion.div
                className="h-full"
                style={{
                  background: timeLeft <= 10
                    ? "oklch(0.58 0.24 25)"
                    : "linear-gradient(90deg, oklch(0.66 0.24 310), oklch(0.52 0.22 310))",
                  width: `${(timeLeft / GAME_DURATION) * 100}%`,
                }}
                layout
              />
            </div>

            {/* Question area */}
            <div className="flex-1 px-5 py-5 flex flex-col gap-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={question.id}
                  initial={{ x: feedback === "wrong" ? -20 : 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`letter-card text-white ${
                    question.letterColor === "red" ? "gradient-red"
                    : question.letterColor === "blue" ? "gradient-blue"
                    : question.letterColor === "green" ? "gradient-green"
                    : question.letterColor === "yellow" ? "gradient-yellow"
                    : "gradient-purple"
                  }`}
                >
                  <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: "linear-gradient(135deg, oklch(1 0 0 / 0.10) 0%, transparent 55%)" }} />
                  <div className="text-center relative z-10">
                    {question.emoji && (
                      <WordIcon icon={question.emoji} word={question.prompt} className="text-5xl mb-3 mx-auto" imageClassName="w-16 h-16" />
                    )}
                    <p className="text-xs font-body opacity-80 uppercase tracking-wider">
                      {question.type === "word-picture" ? "Name the word" : question.type === "letter-sound" ? "Find the letter" : "First letter"}
                    </p>
                    <p className="text-2xl font-display font-black mt-1 leading-tight">{question.prompt}</p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Options */}
              <div className="grid grid-cols-2 gap-3">
                <AnimatePresence mode="wait">
                  {question.options.map((option, idx) => (
                    <motion.button
                      key={`${question.id}-${idx}`}
                      type="button"
                      onClick={() => handleAnswer(idx)}
                      disabled={!!feedback}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileTap={{ scale: 0.94, y: 3 }}
                      className={`h-16 rounded-2xl font-display font-black text-xl flex items-center justify-center transition-smooth border-2 ${
                        feedback === "correct" && idx === question.correctIndex
                          ? "bg-[oklch(0.94_0.06_145)] text-[oklch(0.48_0.22_145)] border-[oklch(0.62_0.22_145)]"
                          : feedback === "wrong" && idx !== question.correctIndex
                            ? "bg-[oklch(0.98_0.03_25)] text-destructive border-destructive"
                            : "bg-white text-foreground border-border hover:border-[oklch(0.66_0.24_310)]"
                      }`}
                      style={{
                        boxShadow: feedback === "correct" && idx === question.correctIndex
                          ? "0 4px 0 0 oklch(0.62 0.22 145 / 0.35)"
                          : feedback === "wrong" && idx !== question.correctIndex
                            ? "0 4px 0 0 oklch(0.60 0.24 25 / 0.35)"
                            : "0 4px 0 0 oklch(0.88 0.012 260)",
                      }}
                    >
                      {option}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {phase === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-6"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
              className="text-center"
            >
              <div className="text-7xl mb-4">{score >= 15 ? "🏆" : score >= 8 ? "⭐" : "👍"}</div>
              <h2 className="font-display font-black text-4xl text-foreground">
                Time&apos;s Up!
              </h2>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="duo-card px-8 py-5 text-center w-full max-w-xs"
            >
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-3xl font-display font-black text-foreground">{score}</p>
                  <p className="text-[10px] text-muted-foreground font-body">Score</p>
                </div>
                <div>
                  <p className="text-3xl font-display font-black text-[oklch(0.62_0.22_145)]">{correctCount}</p>
                  <p className="text-[10px] text-muted-foreground font-body">Correct</p>
                </div>
                <div>
                  <p className="text-3xl font-display font-black text-[oklch(0.58_0.24_25)]">{wrongCount}</p>
                  <p className="text-[10px] text-muted-foreground font-body">Wrong</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3">
                <div>
                  <p className="text-lg font-display font-bold text-foreground">{progress?.speedChallenge?.bestStreak ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground font-body">Best Streak</p>
                </div>
                <div>
                  <p className="text-lg font-display font-bold text-foreground">{progress?.speedChallenge?.highScore ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground font-body">High Score</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col gap-3 w-full max-w-xs"
            >
              <button
                type="button"
                onClick={startGame}
                className="press-btn w-full h-14 text-lg text-white"
                style={{
                  background: "linear-gradient(135deg, oklch(0.66 0.24 310) 0%, oklch(0.52 0.22 310) 100%)",
                  boxShadow: "0 5px 0 0 oklch(0.46 0.20 310)",
                }}
              >
                🔄 Play Again
              </button>
              <button
                type="button"
                onClick={() => { playTapSound(); router.navigate({ to: "/games" }); }}
                className="press-btn press-outline w-full h-14 text-base"
              >
                ← Back to Games
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
