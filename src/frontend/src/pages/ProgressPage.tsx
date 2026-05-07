import { useRouter } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect } from "react";
import BottomNav from "../components/BottomNav";
import Layout from "../components/Layout";
import ProgressBar from "../components/ProgressBar";
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

  const flashcardDone = Object.values(progress?.flashcards ?? {}).filter((f) => f.completed).length;
  const blendingDone = Object.values(progress?.blending ?? {}).filter((b) => b.tasksCompleted.length > 0).length;
  const tracingDone = Object.values(progress?.tracing ?? {}).filter((t) => t.completed).length;

  const handleReset = () => {
    playTapSound();
    if (window.confirm("Reset all progress? This cannot be undone.")) {
      resetProgress();
    }
  };

  return (
    <Layout title="Progress">
      <div className="px-5 py-6 flex flex-col gap-5 pb-24">
        {/* Profile Card */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="rounded-2xl p-5 flex items-center gap-4 text-white"
          style={{ background: "linear-gradient(135deg, oklch(0.72 0.22 40) 0%, oklch(0.58 0.22 40) 100%)", boxShadow: "0 4px 16px oklch(0 0 0 / 0.15)" }}
        >
          <div className="text-6xl">{profile.avatar}</div>
          <div>
            <p className="text-2xl font-display font-black">{profile.name}</p>
            <p className="text-sm font-body text-white/80 mt-0.5">
              ⭐ {progress?.totalStars ?? 0} total stars
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Letters",
              value: flashcardDone,
              max: 26,
              style: { background: "linear-gradient(135deg, oklch(0.65 0.28 15) 0%, oklch(0.52 0.26 15) 100%)" },
              emoji: "🃏",
            },
            {
              label: "Words",
              value: blendingDone,
              max: TOTAL_BLENDING_TASKS,
              style: { background: "linear-gradient(135deg, oklch(0.55 0.22 264) 0%, oklch(0.42 0.22 264) 100%)" },
              emoji: "🎵",
            },
            {
              label: "Tracing",
              value: tracingDone,
              max: 26,
              style: { background: "linear-gradient(135deg, oklch(0.56 0.18 185) 0%, oklch(0.44 0.18 165) 100%)" },
              emoji: "✏️",
            },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              className="text-white rounded-2xl p-3 text-center"
              style={{ ...stat.style, boxShadow: "0 4px 12px oklch(0 0 0 / 0.15)" }}
              whileHover={{ scale: 1.03 }}
            >
              <div className="text-3xl">{stat.emoji}</div>
              <p className="text-2xl font-display font-black">{stat.value}</p>
              <p className="text-xs font-body opacity-80">/{stat.max}</p>
              <p className="text-xs font-display font-bold mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Progress Bars */}
        <div
          className="flex flex-col gap-4 bg-white rounded-2xl p-4 border"
          style={{ borderColor: "oklch(0.90 0.02 60)", boxShadow: "0 2px 8px oklch(0 0 0 / 0.06)" }}
        >
          <ProgressBar value={(flashcardDone / 26) * 100} color="red" label="🃏 Flashcards" showLabel />
          <ProgressBar value={(blendingDone / TOTAL_BLENDING_TASKS) * 100} color="blue" label="🎵 Blending" showLabel />
          <ProgressBar value={(tracingDone / 26) * 100} color="green" label="✏️ Tracing" showLabel />
        </div>

        {/* Letter Grid */}
        <div
          className="bg-white rounded-2xl p-4 border"
          style={{ borderColor: "oklch(0.90 0.02 60)", boxShadow: "0 2px 8px oklch(0 0 0 / 0.06)" }}
        >
          <h3 className="text-base font-display font-bold text-foreground mb-3">Letter Progress</h3>
          <div className="grid grid-cols-7 gap-2">
            {PHONICS_DATA.map((l, i) => {
              const fc = progress?.flashcards[l.letter]?.completed;
              const bt = (progress?.blending[l.blendingTasks[0].id]?.tasksCompleted.length ?? 0) > 0;
              const tr = progress?.tracing[l.letter]?.completed;
              const doneCount = [fc, bt, tr].filter(Boolean).length;

              const bgStyle =
                doneCount === 3
                  ? { background: "linear-gradient(135deg, oklch(0.56 0.18 185) 0%, oklch(0.44 0.18 165) 100%)", color: "white" }
                  : doneCount === 2
                    ? { background: "linear-gradient(135deg, oklch(0.78 0.18 84) 0%, oklch(0.62 0.18 84) 100%)", color: "white" }
                    : doneCount === 1
                      ? { background: "linear-gradient(135deg, oklch(0.55 0.22 264) 0%, oklch(0.42 0.22 264) 100%)", color: "white" }
                      : { background: "oklch(0.94 0.02 60)", color: "oklch(0.50 0.02 60)", border: "1px solid oklch(0.88 0.02 60)" };

              return (
                <motion.div
                  key={l.letter}
                  data-ocid={`progress.letter_chip.${i + 1}`}
                  className="h-10 w-full rounded-xl flex items-center justify-center font-display font-black text-sm"
                  style={bgStyle}
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
              <span className="w-3 h-3 rounded inline-block" style={{ background: "oklch(0.56 0.18 185)" }} /> All done
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded inline-block" style={{ background: "oklch(0.78 0.18 84)" }} /> 2/3 done
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded inline-block" style={{ background: "oklch(0.55 0.22 264)" }} /> 1/3 done
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded inline-block" style={{ background: "oklch(0.94 0.02 60)", border: "1px solid oklch(0.88 0.02 60)" }} /> Not started
            </span>
          </div>
        </div>

        {/* Reset Button */}
        <button
          type="button"
          data-ocid="progress.reset_button"
          onClick={handleReset}
          className="w-full py-3 rounded-2xl border-2 border-destructive text-destructive font-display font-bold active:scale-95 transition-smooth"
        >
          🔄 Reset Progress
        </button>
      </div>
      <BottomNav active="progress" />
    </Layout>
  );
}
