import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, Clock, RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
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

interface Card {
  id: string;
  content: string;
  pairId: string;
  type: "emoji" | "word";
  flipped: boolean;
  matched: boolean;
}

type GamePhase = "playing" | "results";

function generateCards(): Card[] {
  // Pick 6 random letters
  const shuffledLetters = [...PHONICS_DATA].sort(() => Math.random() - 0.5).slice(0, 6);

  const cards: Card[] = [];
  shuffledLetters.forEach((letter, idx) => {
    const word = letter.words[0];
    const pairId = `pair-${idx}`;
    cards.push(
      { id: `card-${idx}-a`, content: word.emoji, pairId, type: "emoji", flipped: false, matched: false },
      { id: `card-${idx}-b`, content: word.word.toLowerCase(), pairId, type: "word", flipped: false, matched: false },
    );
  });

  return cards.sort(() => Math.random() - 0.5);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MemoryMatchPage() {
  const router = useRouter();
  const { profiles, activeProfileId, progress, updateProgress } = useAppStore();
  const profile = profiles.find((p) => p.id === activeProfileId) ?? null;

  const [cards, setCards] = useState<Card[]>(() => generateCards());
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const matchedCount = cards.filter((c) => c.matched).length / 2;
  const totalPairs = cards.length / 2;
  const isComplete = matchedCount === totalPairs;

  // Timer
  useEffect(() => {
    if (phase !== "playing" || isComplete) return;
    const interval = setInterval(() => setTimeElapsed((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [phase, isComplete]);

  // Check completion
  useEffect(() => {
    if (isComplete && phase === "playing") {
      const bestTime = progress?.memoryMatch?.bestTime ?? Infinity;
      const gamesPlayed = (progress?.memoryMatch?.gamesPlayed ?? 0) + 1;
      const highScore = progress?.memoryMatch?.highScore ?? 0;
      const score = Math.max(0, 100 - moves * 2 - timeElapsed);

      updateProgress((prev) => {
        const existing = prev.memoryMatch ?? {
          bestTime: Infinity,
          gamesPlayed: 0,
          highScore: 0,
          completed: false,
          lastVisited: 0,
        };
        return {
          ...prev,
          memoryMatch: {
            ...existing,
            bestTime: Math.min(existing.bestTime, timeElapsed),
            gamesPlayed,
            highScore: Math.max(existing.highScore, score),
            completed: true,
            lastVisited: Date.now(),
          },
        };
      });

      setTimeout(() => {
        playCelebrationSound();
        setShowCelebration(true);
        setPhase("results");
      }, 600);
    }
  }, [isComplete, phase, moves, timeElapsed, progress, updateProgress]);

  const handleCardTap = useCallback(
    (cardId: string) => {
      if (isChecking) return;
      if (flippedCards.length >= 2) return;

      const card = cards.find((c) => c.id === cardId);
      if (!card || card.flipped || card.matched) return;

      playTapSound();

      const newFlipped = [...flippedCards, cardId];
      setFlippedCards(newFlipped);
      setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, flipped: true } : c)));

      if (newFlipped.length === 2) {
        setMoves((m) => m + 1);
        setIsChecking(true);

        const [firstId, secondId] = newFlipped;
        const first = cards.find((c) => c.id === firstId)!;
        const second = cards.find((c) => c.id === secondId)!;

        if (first.pairId === second.pairId) {
          // Match!
          setTimeout(() => {
            playCorrectSound();
            speakWord(first.type === "word" ? first.content : second.content);
            setCards((prev) =>
              prev.map((c) =>
                c.pairId === first.pairId ? { ...c, matched: true, flipped: false } : c,
              ),
            );
            setFlippedCards([]);
            setIsChecking(false);
          }, 600);
        } else {
          // No match
          setTimeout(() => {
            playWrongSound();
            setCards((prev) =>
              prev.map((c) =>
                c.id === firstId || c.id === secondId ? { ...c, flipped: false } : c,
              ),
            );
            setFlippedCards([]);
            setIsChecking(false);
          }, 1000);
        }
      }
    },
    [cards, flippedCards, isChecking],
  );

  const resetGame = () => {
    playTapSound();
    setCards(generateCards());
    setFlippedCards([]);
    setPhase("playing");
    setMoves(0);
    setTimeElapsed(0);
    setShowCelebration(false);
    setIsChecking(false);
  };

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
          background: "linear-gradient(135deg, oklch(0.72 0.27 130) 0%, oklch(0.56 0.25 130) 100%)",
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
            Memory Match
          </h1>
          <p className="text-xs font-body text-white/70">
            Find the pairs!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm font-display font-bold">
            <Clock className="w-4 h-4" />
            {formatTime(timeElapsed)}
          </div>
        </div>
      </header>

      {phase === "playing" && (
        <div className="flex-1 px-4 py-4">
          {/* Stats bar */}
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-sm font-body text-muted-foreground">
              Moves: <span className="font-display font-bold text-foreground">{moves}</span>
            </span>
            <span className="text-sm font-body text-muted-foreground">
              Pairs: <span className="font-display font-bold text-foreground">{matchedCount}/{totalPairs}</span>
            </span>
          </div>

          {/* Card grid */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
            {cards.map((card) => (
              <motion.button
                key={card.id}
                type="button"
                onClick={() => handleCardTap(card.id)}
                disabled={card.matched || card.flipped}
                whileTap={{ scale: 0.92 }}
                className={`relative aspect-square rounded-2xl flex items-center justify-center text-3xl font-display font-black transition-smooth border-2 ${
                  card.matched
                    ? "bg-[oklch(0.95_0.06_145)] border-[oklch(0.72_0.27_130/0.5)] cursor-default"
                    : card.flipped
                      ? "bg-white border-[oklch(0.72_0.27_130)]"
                      : "bg-gradient-to-br from-[oklch(0.55_0.22_280)] to-[oklch(0.42_0.20_280)] border-[oklch(0.48_0.21_280)] cursor-pointer"
                }`}
                style={{
                  boxShadow: card.matched
                    ? "0 3px 0 0 oklch(0.56 0.23 130)"
                    : card.flipped
                      ? "0 4px 0 0 oklch(0.88 0.012 260)"
                      : "0 4px 0 0 oklch(0.36 0.18 280)",
                }}
              >
                <AnimatePresence mode="wait">
                  {card.matched || card.flipped ? (
                    <motion.div
                      key="front"
                      initial={{ rotateY: 90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: 90, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-center justify-center"
                    >
                      {card.type === "emoji" ? (
                        <WordIcon icon={card.content} word={card.content} className="text-4xl" imageClassName="w-12 h-12" />
                      ) : (
                        <span className="text-lg text-foreground">{card.content}</span>
                      )}
                    </motion.div>
                  ) : (
                    <motion.span
                      key="back"
                      className="text-white text-2xl"
                      initial={{ rotateY: -90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: -90, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      ?
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Matched checkmark */}
                {card.matched && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[oklch(0.62_0.22_145)] flex items-center justify-center"
                  >
                    <span className="text-white text-xs">✓</span>
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>

          {/* Reset */}
          <button
            type="button"
            onClick={resetGame}
            className="mt-6 mx-auto flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-muted border border-border font-display font-bold text-sm text-foreground active:scale-95 transition-smooth hover:bg-[oklch(0.91_0.01_260)]"
          >
            <RotateCcw className="w-4 h-4" />
            Restart
          </button>
        </div>
      )}

      {/* Results screen */}
      <AnimatePresence>
        {phase === "results" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-6"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
              className="text-center"
            >
              <div className="text-7xl mb-4">🏆</div>
              <h2 className="font-display font-black text-4xl text-foreground">
                Great Memory!
              </h2>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="duo-card px-8 py-5 text-center w-full max-w-xs"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-3xl font-display font-black text-foreground">{moves}</p>
                  <p className="text-xs text-muted-foreground font-body">Moves</p>
                </div>
                <div>
                  <p className="text-3xl font-display font-black text-foreground">{formatTime(timeElapsed)}</p>
                  <p className="text-xs text-muted-foreground font-body">Time</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground font-body">
                  Best time: <span className="font-display font-bold text-foreground">{formatTime(progress?.memoryMatch?.bestTime ?? timeElapsed)}</span>
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col gap-3 w-full max-w-xs"
            >
              <button
                type="button"
                onClick={resetGame}
                className="press-btn w-full h-14 text-lg text-white"
                style={{
                  background: "linear-gradient(135deg, oklch(0.72 0.27 130) 0%, oklch(0.56 0.25 130) 100%)",
                  boxShadow: "0 5px 0 0 oklch(0.50 0.23 130)",
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
