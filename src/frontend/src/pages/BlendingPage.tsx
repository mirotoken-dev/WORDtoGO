import { useRouter } from "@tanstack/react-router";
import { CheckCircle2, ChevronLeft, ChevronRight, Shuffle, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import Layout from "../components/Layout";
import ProgressBar from "../components/ProgressBar";
import StarBadge from "../components/StarBadge";
import { PHONICS_DATA, TOTAL_BLENDING_TASKS } from "../data/phonicsData";
import { useAppStore } from "../store/useAppStore";
import {
  playCelebrationSound,
  playCorrectSound,
  playLetterPhonetic,
  playTapSound,
  playWrongSound,
  speakWord,
} from "../utils/audio";
import { getArabicHint, getUILabel } from "../data/arabicTranslations";

type Status = "idle" | "correct" | "wrong";

/** Flat list of every blending task across all letters */
const ALL_TASKS: { letterIdx: number; taskIdx: number }[] = PHONICS_DATA.flatMap(
  (l, li) => l.blendingTasks.map((_, ti) => ({ letterIdx: li, taskIdx: ti })),
);

function pickRandomTask(
  excludeLetterIdx?: number,
  excludeTaskIdx?: number,
): { letterIdx: number; taskIdx: number } {
  const pool =
    excludeLetterIdx !== undefined && excludeTaskIdx !== undefined
      ? ALL_TASKS.filter((t) => t.letterIdx !== excludeLetterIdx || t.taskIdx !== excludeTaskIdx)
      : ALL_TASKS;
  return pool[Math.floor(Math.random() * pool.length)] ?? ALL_TASKS[0];
}

export default function BlendingPage() {
  const router = useRouter();
  const { profiles, activeProfileId, progress, updateProgress } = useAppStore();
  const profile = profiles.find((p) => p.id === activeProfileId) ?? null;

  const [letterIdx, setLetterIdx] = useState(0);
  const [taskIdx, setTaskIdx] = useState(0);
  const [chosen, setChosen] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");

  const letter = PHONICS_DATA[letterIdx];
  const task = letter.blendingTasks[taskIdx];
  const completedCount = Object.values(progress?.blending ?? {}).filter(
    (b) => b.tasksCompleted.length > 0,
  ).length;

  const taskSounds = task.sounds;
  const shuffled = useMemo(
    () => [...taskSounds].sort(() => Math.random() - 0.5),
    [taskSounds],
  );

  const handleSound = useCallback(
    (sound: string) => {
      if (status !== "idle") return;
      playTapSound();
      const next = [...chosen, sound];
      const isLastTile = next.length === taskSounds.length;

      if (!isLastTile) {
        // Only play the individual letter phonetic for non-final tiles
        void playLetterPhonetic(sound);
      }

      setChosen(next);

      if (isLastTile) {
        const assembled = next.join("").toLowerCase().replace(/\s/g, "");
        const target = task.word.toLowerCase();
        const isOk = assembled === target;

        if (isOk) {
          playCorrectSound();
          playCelebrationSound();
          // Speak the full word immediately — no letter phonetic delay
          speakWord(task.word);
          setStatus("correct");
          updateProgress((prev) => {
            const existing = prev.blending[task.id] ?? {
              letterId: letter.letter,
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
            const totalDone = Object.values({ ...prev.blending, [task.id]: updated }).filter(
              (b) => b.tasksCompleted.length > 0,
            ).length;
            return {
              ...prev,
              blending: { ...prev.blending, [task.id]: updated },
              totalStars: Math.max(prev.totalStars, totalDone),
            };
          });
        } else {
          playWrongSound();
          setStatus("wrong");
          setTimeout(() => { setChosen([]); setStatus("idle"); }, 1000);
        }
      }
    },
    [chosen, status, task, taskSounds, letter, updateProgress],
  );

  const removeChosen = (i: number) => {
    if (status !== "idle") return;
    setChosen((c) => c.filter((_, idx) => idx !== i));
  };

  /** Next within the same letter (sequential) */
  const nextSameLetter = () => {
    playTapSound();
    setTaskIdx((i) => (i + 1) % letter.blendingTasks.length);
    setChosen([]);
    setStatus("idle");
  };

  /** Random task from anywhere */
  const nextRandom = () => {
    playTapSound();
    const next = pickRandomTask(letterIdx, taskIdx);
    setLetterIdx(next.letterIdx);
    setTaskIdx(next.taskIdx);
    setChosen([]);
    setStatus("idle");
  };

  const changeLetter = (idx: number) => {
    playTapSound();
    setLetterIdx(idx);
    // Pick a random task from the newly selected letter
    const letterTasks = PHONICS_DATA[idx].blendingTasks;
    setTaskIdx(Math.floor(Math.random() * letterTasks.length));
    setChosen([]);
    setStatus("idle");
  };

  const isCompleted = (progress?.blending[task.id]?.tasksCompleted.length ?? 0) > 0;

  if (!profile) { router.navigate({ to: "/" }); return null; }

  return (
    <Layout title={getUILabel("Blending")} headerColor="oklch(0.44 0.22 260)">
      <div className="px-5 py-5 flex flex-col gap-4">

        {/* Progress */}
        <ProgressBar
          value={(completedCount / TOTAL_BLENDING_TASKS) * 100}
          color="blue"
          showLabel
          label={`${completedCount}/${TOTAL_BLENDING_TASKS} tasks`}
        />

        {/* Letter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {PHONICS_DATA.map((l, i) => {
            const done = l.blendingTasks.filter(
              (t) => (progress?.blending[t.id]?.tasksCompleted.length ?? 0) > 0,
            ).length;
            return (
              <button
                key={l.letter}
                type="button"
                data-ocid={`blending.letter_tab.${i + 1}`}
                onClick={() => changeLetter(i)}
                className={`flex-shrink-0 w-9 h-9 rounded-xl text-sm font-display font-black transition-smooth active:scale-95 relative border ${
                  i === letterIdx
                    ? "gradient-blue text-white border-transparent shadow-playful"
                    : done === 10
                      ? "bg-[oklch(0.94_0.06_145)] text-[oklch(0.48_0.22_145)] border-[oklch(0.85_0.10_145)]"
                      : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {l.letter}
                {done > 0 && done < 10 && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-bold text-white"
                    style={{ background: "oklch(0.62 0.22 145)" }}
                  >
                    {done}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Task header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-body text-muted-foreground">
            {letter.letter} — Task {taskIdx + 1}/{letter.blendingTasks.length}
          </span>
          <div className="flex items-center gap-2">
            {isCompleted && <span className="text-[oklch(0.48_0.22_145)] text-sm font-bold">✅</span>}
            <StarBadge count={completedCount} size="sm" />
          </div>
        </div>

        {/* Word card */}
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
          <span className="text-6xl relative z-10">{task.emoji}</span>
          <div className="relative z-10">
            <p className="text-xs font-body opacity-80">{getUILabel("Build this word")}</p>
            <p className="text-3xl font-display font-black">{task.word}</p>
            <p className="text-xs opacity-70 font-body">{task.hint}</p>
            {task.arabicHint && (
              <p className="text-sm font-[var(--font-arabic)] opacity-90 mt-0.5" dir="rtl">{task.arabicHint}</p>
            )}
          </div>
        </motion.div>

        {/* Answer slots */}
        <div className="flex items-center justify-center gap-3 min-h-[72px] flex-wrap">
          {task.sounds.map((sound, slotI) => {
            const c = chosen[slotI];
            return (
              <motion.button
                key={`slot-${task.id}-${slotI}-${sound}`}
                type="button"
                data-ocid={`blending.slot.${slotI + 1}`}
                onClick={() => c && removeChosen(slotI)}
                animate={status === "wrong" ? { x: [0, -10, 10, -7, 7, 0] } : {}}
                transition={{ duration: 0.35 }}
                className={`relative min-w-[60px] h-14 px-3 rounded-2xl border-2 flex items-center justify-center font-display font-bold text-lg transition-smooth ${
                  status === "correct"
                    ? "border-[oklch(0.62_0.22_145)] bg-[oklch(0.94_0.06_145)] text-[oklch(0.48_0.22_145)]"
                    : status === "wrong"
                      ? "border-destructive bg-[oklch(0.98_0.03_25)] text-destructive"
                      : c
                        ? "gradient-blue text-white border-transparent"
                        : "border-dashed border-[oklch(0.80_0.01_260)] bg-[oklch(0.97_0.005_260)]"
                }`}
                style={{
                  boxShadow: status === "correct"
                    ? "0 4px 0 0 oklch(0.62 0.22 145 / 0.35)"
                    : status === "wrong"
                      ? "0 4px 0 0 oklch(0.60 0.24 25 / 0.35)"
                      : c
                        ? "0 4px 0 0 oklch(0.46 0.19 222)"
                        : "none",
                }}
              >
                {c ?? ""}
                {/* Red X overlay when wrong */}
                {status === "wrong" && c && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive flex items-center justify-center text-white text-xs font-black leading-none shadow-sm"
                  >
                    ✕
                  </motion.span>
                )}
              </motion.button>
            );
          })}

          <AnimatePresence mode="wait">
            {status !== "idle" && (
              <motion.span
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
              >
                {status === "correct"
                  ? <CheckCircle2 className="w-10 h-10 text-[oklch(0.62_0.22_145)]" />
                  : <XCircle className="w-10 h-10 text-destructive" />}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Sound tiles */}
        <div className="flex flex-wrap gap-2 justify-center">
          {shuffled.map((s, i) => {
            const usedCount = chosen.filter((c) => c === s).length;
            const totalInTask = task.sounds.filter((x) => x === s).length;
            const used = usedCount >= totalInTask;
            return (
              <button
                key={`sound-${task.id}-${s}-${i}`}
                type="button"
                data-ocid={`blending.syllable_button.${i + 1}`}
                onClick={() => !used && handleSound(s)}
                disabled={used || status !== "idle"}
                className={`btn-lg btn-tap font-display font-black text-xl ${
                  used || status !== "idle"
                    ? "opacity-30 cursor-not-allowed bg-muted text-foreground border border-border"
                    : letter.color === "red" ? "gradient-red text-white shadow-playful"
                    : letter.color === "blue" ? "gradient-blue text-white shadow-playful"
                    : letter.color === "green" ? "gradient-green text-white shadow-playful"
                    : letter.color === "yellow" ? "gradient-yellow text-white shadow-playful"
                    : "gradient-purple text-white shadow-playful"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>

        {/* Nav */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-ocid="blending.prev_button"
            onClick={() => { playTapSound(); setTaskIdx((i) => (i - 1 + letter.blendingTasks.length) % letter.blendingTasks.length); setChosen([]); setStatus("idle"); }}
            className="w-12 h-12 rounded-2xl bg-white border border-border flex items-center justify-center active:scale-95 transition-smooth hover:bg-muted"
            aria-label={getUILabel("Previous")}
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          {status === "correct" ? (
            <button
              type="button"
              data-ocid="blending.next_random_button"
              onClick={nextRandom}
              className="flex-1 h-12 rounded-2xl gradient-green text-white font-display font-bold text-base active:scale-95 transition-smooth shadow-playful flex items-center justify-center gap-2"
            >
              <Shuffle className="w-5 h-5" />
              {getUILabel("Next!")}
            </button>
          ) : (
            <button
              type="button"
              data-ocid="blending.shuffle_button"
              onClick={nextRandom}
              className="flex-1 h-12 rounded-2xl gradient-indigo text-white font-display font-bold text-base active:scale-95 transition-smooth shadow-playful flex items-center justify-center gap-2"
            >
              <Shuffle className="w-5 h-5" />
              {getUILabel("Shuffle")}
            </button>
          )}
          <button
            type="button"
            data-ocid="blending.next_button"
            onClick={nextSameLetter}
            className="w-12 h-12 rounded-2xl gradient-blue flex items-center justify-center active:scale-95 transition-smooth shadow-playful"
            aria-label={getUILabel("Next")}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </Layout>
  );
}
