import { useRouter } from "@tanstack/react-router";
import { Check, Eraser, RefreshCw, SkipForward } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Layout from "../components/Layout";
import { PHONICS_DATA } from "../data/phonicsData";
import { useAppStore } from "../store/useAppStore";
import { getUILabel } from "../data/arabicTranslations";
import { playSuccessSound, playTapSound } from "../utils/audio";

interface Point { x: number; y: number; }

const STROKE_COLORS: Record<string, string> = {
  red: "oklch(0.60 0.24 15)",
  blue: "oklch(0.55 0.22 260)",
  green: "oklch(0.58 0.22 145)",
  yellow: "oklch(0.72 0.18 84)",
  purple: "oklch(0.55 0.22 320)",
};

// ── Scoring thresholds ────────────────────────────────────────────────────────
const COVERAGE_THRESHOLD  = 0.72;  // 72% of guide pixels must be covered
const PRECISION_THRESHOLD = 0.55;  // 55% of drawn pixels must land on the guide
const PRECISION_DISPLAY_TARGET = 0.55; // full progress credit at this precision;
                                       // below it bar scales down aggressively
const ZONE_GRID           = 3;
const ZONE_MIN_REF_PX     = 20;
const ZONE_COVERAGE_MIN   = 0.50;
const ZONE_PASS_FRACTION  = 0.72;
const CHECK_MS            = 30;
const CANVAS_W            = 360;
const CANVAS_H            = 240;

const ALL_WORDS = PHONICS_DATA.flatMap((ld) =>
  ld.blendingTasks.map((t) => ({ word: t.word, emoji: t.emoji, color: ld.color }))
);
function getRandomWord() {
  return ALL_WORDS[Math.floor(Math.random() * ALL_WORDS.length)];
}

interface TraceScores {
  coverage: number;
  precision: number;
  zoneFraction: number;
}

function computeScores(
  drawnData: Uint8ClampedArray,
  refData: Uint8ClampedArray,
): TraceScores {
  let refTotal = 0, drawnTotal = 0, overlap = 0;

  const cells     = ZONE_GRID * ZONE_GRID;
  const zoneRef   = new Int32Array(cells);
  const zoneOver  = new Int32Array(cells);

  for (let i = 0; i < refData.length; i += 4) {
    const onRef   = refData[i + 3]   > 30;
    const onDrawn = drawnData[i + 3] > 30;

    if (onDrawn) drawnTotal++;

    if (!onRef) continue;   // outside-guide pixels ignored for coverage/zones

    const idx = i >> 2;
    const px  = idx % CANVAS_W;
    const py  = (idx / CANVAS_W) | 0;
    const zx  = Math.min((px / CANVAS_W * ZONE_GRID) | 0, ZONE_GRID - 1);
    const zy  = Math.min((py / CANVAS_H * ZONE_GRID) | 0, ZONE_GRID - 1);
    const zi  = zy * ZONE_GRID + zx;

    refTotal++;
    zoneRef[zi]++;
    if (onDrawn) { overlap++; zoneOver[zi]++; }
  }

  const coverage  = refTotal   === 0 ? 0 : overlap / refTotal;
  const precision = drawnTotal === 0 ? 0 : overlap / drawnTotal;

  let totalZones = 0, coveredZones = 0;
  for (let zi = 0; zi < cells; zi++) {
    if (zoneRef[zi] < ZONE_MIN_REF_PX) continue;
    totalZones++;
    if (zoneOver[zi] / zoneRef[zi] >= ZONE_COVERAGE_MIN) coveredZones++;
  }
  const zoneFraction = totalZones === 0 ? 1 : coveredZones / totalZones;

  return { coverage, precision, zoneFraction };
}

type TraceMode = "letter" | "word";

export default function TracingPage() {
  const router = useRouter();
  const { profiles, activeProfileId, progress, updateProgress } = useAppStore();
  const profile = profiles.find((p) => p.id === activeProfileId) ?? null;

  const [mode, setMode]           = useState<TraceMode>("letter");
  const [letterIdx, setLetterIdx] = useState(0);
  const [wordEntry, setWordEntry] = useState(() => getRandomWord());
  const [isDone, setIsDone]       = useState(false);
  const [traceProgress, setTraceProgress] = useState(0);

  // bgCanvasRef — renders the guide; its pixels ARE the reference (both modes)
  // canvasRef   — transparent foreground; child draws here
  const bgCanvasRef  = useRef<HTMLCanvasElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const drawing      = useRef(false);
  const lastPt       = useRef<Point | null>(null);
  const lastCheckTime = useRef(0);
  const bgRefPixels  = useRef<Uint8ClampedArray | null>(null);
  const prevKeyRef   = useRef("");

  const letter     = PHONICS_DATA[letterIdx];
  const currentKey = mode === "letter" ? `L:${letterIdx}` : `W:${wordEntry.word}`;

  // Font size for word guide — fills the canvas as large as possible
  const wordGuideFontSize = useMemo(() => {
    const len = wordEntry.word.length;
    const maxByWidth  = Math.floor((CANVAS_W - 8) / (len * 0.60)); // fill width
    const maxByHeight = CANVAS_H - 16;                              // fill height
    return Math.max(Math.min(maxByWidth, maxByHeight), 50);
  }, [wordEntry.word]);

  // ── Draw guide on bgCanvas ────────────────────────────────────────────────
  // Letter mode: draw gray guide + capture ref pixels for scoring.
  // Word mode: blank canvas (no blueprint) — free-form tracing only.
  useEffect(() => {
    const bg = bgCanvasRef.current;
    if (!bg) return;
    const ctx = bg.getContext("2d")!;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    if (mode === "letter") {
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle    = "rgb(200, 205, 215)";
      ctx.font = `900 162px Nunito, sans-serif`;
      ctx.fillText(letter.uppercase, CANVAS_W / 2, CANVAS_H / 2);
      // Capture ref pixels immediately — same draw, guaranteed alignment
      bgRefPixels.current = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H).data;
    } else {
      // Word mode has no guide; clear ref so scoring never fires
      bgRefPixels.current = null;
    }
  }, [mode, letter.uppercase, wordEntry.word, wordGuideFontSize]);

  const clearCanvas = useCallback(() => {
    const fg = canvasRef.current;
    if (!fg) return;
    fg.getContext("2d")?.clearRect(0, 0, fg.width, fg.height);
    setTraceProgress(0);
    setIsDone(false);
  }, []);

  useEffect(() => {
    if (prevKeyRef.current !== currentKey) {
      prevKeyRef.current = currentKey;
      clearCanvas();
    }
  }, [currentKey, clearCanvas]);

  useEffect(() => {
    if (!profile) router.navigate({ to: "/" });
  }, [profile, router]);

  if (!profile) return null;

  const completedCount = PHONICS_DATA.filter((l) => progress?.tracing[l.letter]?.completed).length;
  const progressPct    = Math.round((completedCount / PHONICS_DATA.length) * 100);

  const getPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
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
    lastPt.current  = getPoint(e);
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
    ctx.strokeStyle = mode === "letter"
      ? (STROKE_COLORS[letter.color] ?? STROKE_COLORS.blue)
      : "oklch(0.55 0.22 280)";
    ctx.lineWidth  = mode === "letter" ? 22 : 16;
    ctx.lineCap    = "round";
    ctx.lineJoin   = "round";
    ctx.stroke();
    lastPt.current = pt;
    const now = Date.now();
    if (now - lastCheckTime.current >= CHECK_MS) {
      lastCheckTime.current = now;
      checkSimilarity();
    }
  };

  const checkSimilarity = () => {
    const fg = canvasRef.current;
    if (!fg || !bgRefPixels.current) return;
    const fgCtx = fg.getContext("2d");
    if (!fgCtx) return;

    const drawnData = fgCtx.getImageData(0, 0, CANVAS_W, CANVAS_H).data;
    const { coverage, precision, zoneFraction } = computeScores(drawnData, bgRefPixels.current);

    // Progress = coverage × precision factor (aggressive power curve)
    // Outside strokes reduce the bar hard: exponent 2 means half-precision → quarter credit
    const precisionFactor = Math.pow(Math.min(precision / PRECISION_DISPLAY_TARGET, 1.0), 2);
    const displayPct = Math.round(coverage * precisionFactor * 100);

    const allPass = coverage  >= COVERAGE_THRESHOLD
                 && precision >= PRECISION_THRESHOLD
                 && zoneFraction >= ZONE_PASS_FRACTION;
    setTraceProgress(allPass ? 100 : Math.min(displayPct, 99));

    if (allPass && !isDone) {
      setIsDone(true);
      playSuccessSound();
      if (mode === "letter") {
        updateProgress((prev) => {
          const existing = prev.tracing[letter.letter] ?? {
            letterId: letter.letter, attempts: 0, completed: false, lastVisited: 0,
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
    lastPt.current  = null;
    checkSimilarity();
  };

  const newWord = () => {
    playTapSound();
    let next = getRandomWord();
    while (next.word === wordEntry.word && ALL_WORDS.length > 1) next = getRandomWord();
    setWordEntry(next);
  };

  return (
    <Layout title={getUILabel("Tracing")} headerColor="oklch(0.48 0.22 145)">
      <div className="px-5 py-5 flex flex-col gap-4">

        {/* Overall progress bar */}
        <div className="bg-white rounded-2xl px-4 py-3 border border-border shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-display font-bold text-foreground">
              {getUILabel("Letters Traced")}
            </span>
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
            {progressPct === 0
              ? getUILabel("Start tracing to make progress!")
              : progressPct === 100
                ? getUILabel("🎉 All letters completed!")
                : `${progressPct}% ${getUILabel("complete — keep going!")}`}
          </p>
        </div>

        {/* Mode toggle */}
        <div
          className="flex rounded-2xl overflow-hidden border border-border bg-white shadow-xs"
          data-ocid="tracing.mode_toggle"
        >
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

        {/* Letter selector tabs */}
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
              letter.color === "red"    ? "gradient-red"
              : letter.color === "blue"   ? "gradient-blue"
              : letter.color === "green"  ? "gradient-green"
              : letter.color === "yellow" ? "gradient-yellow"
              : "gradient-purple"
            }`}
            style={{ boxShadow: "0 4px 16px oklch(0 0 0 / 0.15)" }}
          >
            <span className="text-7xl font-display font-black leading-none drop-shadow">
              {letter.uppercase}
            </span>
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
          <div
            className="bg-white rounded-2xl p-4 flex items-center gap-4 border border-border shadow-card"
            data-ocid="tracing.word_card"
          >
            <span className="text-5xl">{wordEntry.emoji}</span>
            <div className="flex-1">
              <p className="text-2xl font-display font-black text-foreground leading-tight">
                {wordEntry.word}
              </p>
              <p className="text-xs font-body text-muted-foreground mt-0.5">
                {getUILabel("Trace this word")}
              </p>
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

        {/* Canvas: bgCanvas (guide) stacked under fgCanvas (drawing) */}
        <div className="relative rounded-2xl overflow-hidden border border-border shadow-card bg-white">
          {/* Background canvas — gray guide letter/word; also the pixel reference */}
          <canvas
            ref={bgCanvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            aria-hidden="true"
            className="absolute inset-0 w-full h-full pointer-events-none select-none"
            style={{ zIndex: 1 }}
          />
          {/* Foreground canvas — transparent; child draws colored strokes here */}
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            data-ocid="tracing.canvas_target"
            className="relative w-full touch-none cursor-crosshair block"
            style={{ zIndex: 10 }}
            onMouseDown={startDraw}
            onMouseMove={doDrawing}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={doDrawing}
            onTouchEnd={endDraw}
          />
        </div>

        {/* Live tracing progress bar — letter mode only */}
        {mode === "letter" && <div className="bg-white rounded-2xl px-4 py-3 border border-border shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-display font-bold text-foreground">
              {isDone
                ? "✅ " + getUILabel("Complete!")
                : traceProgress === 0
                  ? "✏️ " + getUILabel("Start tracing…")
                  : traceProgress < 40
                    ? "✏️ " + getUILabel("Keep going!")
                    : traceProgress < 75
                      ? "🌟 " + getUILabel("Great job! Almost there!")
                      : "🔥 " + getUILabel("So close! Fill it all in!")}
            </span>
            <span
              className="text-xs font-display font-black"
              style={{ color: "oklch(0.48 0.22 145)" }}
            >
              {traceProgress}%
            </span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden bg-muted">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: isDone
                  ? "linear-gradient(90deg, oklch(0.52 0.22 145), oklch(0.40 0.22 145))"
                  : "linear-gradient(90deg, oklch(0.72 0.22 145), oklch(0.55 0.22 145))",
              }}
              animate={{ width: `${traceProgress}%` }}
              transition={{ duration: 0.1, ease: "easeOut" }}
            />
          </div>
        </div>}

        {/* Success banner — letter mode only; always in DOM to avoid layout shift */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: (mode === "letter" && isDone) ? 1 : 0.85, opacity: (mode === "letter" && isDone) ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className="rounded-2xl py-3 px-4 text-center font-display font-bold text-base gradient-green text-white shadow-playful"
          style={{ pointerEvents: (mode === "letter" && isDone) ? "auto" : "none", visibility: (mode === "letter" && isDone) ? "visible" : "hidden" }}
          data-ocid="tracing.success_state"
          aria-hidden={!(mode === "letter" && isDone)}
        >
          🌟 {getUILabel("Amazing! Great job!")}
        </motion.div>

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

          {mode === "letter" && !isDone && (
            <button
              type="button"
              data-ocid="tracing.skip_button"
              onClick={() => {
                playTapSound();
                setLetterIdx((letterIdx + 1) % PHONICS_DATA.length);
              }}
              className="flex-1 py-3 rounded-2xl bg-white border border-border flex items-center justify-center gap-2 font-display font-bold text-foreground active:scale-95 transition-smooth hover:bg-muted"
            >
              <SkipForward className="w-5 h-5" /> {getUILabel("Skip")}
            </button>
          )}

          {(mode === "word" || isDone) && (
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
          )}
        </div>
      </div>
    </Layout>
  );
}
