import { useRouter } from "@tanstack/react-router";
import { Check, Eraser, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Layout from "../components/Layout";
import { PHONICS_DATA } from "../data/phonicsData";
import { useAppStore } from "../store/useAppStore";
import { getArabicWord, getUILabel } from "../data/arabicTranslations";
import { playSuccessSound, playTapSound } from "../utils/audio";

interface Point { x: number; y: number; }

const STROKE_COLORS: Record<string, string> = {
  red: "oklch(0.60 0.24 15)",
  blue: "oklch(0.55 0.22 260)",
  green: "oklch(0.58 0.22 145)",
  yellow: "oklch(0.72 0.18 84)",
  purple: "oklch(0.55 0.22 320)",
};

const COVERAGE_THRESHOLD = 0.65;
const CANVAS_W = 360;
const CANVAS_H = 240;

const ALL_WORDS = PHONICS_DATA.flatMap((ld) =>
  ld.blendingTasks.map((t) => ({ word: t.word, emoji: t.emoji, color: ld.color }))
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

function computeCoverage(drawnData: Uint8ClampedArray, refData: Uint8ClampedArray): number {
  let refTotal = 0;
  let overlap = 0;
  for (let i = 0; i < refData.length; i += 4) {
    if (refData[i + 3] > 30) {
      refTotal++;
      if (drawnData[i + 3] > 30) overlap++;
    }
  }
  return refTotal === 0 ? 0 : overlap / refTotal;
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
  const currentKey = mode === "letter" ? `L:${letterIdx}` : `W:${wordEntry.word}`;

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

  const wordFontSize = useMemo(() => {
    const len = wordEntry.word.length;
    let size = len <= 3 ? 68 : len === 4 ? 50 : len === 5 ? 42 : 38;
    const maxAllowed = Math.floor((CANVAS_W - 24) / (len * 0.55));
    return Math.min(size, maxAllowed);
  }, [wordEntry.word]);

  useEffect(() => {
    if (!profile) router.navigate({ to: "/" });
  }, [profile, router]);

  if (!profile) return null;

  const completedCount = PHONICS_DATA.filter((l) => progress?.tracing[l.letter]?.completed).length;
  const progressPct = Math.round((completedCount / PHONICS_DATA.length) * 100);

  const getRefPixels = (): Uint8ClampedArray => {
    if (!refPixelsCache.current[currentKey]) {
      if (mode === "letter") {
        refPixelsCache.current[currentKey] = buildReferencePixels(letter.uppercase);
      } else {
        const len = wordEntry.word.length;
        let size = len <= 3 ? 68 : len === 4 ? 50 : len === 5 ? 42 : 38;
        const maxAllowed = Math.floor((CANVAS_W - 24) / (len * 0.55));
        refPixelsCache.current[currentKey] = buildReferencePixels(
          wordEntry.word.toUpperCase(), Math.max(Math.min(size, maxAllowed), 36)
        );
      }
    }
    return refPixelsCache.current[currentKey];
  };

  const getPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    const m = e as React.MouseEvent;
    return { x: (m.clientX - rect.left) * scaleX, y: (m.clientY - rect.top) * scaleY };
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
    ctx.strokeStyle = mode === "letter" ? (STROKE_COLORS[letter.color] ?? STROKE_COLORS.blue) : "oklch(0.55 0.22 280)";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPt.current = pt;
    const now = Date.now();
    if (now - lastCheckTime.current >= 50) { lastCheckTime.current = now; checkSimilarity(); }
  };

  const checkSimilarity = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const drawnData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H).data;
    const score = computeCoverage(drawnData, getRefPixels());
    setCoverage(score);
    if (score >= COVERAGE_THRESHOLD && !isDone) {
      setIsDone(true);
      playSuccessSound();
      if (mode === "letter") {
        updateProgress((prev) => {
          const existing = prev.tracing[letter.letter] ?? { letterId: letter.letter, attempts: 0, completed: false, lastVisited: 0 };
          return {
            ...prev,
            tracing: {
              ...prev.tracing,
              [letter.letter]: { ...existing, attempts: existing.attempts + 1, completed: true, lastVisited: Date.now() },
            },
          };
        });
      }
    }
  };

  const endDraw = () => { if (!drawing.current) return; drawing.current = false; lastPt.current = null; checkSimilarity(); };

  const newWord = () => {
    playTapSound();
    let next = getRandomWord();
    while (next.word === wordEntry.word && ALL_WORDS.length > 1) next = getRandomWord();
    setWordEntry(next);
  };

  return (
    <Layout title={getUILabel("Tracing")} headerColor="oklch(0.48 0.22 145)">
      <div className="px-5 py-5 flex flex-col gap-4">

        {/* Progress Bar */}
        <div className="bg-white rounded-2xl px-4 py-3 border border-border shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-display font-bold text-foreground">{getUILabel("Letters Traced")}</span>
            <span className="text-xs font-display font-black text-[oklch(0.48_0.22_145)]">
              {completedCount}/{PHONICS_DATA.length}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full overflow-hidden bg-muted">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, oklch(0.62 0.22 145) 0%, oklch(0.48 0.22 145) 100%)" }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-muted-foreground font-body mt-1.5">
            {progressPct === 0 ? getUILabel("Start tracing to make progress!") : progressPct === 100 ? getUILabel("\ud83c\udf89 All letters completed!") : `${progressPct}% ${getUILabel("complete — keep going!")}`}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-2xl overflow-hidden border border-border bg-white shadow-xs" data-ocid="tracing.mode_toggle">
          <button
            type="button"
            data-ocid="tracing.letter_mode_tab"
            onClick={() => { playTapSound(); setMode("letter"); }}
            className={`flex-1 py-2.5 text-sm font-display font-bold transition-smooth ${
              mode === "letter" ? "gradient-green text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ✏️ {getUILabel("Letter Tracing")}
          </button>
          <button
            type="button"
            data-ocid="tracing.word_mode_tab"
            onClick={() => { playTapSound(); setMode("word"); }}
            className={`flex-1 py-2.5 text-sm font-display font-bold transition-smooth ${
              mode === "word" ? "gradient-indigo text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            📝 {getUILabel("Word Tracing")}
          </button>
        </div>

        {/* Letter tabs */}
        {mode === "letter" && (
          <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }} data-ocid="tracing.letter_tabs">
            {PHONICS_DATA.map((l, i) => {
              const done = progress?.tracing[l.letter]?.completed;
              return (
                <button
                  key={l.letter}
                  type="button"
                  data-ocid={`tracing.letter_tab.${i + 1}`}
                  onClick={() => { playTapSound(); setLetterIdx(i); }}
                  className={`flex-shrink-0 w-9 h-9 rounded-xl text-sm font-display font-black transition-smooth active:scale-95 border ${
                    i === letterIdx
                      ? "gradient-green text-white border-transparent shadow-playful"
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
        )}

        {/* Subject card */}
        {mode === "letter" ? (
          <div
            className={`rounded-2xl p-4 flex items-center gap-4 text-white ${
              letter.color === "red" ? "gradient-red" : letter.color === "blue" ? "gradient-blue"
              : letter.color === "green" ? "gradient-green" : letter.color === "yellow" ? "gradient-yellow" : "gradient-purple"
            }`}
            style={{ boxShadow: "0 4px 16px oklch(0 0 0 / 0.15)" }}
          >
            <span className="text-7xl font-display font-black leading-none drop-shadow">{letter.uppercase}</span>
            <div>
              <p className="text-2xl font-display font-bold">{letter.lowercase}</p>
              <p className="text-sm font-body opacity-80">/{letter.phonicSound}/</p>
            </div>
            <div className="ml-auto text-center">
              <p className="text-4xl">{letter.words[0].emoji}</p>
              <p className="text-xs font-body opacity-80">{letter.words[0].word}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 flex items-center gap-4 border border-border shadow-card" data-ocid="tracing.word_card">
            <span className="text-5xl">{wordEntry.emoji}</span>
            <div className="flex-1">
              <p className="text-2xl font-display font-black text-foreground leading-tight">{wordEntry.word}</p>
              <p className="text-xs font-body text-muted-foreground mt-0.5">{getUILabel("Trace this word")}</p>
            </div>
            <button
              type="button"
              data-ocid="tracing.new_word_button"
              onClick={newWord}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-display font-bold transition-smooth active:scale-95 bg-muted border border-border text-foreground hover:bg-[oklch(0.91_0.01_260)]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              New Word
            </button>
          </div>
        )}

        {/* Canvas */}
        <div
          className="relative rounded-2xl overflow-hidden border border-border shadow-card bg-white"
        >
          {mode === "letter" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span className="font-display font-black leading-none" style={{ fontSize: 180, color: "oklch(0.88 0.01 260)" }}>
                {letter.uppercase}
              </span>
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            data-ocid="tracing.canvas_target"
            className="relative w-full touch-none cursor-crosshair block"
            style={{ zIndex: 10, position: "relative" }}
            onMouseDown={startDraw}
            onMouseMove={doDrawing}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={doDrawing}
            onTouchEnd={endDraw}
          />
        </div>

        {/* Success banner */}
        {isDone && (
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="rounded-2xl py-3 px-4 text-center font-display font-bold text-base gradient-green text-white shadow-playful"
            data-ocid="tracing.success_state"
          >
            🌟 {getUILabel("Amazing! Great job!")}
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex gap-3">
          <button
            type="button"
            data-ocid="tracing.clear_button"
            onClick={() => { playTapSound(); clearCanvas(); }}
            className="flex-1 h-13 py-3 rounded-2xl bg-white border border-border flex items-center justify-center gap-2 font-display font-bold text-foreground active:scale-95 transition-smooth hover:bg-muted"
          >
            <Eraser className="w-5 h-5" /> {getUILabel("Clear")}
          </button>

          {isDone ? (
            <motion.button
              type="button"
              data-ocid="tracing.next_button"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              onClick={() => {
                playTapSound();
                if (mode === "letter") setLetterIdx((letterIdx + 1) % PHONICS_DATA.length);
                else { newWord(); clearCanvas(); }
              }}
              className="flex-1 py-3 rounded-2xl gradient-green text-white font-display font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-smooth shadow-playful"
            >
              <Check className="w-5 h-5" /> {getUILabel("Next!")}
            </motion.button>
          ) : (
            <div
              data-ocid="tracing.next_locked"
              className="flex-1 py-3 rounded-2xl bg-muted flex items-center justify-center text-sm font-body text-muted-foreground border border-border"
            >
              {mode === "letter" ? getUILabel("Draw the letter") : getUILabel("Trace the word")}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
