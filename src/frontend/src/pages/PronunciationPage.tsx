import { ArrowLeft } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PHONICS_DATA } from "../data/phonicsData";
import { getArabicWord, getUILabel } from "../data/arabicTranslations";
import {
  playCelebrationSound,
  playSuccessSound,
  prewarmSpeech,
  preloadWordAudio,
  speakWord,
} from "../utils/audio";

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

const STAR_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export default function PronunciationPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(() => pickRandom());
  const [state, setState] = useState<RecognitionState>("idle");
  const [spokenText, setSpokenText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [micError, setMicError] = useState<string | null>(null);
  const [hasSpeechAPI] = useState(() => {
    return (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    );
  });

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-warm speech synthesis (fallback) and preload the current word's MP3
  useEffect(() => {
    prewarmSpeech();
  }, []);

  useEffect(() => {
    preloadWordAudio(current.word);
  }, [current.word]);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { }
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
    setInterimText("");
    setMicError(null);
  }, []);

  const startListening = useCallback(() => {
    if (state === "listening" || state === "correct") return;
    stopRecognition();
    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    // biome-ignore lint/suspicious/noExplicitAny: SpeechRecognition constructor
    const recognition = new (SpeechRecognition as any)();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;
    recognition.onstart = () => {
      setMicError(null);
      setInterimText("");
      setSpokenText("");
      setState("listening");
    };
    // biome-ignore lint/suspicious/noExplicitAny: SpeechRecognition event shape
    recognition.onresult = (event: any) => {
      const final: string[] = [];
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          for (let j = 0; j < event.results[i].length; j++) {
            final.push(event.results[i][j].transcript);
          }
        } else {
          interim = event.results[i][0]?.transcript ?? "";
        }
      }
      setInterimText(interim);
      if (final.length === 0) return;
      const normalize = (s: string) => s.toLowerCase().trim().replace(/[.,!?;:]$/, "");
      const targetNorm = normalize(current.word);
      const best = final.find((r) => {
        const rNorm = normalize(r);
        if (rNorm === targetNorm) return true;
        return normalizedSimilarity(current.word, r) >= 0.78;
      });
      const topTranscript = final[0] ?? "";
      setSpokenText(topTranscript);
      setInterimText("");
      if (best !== undefined) {
        setState("correct");
        playSuccessSound();
        setTimeout(() => playCelebrationSound(), 300);
        advanceTimerRef.current = setTimeout(() => { advanceWord(); }, 1800);
      } else {
        setState("mismatch");
      }
    };
    // biome-ignore lint/suspicious/noExplicitAny: SpeechRecognition error event
    recognition.onerror = (e: any) => {
      const code = e.error as string;
      const msg =
        code === "no-speech" ? "No speech detected. Tap the mic again and speak louder."
          : code === "audio-capture" ? "Microphone not available. Check your mic permissions."
          : code === "not-allowed" ? "Microphone access blocked. Allow mic in your browser settings."
          : code === "network" ? "Network error. Check your connection and try again."
          : "Something went wrong. Tap the mic to try again.";
      setMicError(msg);
      setInterimText("");
      setState("idle");
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
        setState((prev) => {
          if (prev === "listening") {
            if (interimText && !spokenText) return "mismatch";
            return "idle";
          }
          return prev;
        });
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
  }, [state, current.word, stopRecognition, advanceWord]);

  const handleListen = () => speakWord(current.word);

  return (
    <div className="min-h-screen flex flex-col bg-[oklch(0.14_0.025_264)]">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-4 border-b-2 border-[oklch(0.25_0.04_264)] bg-[oklch(0.14_0.025_264)]">
        <button
          type="button"
          data-ocid="pronunciation.back_button"
          onClick={() => {
            stopRecognition();
            router.navigate({ to: "/home" });
          }}
          className="w-11 h-11 rounded-2xl bg-white/15 border-2 border-white/20 flex items-center justify-center active:scale-95 transition-smooth hover:bg-white/25"
          aria-label={getUILabel("Go back")}
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="font-display font-black text-lg text-white leading-tight">
            {getUILabel("Pronunciation")}
          </h1>
          <p className="text-xs font-body text-white/55">
            {getUILabel("Say the word out loud")}
          </p>
        </div>
      </header>

      {/* No Speech API fallback */}
      {!hasSpeechAPI && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center" data-ocid="pronunciation.no_speech_state">
          <span className="text-7xl float inline-block">🎤</span>
          <p className="font-display font-bold text-xl text-white">
            {getUILabel("Voice recording not supported")}
          </p>
          <p className="text-sm font-body text-white/55 max-w-xs">
            {getUILabel("Your browser does not support voice recording. Try Chrome or Safari.")}
          </p>
          <button
            type="button"
            data-ocid="pronunciation.skip_button"
            onClick={advanceWord}
            className="press-btn press-gold px-8 h-14 text-base"
          >
            {getUILabel("Next word")} →
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
                background: "oklch(0.20 0.04 264)",
                border: "2.5px solid oklch(0.30 0.06 264)",
                boxShadow: "0 6px 0 0 oklch(0.10 0.02 264), 0 8px 32px oklch(0 0 0 / 0.4)",
              }}
              data-ocid="pronunciation.word_card"
            >
              <div className="absolute inset-0 pointer-events-none rounded-3xl"
                style={{ background: "linear-gradient(135deg, oklch(1 0 0 / 0.06) 0%, transparent 60%)" }} />
              <span className="text-8xl relative z-10 float inline-block" role="img" aria-label={current.word}>
                {current.emoji}
              </span>
              <h2
                className="text-5xl font-display font-black relative z-10"
                style={{
                  background: "linear-gradient(to right, oklch(0.92 0.20 88), oklch(0.78 0.18 84))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {current.word}
              </h2>
              {(() => {
                const ar = getArabicWord(current.word);
                return ar ? (
                  <p className="text-xl font-[var(--font-arabic)] relative z-10 text-white/70" dir="rtl">{ar}</p>
                ) : null;
              })()}
              <button
                type="button"
                data-ocid="pronunciation.listen_button"
                onClick={handleListen}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-body text-sm font-bold active:scale-95 transition-smooth relative z-10 border-2"
                style={{
                  background: "oklch(0.26 0.06 264)",
                  borderColor: "oklch(0.40 0.08 264)",
                  color: "oklch(0.86 0.21 88)",
                  boxShadow: "0 3px 0 0 oklch(0.10 0.02 264)",
                }}
              >
                <span>🔊</span> {getUILabel("Hear it")}
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
                <div className="relative w-20 h-20 flex items-center justify-center">
                  {STAR_ANGLES.map((angle) => (
                    <motion.div
                      key={angle}
                      initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                      animate={{
                        x: Math.cos((angle * Math.PI) / 180) * 44,
                        y: Math.sin((angle * Math.PI) / 180) * 44,
                        opacity: 0,
                        scale: 1.5,
                      }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="absolute text-xl"
                    >
                      ⭐
                    </motion.div>
                  ))}
                  <span className="text-5xl z-10">🎉</span>
                </div>
                <p className="font-display font-black text-2xl text-[oklch(0.86_0.21_88)]">
                  {getUILabel("Great job!")} ⭐
                </p>
                {spokenText ? (
                  <p className="text-sm font-body text-white/55">
                    {getUILabel("You said:")} <em>"{spokenText}"</em>
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
                <p className="font-display font-bold text-xl text-center text-[oklch(0.72_0.26_25)]">
                  {getUILabel("Try again!")} 🎙️
                </p>
                {spokenText ? (
                  <p className="text-sm font-body text-white/55 text-center">
                    {getUILabel("I heard:")} <em>"{spokenText}"</em>
                  </p>
                ) : null}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    data-ocid="pronunciation.retry_listen_button"
                    onClick={handleListen}
                    className="press-btn press-gold px-5 h-11 text-sm"
                  >
                    🔊 {getUILabel("Listen")}
                  </button>
                  <button
                    type="button"
                    data-ocid="pronunciation.skip_word_button"
                    onClick={advanceWord}
                    className="press-btn press-outline px-5 h-11 text-sm"
                    style={{
                      background: "oklch(0.20 0.04 264)",
                      borderColor: "oklch(0.35 0.06 264)",
                      color: "oklch(0.75 0.06 264)",
                      boxShadow: "0 3px 0 0 oklch(0.10 0.02 264)",
                    }}
                  >
                    {getUILabel("Skip")} →
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
                className="text-center flex flex-col items-center gap-2"
              >
                {state === "listening" ? (
                  <>
                    <motion.p
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY }}
                      className="font-display font-bold text-lg text-[oklch(0.72_0.26_25)]"
                      data-ocid="pronunciation.listening_state"
                    >
                      🎙️ {getUILabel("Listening...")}
                    </motion.p>
                    {interimText && (
                      <p className="text-sm font-body text-white/55 italic" data-ocid="pronunciation.interim_text">
                        "{interimText}"
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm font-body text-white/55">
                      {getUILabel("Tap the mic and say the word")}
                    </p>
                    {micError && (
                      <p className="text-xs font-body text-destructive bg-destructive/10 px-3 py-1.5 rounded-2xl border border-destructive/25" data-ocid="pronunciation.mic_error">
                        {micError}
                      </p>
                    )}
                  </>
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
                width: 100,
                height: 100,
                background: state === "listening"
                  ? "linear-gradient(135deg, oklch(0.64 0.26 25), oklch(0.50 0.24 25))"
                  : "linear-gradient(135deg, oklch(0.86 0.21 88), oklch(0.70 0.18 84))",
                boxShadow: state === "listening"
                  ? "0 6px 0 0 oklch(0.40 0.22 25), 0 0 40px oklch(0.64 0.26 25 / 0.4)"
                  : "0 6px 0 0 oklch(0.60 0.17 78), 0 0 28px oklch(0.86 0.21 88 / 0.3)",
              }}
              aria-label={state === "listening" ? getUILabel("Listening...") : getUILabel("Start recording")}
            >
              {state === "listening" && (
                <motion.div
                  animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: "oklch(0.64 0.26 25 / 0.3)" }}
                />
              )}
              <span className="text-4xl z-10" role="img" aria-hidden="true">🎤</span>
            </motion.button>

            {state === "idle" && (
              <button
                type="button"
                data-ocid="pronunciation.next_word_button"
                onClick={advanceWord}
                className="text-xs font-body underline active:opacity-70 transition-smooth text-white/40 hover:text-white/60"
              >
                {getUILabel("Skip this word")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
