import { useRouter } from "@tanstack/react-router";
import { Check, Eraser } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import Layout from "../components/Layout";
import ProgressBar from "../components/ProgressBar";
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

const COVERAGE_THRESHOLD = 0.65; // 65% coverage required
const CANVAS_W = 360;
const CANVAS_H = 240;

/** Renders the reference letter into an offscreen canvas and returns its pixel data */
function buildReferencePixels(upperLetter: string): Uint8ClampedArray {
  const off = document.createElement("canvas");
  off.width = CANVAS_W;
  off.height = CANVAS_H;
  const ctx = off.getContext("2d")!;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.font = "900 180px var(--font-display, sans-serif)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#000000";
  ctx.fillText(upperLetter, CANVAS_W / 2, CANVAS_H / 2);
  return ctx.getImageData(0, 0, CANVAS_W, CANVAS_H).data;
}

/**
 * Computes what fraction of the reference letter's filled pixels are
 * covered by pixels the child has drawn (alpha > 30).
 */
function computeCoverage(
  drawnData: Uint8ClampedArray,
  refData: Uint8ClampedArray,
): number {
  let refTotal = 0;
  let overlap = 0;
  for (let i = 0; i < refData.length; i += 4) {
    const refAlpha = refData[i + 3];
    if (refAlpha > 30) {
      refTotal++;
      const drawnAlpha = drawnData[i + 3];
      if (drawnAlpha > 30) overlap++;
    }
  }
  if (refTotal === 0) return 0;
  return overlap / refTotal;
}

export default function TracingPage() {
  const router = useRouter();
  const { profiles, activeProfileId, progress, updateProgress } = useAppStore();
  const profile = profiles.find((p) => p.id === activeProfileId) ?? null;

  const [letterIdx, setLetterIdx] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [coverage, setCoverage] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPt = useRef<Point | null>(null);
  // Throttle checkSimilarity calls during drawing — fire at most every 50ms
  const lastCheckTime = useRef(0);
  // Cache reference pixel data per letter to avoid re-rendering on each stroke
  const refPixelsCache = useRef<Record<string, Uint8ClampedArray>>({});

  const tracedCount = Object.values(progress?.tracing ?? {}).filter(
    (t) => t.completed,
  ).length;

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setCoverage(0);
    setIsDone(false);
  }, []);

  // Track previous letter index to detect changes and trigger canvas clear
  const prevLetterIdxRef = useRef(-1);

  // Clear canvas on mount and whenever the active letter changes
  useEffect(() => {
    if (prevLetterIdxRef.current !== letterIdx) {
      prevLetterIdxRef.current = letterIdx;
      clearCanvas();
    }
  }, [letterIdx, clearCanvas]);

  if (!profile) {
    router.navigate({ to: "/" });
    return null;
  }

  const letter = PHONICS_DATA[letterIdx];

  /** Get (or build + cache) the reference pixels for the current letter */
  const getRefPixels = (): Uint8ClampedArray => {
    if (!refPixelsCache.current[letter.uppercase]) {
      refPixelsCache.current[letter.uppercase] = buildReferencePixels(
        letter.uppercase,
      );
    }
    return refPixelsCache.current[letter.uppercase];
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
    ctx.strokeStyle = STROKE_COLORS[letter.color] ?? STROKE_COLORS.blue;
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPt.current = pt;

    // Throttle live similarity check to every 50ms while drawing for smooth bar updates
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
      updateProgress((prev) => {
        const existing = prev.tracing[letter.letter] ?? {
          letterId: letter.letter,
          attempts: 0,
          completed: false,
          lastVisited: 0,
        };
        const updated = {
          ...existing,
          attempts: existing.attempts + 1,
          completed: true,
          lastVisited: Date.now(),
        };
        return {
          ...prev,
          tracing: { ...prev.tracing, [letter.letter]: updated },
        };
      });
    }
  };

  const endDraw = () => {
    if (!drawing.current) return;
    drawing.current = false;
    lastPt.current = null;
    checkSimilarity();
  };

  const goToLetter = (newIdx: number) => {
    setLetterIdx(newIdx);
  };

  // Coverage bar color: orange → yellow → gold/green
  const coveragePct = Math.round(coverage * 100);
  const barColor =
    coveragePct >= 65
      ? "oklch(0.82 0.17 84)" // gold
      : coveragePct >= 40
        ? "oklch(0.75 0.22 60)" // amber
        : "oklch(0.65 0.22 35)"; // orange-red

  const coverageLabel = isDone
    ? "🌟 Great job!"
    : coveragePct >= 40
      ? "Almost there! Keep going 🖊️"
      : "Trace the letter above ✏️";

  return (
    <Layout title="Tracing" headerColor="oklch(0.48 0.27 131)">
      <div className="px-5 py-5 flex flex-col gap-4">
        <ProgressBar
          value={(tracedCount / 26) * 100}
          color="gold"
          label={`${tracedCount}/26 letters`}
        />

        {/* Letter selector */}
        <div
          className="flex gap-1.5 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
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

        {/* Letter guide */}
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

        {/* Canvas — dark charcoal background with subtle gold letter guide */}
        <div
          className="relative rounded-3xl overflow-hidden border border-[oklch(0.82_0.17_84/0.2)]"
          style={{
            background: "oklch(0.10 0.02 264)",
            boxShadow:
              "0 8px 32px oklch(0 0 0 / 0.6), 0 0 0 1px oklch(0.82 0.17 84 / 0.1) inset",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span
              className="text-[180px] font-display font-black leading-none"
              style={{ color: "oklch(0.82 0.17 84 / 0.08)" }}
            >
              {letter.uppercase}
            </span>
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

        {/* Similarity progress bar */}
        <div
          data-ocid="tracing.similarity_indicator"
          className="flex flex-col gap-1.5"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-body text-muted-foreground">
              {coverageLabel}
            </span>
            <span
              className="text-xs font-display font-bold tabular-nums"
              style={{ color: barColor }}
            >
              {coveragePct}%
            </span>
          </div>
          <div
            className="h-3 rounded-full overflow-hidden"
            style={{
              background: "oklch(0.16 0.03 264)",
              boxShadow: "inset 0 1px 3px oklch(0 0 0 / 0.5)",
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-150 ease-out"
              style={{
                width: `${Math.min(coveragePct, 100)}%`,
                backgroundColor: barColor,
                boxShadow:
                  coveragePct > 0
                    ? `0 0 10px ${barColor.replace(")", " / 0.5)")}`
                    : "none",
              }}
            />
          </div>
          <div className="flex justify-end">
            <span className="text-[10px] font-body text-muted-foreground">
              Need {Math.round(COVERAGE_THRESHOLD * 100)}% to unlock Next
            </span>
          </div>
        </div>

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
                goToLetter((letterIdx + 1) % PHONICS_DATA.length);
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
              Draw the letter ✏️
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
