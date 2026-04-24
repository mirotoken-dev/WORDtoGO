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

const STROKE_COLORS: Record<string, string> = {
  red: "oklch(0.55 0.28 15)",
  blue: "oklch(0.5 0.24 264)",
  green: "oklch(0.58 0.27 131)",
  yellow: "oklch(0.72 0.16 84)",
  purple: "oklch(0.55 0.22 320)",
};

export default function TracingPage() {
  const router = useRouter();
  const { profiles, activeProfileId, progress, updateProgress } = useAppStore();
  const profile = profiles.find((p) => p.id === activeProfileId) ?? null;

  const [letterIdx, setLetterIdx] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPt = useRef<Point | null>(null);
  const strokesRef = useRef(0);

  const tracedCount = Object.values(progress?.tracing ?? {}).filter(
    (t) => t.completed,
  ).length;

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    strokesRef.current = 0;
    setIsDone(false);
  }, []);

  useEffect(() => {
    clearCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearCanvas]);

  if (!profile) {
    router.navigate({ to: "/" });
    return null;
  }

  const letter = PHONICS_DATA[letterIdx];

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
  };

  const endDraw = () => {
    if (!drawing.current) return;
    drawing.current = false;
    lastPt.current = null;
    strokesRef.current += 1;

    if (strokesRef.current >= 2 && !isDone) {
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
          completed: existing.attempts + 1 >= 1,
          lastVisited: Date.now(),
        };
        return {
          ...prev,
          tracing: { ...prev.tracing, [letter.letter]: updated },
        };
      });
    }
  };

  return (
    <Layout title="Tracing" headerColor="oklch(0.58 0.27 131)">
      <div className="px-5 py-5 flex flex-col gap-4">
        <ProgressBar
          value={(tracedCount / 26) * 100}
          color="green"
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
                  setLetterIdx(i);
                }}
                className={`flex-shrink-0 w-9 h-9 rounded-xl text-sm font-display font-black transition-smooth active:scale-95 ${
                  i === letterIdx
                    ? "gradient-green text-card shadow-playful"
                    : done
                      ? "bg-accent/20 text-accent-foreground"
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
          className={`rounded-3xl p-4 flex items-center gap-4 text-card shadow-playful ${
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
        >
          <span className="text-7xl font-display font-black leading-none">
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

        {/* Canvas */}
        <div className="relative rounded-3xl overflow-hidden bg-card border-2 border-border shadow-playful">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span className="text-[180px] font-display font-black opacity-[0.05] leading-none text-foreground">
              {letter.uppercase}
            </span>
          </div>
          <canvas
            ref={canvasRef}
            width={360}
            height={240}
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

        {/* Controls */}
        <div className="flex gap-3">
          <button
            type="button"
            data-ocid="tracing.clear_button"
            onClick={() => {
              playTapSound();
              clearCanvas();
            }}
            className="flex-1 h-14 rounded-2xl bg-muted flex items-center justify-center gap-2 font-display font-bold text-foreground active:scale-95 transition-smooth"
          >
            <Eraser className="w-5 h-5" /> Clear
          </button>

          {isDone ? (
            <motion.button
              type="button"
              data-ocid="tracing.next_button"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={() => {
                playTapSound();
                setLetterIdx((i) => (i + 1) % PHONICS_DATA.length);
              }}
              className="flex-1 h-14 rounded-2xl gradient-green text-card font-display font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-smooth shadow-playful"
            >
              <Check className="w-5 h-5" /> Next!
            </motion.button>
          ) : (
            <div className="flex-1 h-14 rounded-2xl bg-muted/50 flex items-center justify-center text-sm font-body text-muted-foreground">
              Draw the letter ✏️
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
