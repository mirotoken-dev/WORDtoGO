import { useRouter } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect } from "react";
import Layout from "../components/Layout";
import ProgressBar from "../components/ProgressBar";
import StarBadge from "../components/StarBadge";
import { PHONICS_DATA, TOTAL_BLENDING_TASKS } from "../data/phonicsData";
import { useAppStore } from "../store/useAppStore";
import { playTapSound } from "../utils/audio";

export default function ProgressPage() {
  const router = useRouter();
  const { profiles, activeProfileId, progress, resetProgress } = useAppStore();
  const profile = profiles.find((p) => p.id === activeProfileId) ?? null;

  useEffect(() => {
    if (!profile) router.navigate({ to: "/" });
  }, [profile, router]);

  if (!profile) return null;

  const flashcardDone = Object.values(progress?.flashcards ?? {}).filter(
    (f) => f.completed,
  ).length;
  const blendingDone = Object.values(progress?.blending ?? {}).filter(
    (b) => b.tasksCompleted.length > 0,
  ).length;
  const tracingDone = Object.values(progress?.tracing ?? {}).filter(
    (t) => t.completed,
  ).length;

  const handleReset = () => {
    playTapSound();
    if (window.confirm("Reset all progress? This cannot be undone.")) {
      resetProgress();
    }
  };

  return (
    <Layout title="Progress">
      <div className="px-5 py-6 flex flex-col gap-6">
        {/* Profile Card — luxury gold gradient */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="gradient-gold text-[oklch(0.08_0_0)] rounded-3xl p-5 flex items-center gap-4"
          style={{
            boxShadow:
              "0 8px 32px oklch(0.82 0.17 84 / 0.3), 0 0 0 1px oklch(1 0 0 / 0.15) inset",
          }}
        >
          <div className="text-6xl">{profile.avatar}</div>
          <div>
            <p className="text-2xl font-display font-black">{profile.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <StarBadge count={progress?.totalStars ?? 0} size="md" />
              <span className="text-sm font-body opacity-80">total stars</span>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Letters",
              value: flashcardDone,
              max: 26,
              color: "gradient-red",
              emoji: "🃏",
            },
            {
              label: "Words",
              value: blendingDone,
              max: TOTAL_BLENDING_TASKS,
              color: "gradient-blue",
              emoji: "🎵",
            },
            {
              label: "Tracing",
              value: tracingDone,
              max: 26,
              color: "gradient-green",
              emoji: "✏️",
            },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              className={`${stat.color} text-card rounded-2xl p-3 text-center relative overflow-hidden`}
              style={{
                boxShadow:
                  "0 4px 20px oklch(0 0 0 / 0.5), 0 0 0 1px oklch(1 0 0 / 0.1) inset",
              }}
              whileHover={{ scale: 1.03 }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(1 0 0 / 0.08) 0%, transparent 60%)",
                }}
              />
              <div className="text-3xl relative z-10">{stat.emoji}</div>
              <p className="text-2xl font-display font-black relative z-10">
                {stat.value}
              </p>
              <p className="text-xs font-body opacity-80 relative z-10">
                /{stat.max}
              </p>
              <p className="text-xs font-display font-bold mt-0.5 relative z-10">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Progress Bars */}
        <div className="flex flex-col gap-4">
          <ProgressBar
            value={(flashcardDone / 26) * 100}
            color="red"
            label="🃏 Flashcards"
            showLabel
          />
          <ProgressBar
            value={(blendingDone / TOTAL_BLENDING_TASKS) * 100}
            color="blue"
            label="🎵 Blending"
            showLabel
          />
          <ProgressBar
            value={(tracingDone / 26) * 100}
            color="green"
            label="✏️ Tracing"
            showLabel
          />
        </div>

        {/* Letter Grid */}
        <div>
          <h3 className="text-base font-display font-bold text-foreground mb-3">
            Letter Progress
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {PHONICS_DATA.map((l, i) => {
              const fc = progress?.flashcards[l.letter]?.completed;
              const bt =
                (progress?.blending[l.blendingTasks[0].id]?.tasksCompleted
                  .length ?? 0) > 0;
              const tr = progress?.tracing[l.letter]?.completed;
              const doneCount = [fc, bt, tr].filter(Boolean).length;
              const colorCls =
                doneCount === 3
                  ? "gradient-green text-card"
                  : doneCount === 2
                    ? "gradient-yellow text-card"
                    : doneCount === 1
                      ? "gradient-blue text-card"
                      : "bg-muted text-muted-foreground border border-border";

              return (
                <motion.div
                  key={l.letter}
                  data-ocid={`progress.letter_chip.${i + 1}`}
                  className={`h-10 w-full rounded-xl flex items-center justify-center font-display font-black text-sm ${colorCls}`}
                  style={{
                    boxShadow:
                      doneCount > 0
                        ? "0 2px 8px oklch(0 0 0 / 0.4)"
                        : undefined,
                  }}
                  whileHover={{ scale: 1.1 }}
                  title={`${l.letter}: ${doneCount}/3 done`}
                >
                  {l.letter}
                </motion.div>
              );
            })}
          </div>
          <div className="flex gap-3 mt-3 text-xs font-body text-muted-foreground justify-center flex-wrap">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded gradient-green inline-block" />{" "}
              All done
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded gradient-yellow inline-block" />{" "}
              2/3 done
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded gradient-blue inline-block" />{" "}
              1/3 done
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-muted border border-border inline-block" />{" "}
              Not started
            </span>
          </div>
        </div>

        {/* Reset Button */}
        <button
          type="button"
          data-ocid="progress.reset_button"
          onClick={handleReset}
          className="w-full py-3 rounded-2xl border-2 border-destructive text-destructive font-display font-bold active:scale-95 transition-smooth hover:bg-destructive/10"
        >
          🔄 Reset Progress
        </button>
      </div>
    </Layout>
  );
}
