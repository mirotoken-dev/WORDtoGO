import { useRouter } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PHONICS_DATA } from "../data/phonicsData";
import {
  playCelebrationSound,
  playSuccessSound,
  speakWord,
} from "../utils/audio";

// ── Levenshtein distance ─────────────────────────────────────────────────────
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

function normalizedSimilarity(target: string, spoken: string): number {
  const t = target.toLowerCase().trim();
  const s = spoken.toLowerCase().trim();
  const dist = levenshtein(t, s);
  return 1 - dist / Math.max(t.length, s.length, 1);
}

// ── Collect all 260 words ────────────────────────────────────────────────────
const ALL_WORDS = PHONICS_DATA.flatMap((ld) =>
  ld.words.map((w) => ({ word: w.word, emoji: w.emoji })),
);

function pickRandom(exclude?: string): { word: string; emoji: string } {
  let candidates = ALL_WORDS;
  if (exclude) candidates = ALL_WORDS.filter((w) => w.word !== exclude);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// biome-ignore lint/suspicious/noExplicitAny: SpeechRecognition API types
type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  // biome-ignore lint/suspicious/noExplicitAny: event shape
  onresult: ((event: any) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

declare global {
  interface Window {
    // biome-ignore lint/suspicious/noExplicitAny: SpeechRecognition constructor
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    // biome-ignore lint/suspicious/noExplicitAny: vendor prefix
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

type RecognitionState = "idle" | "listening" | "correct" | "mismatch";

// ── Star burst particle ───────────────────────────────────────────────────────
const STAR_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export default function PronunciationPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(() => pickRandom());
  const [state, setState] = useState<RecognitionState>("idle");
  const [spokenText, setSpokenText] = useState("");
  const [hasSpeechAPI] = useState(() => {
    return (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    );
  });

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopRecognition();
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, [stopRecognition]);

  const advanceWord = useCallback(() => {
    setCurrent((prev) => pickRandom(prev.word));
    setState("idle");
    setSpokenText("");
  }, []);

  const startListening = useCallback(() => {
    if (state === "listening" || state === "correct") return;
    stopRecognition();

    const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // biome-ignore lint/suspicious/noExplicitAny: SpeechRecognition constructor
    const recognition = new (SpeechRecognition as any)();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => setState("listening");

    recognition.onresult = (event: {
      results: {
        length: number;
        [i: number]: { length: number; [j: number]: { transcript: string } };
      };
    }) => {
      const results: string[] = [];
      for (let i = 0; i < event.results.length; i++) {
        for (let j = 0; j < event.results[i].length; j++) {
          results.push(event.results[i][j].transcript);
        }
      }

      const best = results.find(
        (r) => normalizedSimilarity(current.word, r) >= 0.6,
      );

      const topTranscript = results[0] ?? "";
      setSpokenText(topTranscript);

      if (best !== undefined) {
        setState("correct");
        playSuccessSound();
        setTimeout(() => playCelebrationSound(), 300);
        advanceTimerRef.current = setTimeout(() => {
          advanceWord();
        }, 1800);
      } else {
        setState("mismatch");
      }
    };

    recognition.onerror = () => {
      setState("idle");
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
        setState((prev) => (prev === "listening" ? "idle" : prev));
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [state, current.word, stopRecognition, advanceWord]);

  const handleListen = () => speakWord(current.word);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.09 0.02 264) 0%, oklch(0.07 0.01 264) 100%)",
      }}
    >
      {/* Header */}
      <header
        className="flex items-center gap-3 px-5 py-4 border-b"
        style={{
          background: "oklch(0.12 0.02 264 / 0.95)",
          borderColor: "oklch(0.82 0.17 84 / 0.2)",
          backdropFilter: "blur(12px)",
        }}
      >
        <button
          type="button"
          data-ocid="pronunciation.back_button"
          onClick={() => {
            stopRecognition();
            router.navigate({ to: "/home" });
          }}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-smooth active:scale-90"
          style={{ background: "oklch(0.18 0.04 264)" }}
          aria-label="Go back"
        >
          <span className="text-xl text-foreground">←</span>
        </button>
        <div>
          <h1 className="font-display font-black text-lg text-foreground leading-tight">
            Pronunciation
          </h1>
          <p className="text-xs font-body text-muted-foreground">
            Say the word out loud
          </p>
        </div>
      </header>

      {/* No Speech API fallback */}
      {!hasSpeechAPI && (
        <div
          className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center"
          data-ocid="pronunciation.no_speech_state"
        >
          <span className="text-6xl">🎤</span>
          <p className="font-display font-bold text-xl text-foreground">
            Voice recording not supported
          </p>
          <p className="text-sm font-body text-muted-foreground max-w-xs">
            Your browser does not support voice recording. Try Chrome or Safari.
          </p>
          <button
            type="button"
            data-ocid="pronunciation.skip_button"
            onClick={advanceWord}
            className="px-8 py-3 rounded-2xl font-display font-bold text-base transition-smooth active:scale-95"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.82 0.17 84), oklch(0.70 0.17 84))",
              color: "oklch(0.08 0 0)",
            }}
          >
            Next word →
          </button>
        </div>
      )}

      {/* Main content */}
      {hasSpeechAPI && (
        <div className="flex-1 flex flex-col items-center justify-between px-6 py-8 gap-6">
          {/* Word card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current.word}
              initial={{ y: -20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-4 relative overflow-hidden"
              style={{
                background: "oklch(0.13 0.03 264)",
                border: "1.5px solid oklch(0.82 0.17 84 / 0.25)",
                boxShadow:
                  "0 0 40px oklch(0.82 0.17 84 / 0.08), 0 8px 32px oklch(0 0 0 / 0.5)",
              }}
              data-ocid="pronunciation.word_card"
            >
              {/* shimmer overlay */}
              <div
                className="absolute inset-0 pointer-events-none rounded-3xl"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(1 0 0 / 0.05) 0%, transparent 60%)",
                }}
              />
              <span
                className="text-8xl relative z-10"
                role="img"
                aria-label={current.word}
              >
                {current.emoji}
              </span>
              <h2
                className="text-4xl font-display font-black relative z-10"
                style={{
                  background:
                    "linear-gradient(to right, oklch(0.95 0.18 84), oklch(0.82 0.17 84))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {current.word}
              </h2>

              {/* Listen button — always visible so child can hear it first */}
              <button
                type="button"
                data-ocid="pronunciation.listen_button"
                onClick={handleListen}
                className="flex items-center gap-2 px-5 py-2 rounded-xl font-body text-sm font-bold transition-smooth active:scale-95 relative z-10"
                style={{
                  background: "oklch(0.18 0.04 264)",
                  border: "1px solid oklch(0.82 0.17 84 / 0.3)",
                  color: "oklch(0.82 0.17 84)",
                }}
              >
                <span>🔊</span> Hear it
              </button>
            </motion.div>
          </AnimatePresence>

          {/* Status message */}
          <AnimatePresence mode="wait">
            {state === "correct" && (
              <motion.div
                key="correct"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 20 }}
                className="relative flex flex-col items-center gap-2"
                data-ocid="pronunciation.success_state"
              >
                {/* Star burst */}
                <div className="relative w-20 h-20 flex items-center justify-center">
                  {STAR_ANGLES.map((angle) => (
                    <motion.div
                      key={angle}
                      initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                      animate={{
                        x: Math.cos((angle * Math.PI) / 180) * 40,
                        y: Math.sin((angle * Math.PI) / 180) * 40,
                        opacity: 0,
                        scale: 1.5,
                      }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="absolute text-xl"
                      style={{ color: "oklch(0.88 0.18 84)" }}
                    >
                      ⭐
                    </motion.div>
                  ))}
                  <span className="text-5xl z-10">🎉</span>
                </div>
                <p
                  className="font-display font-black text-2xl"
                  style={{ color: "oklch(0.88 0.18 84)" }}
                >
                  Great job! ⭐
                </p>
                {spokenText ? (
                  <p className="text-sm font-body text-muted-foreground">
                    You said: <em>"{spokenText}"</em>
                  </p>
                ) : null}
              </motion.div>
            )}

            {state === "mismatch" && (
              <motion.div
                key="mismatch"
                initial={{ x: -8, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 400 }}
                className="flex flex-col items-center gap-3"
                data-ocid="pronunciation.error_state"
              >
                <p
                  className="font-display font-bold text-xl text-center"
                  style={{ color: "oklch(0.72 0.28 15)" }}
                >
                  Try again! 🎙️
                </p>
                {spokenText ? (
                  <p className="text-sm font-body text-muted-foreground text-center">
                    I heard: <em>"{spokenText}"</em>
                  </p>
                ) : null}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    data-ocid="pronunciation.retry_listen_button"
                    onClick={handleListen}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-body text-sm font-bold transition-smooth active:scale-95"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.82 0.17 84), oklch(0.70 0.17 84))",
                      color: "oklch(0.08 0 0)",
                    }}
                  >
                    🔊 Listen
                  </button>
                  <button
                    type="button"
                    data-ocid="pronunciation.skip_word_button"
                    onClick={advanceWord}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-body text-sm font-bold transition-smooth active:scale-95"
                    style={{
                      background: "oklch(0.18 0.04 264)",
                      border: "1px solid oklch(0.82 0.17 84 / 0.25)",
                      color: "oklch(0.82 0.17 84)",
                    }}
                  >
                    Skip →
                  </button>
                </div>
              </motion.div>
            )}

            {(state === "idle" || state === "listening") && (
              <motion.div
                key="prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                {state === "listening" ? (
                  <motion.p
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{
                      duration: 1.2,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                    className="font-display font-bold text-lg"
                    style={{ color: "oklch(0.72 0.28 15)" }}
                    data-ocid="pronunciation.listening_state"
                  >
                    🎙️ Listening...
                  </motion.p>
                ) : (
                  <p className="text-sm font-body text-muted-foreground">
                    Tap the mic and say the word
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Record button */}
          <div className="flex flex-col items-center gap-4">
            <motion.button
              type="button"
              data-ocid="pronunciation.record_button"
              onClick={startListening}
              disabled={state === "listening" || state === "correct"}
              whileTap={{ scale: 0.92 }}
              className="relative flex items-center justify-center rounded-full transition-smooth focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                width: 96,
                height: 96,
                background:
                  state === "listening"
                    ? "linear-gradient(135deg, oklch(0.72 0.28 15), oklch(0.55 0.28 15))"
                    : "linear-gradient(135deg, oklch(0.82 0.17 84), oklch(0.68 0.17 84))",
                boxShadow:
                  state === "listening"
                    ? "0 0 0 12px oklch(0.72 0.28 15 / 0.18), 0 0 40px oklch(0.72 0.28 15 / 0.35)"
                    : "0 0 0 8px oklch(0.82 0.17 84 / 0.12), 0 0 24px oklch(0.82 0.17 84 / 0.25)",
              }}
              aria-label={
                state === "listening" ? "Listening..." : "Start recording"
              }
            >
              {/* Pulsing ring when listening */}
              {state === "listening" && (
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{
                    duration: 1.4,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: "oklch(0.72 0.28 15 / 0.35)" }}
                />
              )}
              <span className="text-4xl z-10" role="img" aria-hidden="true">
                🎤
              </span>
            </motion.button>

            {/* Skip word at bottom */}
            {state === "idle" && (
              <button
                type="button"
                data-ocid="pronunciation.next_word_button"
                onClick={advanceWord}
                className="text-xs font-body underline transition-smooth active:opacity-70"
                style={{ color: "oklch(0.55 0.05 264)" }}
              >
                Skip this word
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
