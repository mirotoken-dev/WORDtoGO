import { useRouter } from "@tanstack/react-router";
import { Check, Eraser, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Layout from "../components/Layout";
import { PHONICS_DATA } from "../data/phonicsData";
import { useAppStore } from "../store/useAppStore";
import { playSuccessSound, playTapSound } from "../utils/audio";

interface Point {
  x: number;
  y: number;
}

// Vivid stroke colors that pop on dark canvas backgrounds
const STROKE_COLORS: Record<string, string> = {
  red: "oklch(0.72 0.28 15)",
  blue: "oklch(0.68 0.24 264)",
  green: "oklch(0.72 0.27 131)",
  yellow: "oklch(0.90 0.18 84)",
  purple: "oklch(0.68 0.22 320)",
};

const COVERAGE_THRESHOLD = 0.65;
const CANVAS_W = 360;
const CANVAS_H = 240;

/** All words from the 260 blending tasks */
const ALL_WORDS = PHONICS_DATA.flatMap((ld) =>
  ld.blendingTasks.map((t) => ({
    word: t.word,
    emoji: t.emoji,
    color: ld.color,
  })),
);

function getRandomWord() {
  return ALL_WORDS[Math.floor(Math.random() * ALL_WORDS.length)];
}

function buildReferencePixels(text: string, fontSize = 160): Uint8ClampedArray {
  const off = document.createElement("canvas");
  off.width = CANVAS_W;
  off.height = CANVAS_H;
  const ctx = off.getContext("2d")!;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.font = `900 ${fontSize}px var(--font-display, sans-serif)`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#000000";
  ctx.fillText(text, CANVAS_W / 2, CANVAS_H / 2);
  return ctx.getImageData(0, 0, CANVAS_W, CANVAS_H).data;
}

function computeCoverage(
  drawnData: Uint8ClampedArray,
  refData: Uint8ClampedArray,
): number {
  let refTotal = 0;
  let overlap = 0;
  for (let i = 0; i < refData.length; i += 4) {
    if (refData[i + 3] > 30) {
      refTotal++;
      if (drawnData[i + 3] > 30) overlap++;
    }
  }
  if (refTotal === 0) return 0;
  return overlap / refTotal;
}

type TraceMode = "letter" | "word";

export default function TracingPage() {
  const router = useRouter();
  const { profiles, activeProfileId, progress, updateProgress } = useAppStore();
  const profile = profiles.find((p) => p.id === activeProfileId) ?? null;

  const [mode, setMode] = useState<TraceMode>("letter");
  const [letterIdx, setLetterIdx] = useState(0);
  const [wordEntry, setWordEntry] = useState(() => getRandomWord());
  const [isDone, setIsDone] = useState(false);
  const [_coverage, setCoverage] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPt = useRef<Point | null>(null);
  const lastCheckTime = useRef(0);
  const refPixelsCache = useRef<Record<string, Uint8ClampedArray>>({});
  const prevKeyRef = useRef("");

  const letter = PHONICS_DATA[letterIdx];

  // Key to detect mode/subject changes for canvas clearing
  const currentKey =
    mode === "letter" ? `L:${letterIdx}` : `W:${wordEntry.word}`;

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setCoverage(0);
    setIsDone(false);
  }, []);

  useEffect(() => {
    if (prevKeyRef.current !== currentKey) {
      prevKeyRef.current = currentKey;
      clearCanvas();
    }
  }, [currentKey, clearCanvas]);

  // Compute font size for word guide overlay — must be before early return
  const wordFontSize = useMemo(() => {
    const len = wordEntry.word.length;
    let size: number;
    if (len <= 3) size = 80;
    else if (len === 4) size = 60;
    else if (len === 5) size = 50;
    else size = 45;
    // Overflow guard: estimate rendered width at ~0.55em per char for display font
    const maxAllowed = Math.floor((CANVAS_W - 24) / (len * 0.55));
    return Math.min(size, maxAllowed);
  }, [wordEntry.word]);

  if (!profile) {
    router.navigate({ to: "/" });
    return null;
  }

  // Reference pixel getter — cached per key
  const getRefPixels = (): Uint8ClampedArray => {
    const key = currentKey;
    if (!refPixelsCache.current[key]) {
      if (mode === "letter") {
        refPixelsCache.current[key] = buildReferencePixels(letter.uppercase);
      } else {
        // Scale font size to fit word on canvas — matches the visual guide
        const len = wordEntry.word.length;
        let size: number;
        if (len <= 3) size = 80;
        else if (len === 4) size = 60;
        else if (len === 5) size = 50;
        else size = 45;
        const maxAllowed = Math.floor((CANVAS_W - 24) / (len * 0.55));
        const fontSize = Math.min(size, maxAllowed);
        refPixelsCache.current[key] = buildReferencePixels(
          wordEntry.word.toUpperCase(),
          Math.max(fontSize, 40),
        );
      }
    }
    return refPixelsCache.current[key];
  };

  const getPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const t = e.touches[0];
      return {
        x: (t.clientX - rect.left) * scaleX,
        y: (t.clientY - rect.top) * scaleY,
      };
    }
    const m = e as React.MouseEvent;
    return {
      x: (m.clientX - rect.left) * scaleX,
      y: (m.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    drawing.current = true;
    lastPt.current = getPoint(e);
  };

  const doDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing.current || !canvasRef.current || !lastPt.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const pt = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(lastPt.current.x, lastPt.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.strokeStyle =
      mode === "letter"
        ? (STROKE_COLORS[letter.color] ?? STROKE_COLORS.blue)
        : "oklch(0.82 0.17 84)";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPt.current = pt;
    const now = Date.now();
    if (now - lastCheckTime.current >= 50) {
      lastCheckTime.current = now;
      checkSimilarity();
    }
  };

  const checkSimilarity = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const drawnData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H).data;
    const refData = getRefPixels();
    const score = computeCoverage(drawnData, refData);
    setCoverage(score);
    if (score >= COVERAGE_THRESHOLD && !isDone) {
      setIsDone(true);
      playSuccessSound();
      if (mode === "letter") {
        updateProgress((prev) => {
          const existing = prev.tracing[letter.letter] ?? {
            letterId: letter.letter,
            attempts: 0,
            completed: false,
            lastVisited: 0,
          };
          return {
            ...prev,
            tracing: {
              ...prev.tracing,
              [letter.letter]: {
                ...existing,
                attempts: existing.attempts + 1,
                completed: true,
                lastVisited: Date.now(),
              },
            },
          };
        });
      }
    }
  };

  const endDraw = () => {
    if (!drawing.current) return;
    drawing.current = false;
    lastPt.current = null;
    checkSimilarity();
  };

  const goToLetter = (newIdx: number) => setLetterIdx(newIdx);

  const newWord = () => {
    playTapSound();
    let next = getRandomWord();
    // Avoid same word twice in a row
    while (next.word === wordEntry.word && ALL_WORDS.length > 1) {
      next = getRandomWord();
    }
    setWordEntry(next);
  };

  return (
    <Layout title="Tracing" headerColor="oklch(0.48 0.27 131)">
      <div className="px-5 py-5 flex flex-col gap-4">
        {/* Mode toggle */}
        <div
          className="flex rounded-2xl overflow-hidden border border-[oklch(0.82_0.17_84/0.25)] bg-card/50"
          data-ocid="tracing.mode_toggle"
        >
          <button
            type="button"
            data-ocid="tracing.letter_mode_tab"
            onClick={() => {
              playTapSound();
              setMode("letter");
            }}
            className={`flex-1 py-2.5 text-sm font-display font-bold transition-smooth ${
              mode === "letter"
                ? "gradient-green text-card"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ✏️ Letter Tracing
          </button>
          <button
            type="button"
            data-ocid="tracing.word_mode_tab"
            onClick={() => {
              playTapSound();
              setMode("word");
            }}
            className={`flex-1 py-2.5 text-sm font-display font-bold transition-smooth ${
              mode === "word"
                ? "gradient-gold text-[oklch(0.08_0_0)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            📝 Word Tracing
          </button>
        </div>

        {/* Letter mode: selector tabs */}
        {mode === "letter" && (
          <div
            className="flex gap-1.5 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none" }}
            data-ocid="tracing.letter_tabs"
          >
            {PHONICS_DATA.map((l, i) => {
              const done = progress?.tracing[l.letter]?.completed;
              return (
                <button
                  key={l.letter}
                  type="button"
                  data-ocid={`tracing.letter_tab.${i + 1}`}
                  onClick={() => {
                    playTapSound();
                    goToLetter(i);
                  }}
                  className={`flex-shrink-0 w-9 h-9 rounded-xl text-sm font-display font-black transition-smooth active:scale-95 ${
                    i === letterIdx
                      ? "gradient-green text-card shadow-playful"
                      : done
                        ? "bg-[oklch(0.82_0.17_84/0.25)] text-[oklch(0.88_0.17_84)]"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {l.letter}
                </button>
              );
            })}
          </div>
        )}

        {/* Subject card */}
        {mode === "letter" ? (
          <div
            className={`rounded-3xl p-4 flex items-center gap-4 text-card ${
              letter.color === "red"
                ? "gradient-red"
                : letter.color === "blue"
                  ? "gradient-blue"
                  : letter.color === "green"
                    ? "gradient-green"
                    : letter.color === "yellow"
                      ? "gradient-yellow"
                      : "gradient-purple"
            }`}
            style={{
              boxShadow:
                "0 8px 32px oklch(0 0 0 / 0.5), 0 0 0 1px oklch(1 0 0 / 0.1) inset",
            }}
          >
            <span className="text-7xl font-display font-black leading-none drop-shadow-lg">
              {letter.uppercase}
            </span>
            <div>
              <p className="text-2xl font-display font-bold">
                {letter.lowercase}
              </p>
              <p className="text-sm font-body opacity-80">
                /{letter.phonicSound}/
              </p>
            </div>
            <div className="ml-auto text-center">
              <p className="text-4xl">{letter.words[0].emoji}</p>
              <p className="text-xs font-body opacity-80">
                {letter.words[0].word}
              </p>
            </div>
          </div>
        ) : (
          <div
            className="rounded-3xl p-4 flex items-center gap-4"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.20 0.06 84) 0%, oklch(0.14 0.04 84) 100%)",
              border: "1px solid oklch(0.82 0.17 84 / 0.35)",
              boxShadow:
                "0 8px 32px oklch(0 0 0 / 0.5), 0 0 0 1px oklch(0.82 0.17 84 / 0.1) inset",
            }}
            data-ocid="tracing.word_card"
          >
            <span className="text-6xl">{wordEntry.emoji}</span>
            <div className="flex-1">
              <p
                className="text-2xl font-display font-black leading-tight"
                style={{ color: "oklch(0.92 0.18 84)" }}
              >
                {wordEntry.word}
              </p>
              <p
                className="text-xs font-body mt-0.5"
                style={{ color: "oklch(0.70 0.10 84)" }}
              >
                Trace this word
              </p>
            </div>
            <button
              type="button"
              data-ocid="tracing.new_word_button"
              onClick={newWord}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-display font-bold transition-smooth active:scale-95"
              style={{
                background: "oklch(0.82 0.17 84 / 0.2)",
                color: "oklch(0.92 0.18 84)",
                border: "1px solid oklch(0.82 0.17 84 / 0.4)",
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              New Word
            </button>
          </div>
        )}

        {/* Canvas */}
        <div
          className="relative rounded-3xl overflow-hidden border border-[oklch(0.82_0.17_84/0.2)]"
          style={{
            background: "oklch(0.10 0.02 264)",
            boxShadow:
              "0 8px 32px oklch(0 0 0 / 0.6), 0 0 0 1px oklch(0.82 0.17 84 / 0.1) inset",
          }}
        >
          {/* Guide text overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            {mode === "letter" ? (
              <span
                className="font-display font-black leading-none"
                style={{ fontSize: 180, color: "oklch(0.82 0.17 84 / 0.35)" }}
              >
                {letter.uppercase}
              </span>
            ) : (
              <span
                className="font-display font-black leading-none px-3 text-center"
                style={{
                  fontSize: wordFontSize,
                  color: "oklch(0.82 0.17 84 / 0.35)",
                  letterSpacing: "0.05em",
                }}
              >
                {wordEntry.word.toUpperCase()}
              </span>
            )}
          </div>
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            data-ocid="tracing.canvas_target"
            className="w-full touch-none cursor-crosshair block"
            onMouseDown={startDraw}
            onMouseMove={doDrawing}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={doDrawing}
            onTouchEnd={endDraw}
          />
        </div>

        {/* Celebration banner */}
        {isDone && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="rounded-2xl py-3 px-4 text-center font-display font-bold text-lg"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.82 0.17 84 / 0.25) 0%, oklch(0.70 0.20 60 / 0.20) 100%)",
              border: "1px solid oklch(0.82 0.17 84 / 0.5)",
              color: "oklch(0.92 0.18 84)",
            }}
            data-ocid="tracing.success_state"
          >
            🌟 Amazing! Great job!
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex gap-3">
          <button
            type="button"
            data-ocid="tracing.clear_button"
            onClick={() => {
              playTapSound();
              clearCanvas();
            }}
            className="flex-1 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center gap-2 font-display font-bold text-foreground active:scale-95 transition-smooth hover:border-[oklch(0.82_0.17_84/0.4)]"
          >
            <Eraser className="w-5 h-5" /> Clear
          </button>

          {isDone ? (
            <motion.button
              type="button"
              data-ocid="tracing.next_button"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              onClick={() => {
                playTapSound();
                if (mode === "letter") {
                  goToLetter((letterIdx + 1) % PHONICS_DATA.length);
                } else {
                  newWord();
                  clearCanvas();
                }
              }}
              className="flex-1 h-14 rounded-2xl gradient-gold text-[oklch(0.08_0_0)] font-display font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-smooth shadow-luxury"
            >
              <Check className="w-5 h-5" /> Next!
            </motion.button>
          ) : (
            <div
              data-ocid="tracing.next_locked"
              className="flex-1 h-14 rounded-2xl bg-muted/50 flex items-center justify-center text-sm font-body text-muted-foreground border border-border"
            >
              {mode === "letter" ? "Draw the letter ✏️" : "Trace the word 📝"}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
