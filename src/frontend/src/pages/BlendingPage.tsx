import { useRouter } from "@tanstack/react-router";
import { CheckCircle2, ChevronLeft, ChevronRight, XCircle } from "lucide-react";
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
  playTapSound,
  playWrongSound,
} from "../utils/audio";

type Status = "idle" | "correct" | "wrong";

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
      setChosen(next);

      if (next.length === taskSounds.length) {
        const assembled = next.join("").toLowerCase().replace(/\s/g, "");
        const target = task.word.toLowerCase();
        const isOk = assembled === target;

        if (isOk) {
          playCorrectSound();
          playCelebrationSound();
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
              tasksCompleted: Array.from(
                new Set([...existing.tasksCompleted, task.id]),
              ),
              score: existing.score + 1,
              completed: true,
              lastVisited: Date.now(),
            };
            const totalDone = Object.values({
              ...prev.blending,
              [task.id]: updated,
            }).filter((b) => b.tasksCompleted.length > 0).length;
            return {
              ...prev,
              blending: { ...prev.blending, [task.id]: updated },
              totalStars: Math.max(prev.totalStars, totalDone),
            };
          });
        } else {
          playWrongSound();
          setStatus("wrong");
          setTimeout(() => {
            setChosen([]);
            setStatus("idle");
          }, 1000);
        }
      }
    },
    [chosen, status, task, taskSounds, letter, updateProgress],
  );

  const removeChosen = (i: number) => {
    if (status !== "idle") return;
    setChosen((c) => c.filter((_, idx) => idx !== i));
  };

  const nextTask = () => {
    playTapSound();
    setTaskIdx((i) => (i + 1) % letter.blendingTasks.length);
    setChosen([]);
    setStatus("idle");
  };

  const changeLetter = (idx: number) => {
    playTapSound();
    setLetterIdx(idx);
    setTaskIdx(0);
    setChosen([]);
    setStatus("idle");
  };

  const isCompleted =
    (progress?.blending[task.id]?.tasksCompleted.length ?? 0) > 0;

  if (!profile) {
    router.navigate({ to: "/" });
    return null;
  }

  return (
    <Layout title="Blending" headerColor="oklch(0.45 0.24 264)">
      <div className="px-5 py-5 flex flex-col gap-4">
        {/* Progress */}
        <ProgressBar
          value={(completedCount / TOTAL_BLENDING_TASKS) * 100}
          color="blue"
          showLabel
          label={`${completedCount}/${TOTAL_BLENDING_TASKS} tasks`}
        />

        {/* Letter tabs */}
        <div
          className="flex gap-1.5 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
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
                className={`flex-shrink-0 w-9 h-9 rounded-xl text-sm font-display font-black transition-smooth active:scale-95 relative ${
                  i === letterIdx
                    ? "gradient-blue text-card shadow-playful"
                    : done === 10
                      ? "bg-[oklch(0.72_0.27_131/0.25)] text-[oklch(0.72_0.27_131)]"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {l.letter}
                {done > 0 && done < 10 && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-bold text-[oklch(0.08_0_0)]"
                    style={{ background: "oklch(0.82 0.17 84)" }}
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
            {isCompleted && (
              <span className="text-[oklch(0.72_0.27_131)] text-sm font-bold">
                ✅
              </span>
            )}
            <StarBadge count={completedCount} size="sm" />
          </div>
        </div>

        {/* Word card */}
        <motion.div
          key={task.id}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`letter-card flex items-center gap-4 ${
            letter.color === "red"
              ? "gradient-red"
              : letter.color === "blue"
                ? "gradient-blue"
                : letter.color === "green"
                  ? "gradient-green"
                  : letter.color === "yellow"
                    ? "gradient-yellow"
                    : "gradient-purple"
          } text-card`}
          style={{
            boxShadow:
              "0 8px 32px oklch(0 0 0 / 0.5), 0 0 0 1px oklch(1 0 0 / 0.1) inset",
          }}
        >
          <span className="text-6xl">{task.emoji}</span>
          <div>
            <p className="text-xs font-body opacity-80">Build this word:</p>
            <p className="text-3xl font-display font-black">{task.word}</p>
            <p className="text-xs opacity-70 font-body">{task.hint}</p>
          </div>
        </motion.div>

        {/* Answer slots */}
        <div className="flex items-center justify-center gap-3 min-h-[60px] flex-wrap">
          {task.sounds.map((sound, slotI) => {
            const c = chosen[slotI];
            return (
              <motion.button
                key={`slot-${task.id}-${slotI}-${sound}`}
                type="button"
                data-ocid={`blending.slot.${slotI + 1}`}
                onClick={() => c && removeChosen(slotI)}
                animate={status === "wrong" ? { x: [0, -8, 8, -5, 5, 0] } : {}}
                transition={{ duration: 0.4 }}
                className={`min-w-[56px] h-12 px-3 rounded-2xl border-2 flex items-center justify-center font-display font-bold text-base transition-smooth ${
                  status === "correct"
                    ? "border-[oklch(0.72_0.27_131)] bg-[oklch(0.72_0.27_131/0.2)] text-[oklch(0.72_0.27_131)]"
                    : status === "wrong"
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : c
                        ? "gradient-blue text-card border-transparent shadow-playful"
                        : "border-dashed border-border bg-muted text-muted-foreground"
                }`}
              >
                {c ?? "?"}
              </motion.button>
            );
          })}

          <AnimatePresence>
            {status !== "idle" && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                {status === "correct" ? (
                  <CheckCircle2 className="w-8 h-8 text-[oklch(0.72_0.27_131)]" />
                ) : (
                  <XCircle className="w-8 h-8 text-destructive" />
                )}
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
                    ? "opacity-30 cursor-not-allowed bg-muted text-foreground"
                    : letter.color === "red"
                      ? "gradient-red text-card shadow-playful"
                      : letter.color === "blue"
                        ? "gradient-blue text-card shadow-playful"
                        : letter.color === "green"
                          ? "gradient-green text-card shadow-playful"
                          : letter.color === "yellow"
                            ? "gradient-yellow text-card shadow-playful"
                            : "gradient-purple text-card shadow-playful"
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
            onClick={() => {
              playTapSound();
              setTaskIdx(
                (i) =>
                  (i - 1 + letter.blendingTasks.length) %
                  letter.blendingTasks.length,
              );
              setChosen([]);
              setStatus("idle");
            }}
            className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center active:scale-95 transition-smooth hover:border-[oklch(0.82_0.17_84/0.4)]"
            aria-label="Previous"
          >
            <ChevronLeft className="w-7 h-7 text-foreground" />
          </button>
          {status === "correct" ? (
            <button
              type="button"
              data-ocid="blending.next_task_button"
              onClick={nextTask}
              className="flex-1 h-14 rounded-2xl gradient-green text-card font-display font-bold text-lg active:scale-95 transition-smooth shadow-playful"
            >
              Next! →
            </button>
          ) : (
            <div className="flex-1" />
          )}
          <button
            type="button"
            data-ocid="blending.next_button"
            onClick={nextTask}
            className="w-14 h-14 rounded-2xl gradient-blue flex items-center justify-center active:scale-95 transition-smooth shadow-playful"
            aria-label="Next"
          >
            <ChevronRight className="w-7 h-7 text-card" />
          </button>
        </div>
      </div>
    </Layout>
  );
}
