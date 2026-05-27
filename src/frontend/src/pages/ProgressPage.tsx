import { useRouter } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect } from "react";
import Layout from "../components/Layout";
import ProgressBar from "../components/ProgressBar";
import StarBadge from "../components/StarBadge";
import { PHONICS_DATA, TOTAL_BLENDING_TASKS } from "../data/phonicsData";
import { useAppStore } from "../store/useAppStore";
import { getUILabel } from "../data/arabicTranslations";
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
    if (window.confirm(getUILabel("Reset all progress? This cannot be undone."))) {
      resetProgress();
    }
  };

  return (
    <Layout title={getUILabel("Progress")}>
      <div className="px-5 py-5 flex flex-col gap-5">

        {/* Profile Card */}
        <motion.div
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="gradient-indigo text-white rounded-2xl p-5 flex items-center gap-4"
          style={{ boxShadow: "0 4px 20px oklch(0.55 0.22 280 / 0.30)" }}
        >
          <div className="text-5xl">{profile.avatar}</div>
          <div>
            <p className="text-xl font-display font-black">{profile.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <StarBadge count={progress?.totalStars ?? 0} size="md" />
              <span className="text-sm font-body opacity-80">{getUILabel("total stars")}</span>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: getUILabel("Letters"), value: flashcardDone, max: 26, colorClass: "gradient-red", emoji: "🃏" },
            { label: getUILabel("Words"), value: blendingDone, max: TOTAL_BLENDING_TASKS, colorClass: "gradient-blue", emoji: "🎵" },
            { label: getUILabel("Tracing"), value: tracingDone, max: 26, colorClass: "gradient-green", emoji: "✏️" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              className={`${stat.colorClass} text-white rounded-2xl p-3 text-center relative overflow-hidden`}
              style={{ boxShadow: "0 4px 12px oklch(0 0 0 / 0.12)" }}
              whileHover={{ scale: 1.03 }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(135deg, oklch(1 0 0 / 0.12) 0%, transparent 60%)" }}
              />
              <div className="text-3xl relative z-10">{stat.emoji}</div>
              <p className="text-2xl font-display font-black relative z-10">{stat.value}</p>
              <p className="text-xs font-body opacity-75 relative z-10">/{stat.max}</p>
              <p className="text-xs font-display font-bold mt-0.5 relative z-10">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Progress Bars */}
        <div className="bg-white rounded-2xl p-4 border border-border flex flex-col gap-4 shadow-card">
          <ProgressBar value={(flashcardDone / 26) * 100} color="red" label="🃏 Flashcards" showLabel />
          <ProgressBar value={(blendingDone / TOTAL_BLENDING_TASKS) * 100} color="blue" label="🎵 Blending" showLabel />
          <ProgressBar value={(tracingDone / 26) * 100} color="green" label="✏️ Tracing" showLabel />
        </div>

        {/* Letter Grid */}
        <div className="bg-white rounded-2xl p-4 border border-border shadow-card">
          <h3 className="text-sm font-display font-bold text-foreground mb-3">{getUILabel("Letter Progress")}</h3>
          <div className="grid grid-cols-7 gap-1.5">
            {PHONICS_DATA.map((l, i) => {
              const fc = progress?.flashcards[l.letter]?.completed;
              const bt = (progress?.blending[l.blendingTasks[0].id]?.tasksCompleted.length ?? 0) > 0;
              const tr = progress?.tracing[l.letter]?.completed;
              const doneCount = [fc, bt, tr].filter(Boolean).length;
              const style =
                doneCount === 3
                  ? { background: "oklch(0.62 0.22 145)", color: "white" }
                  : doneCount === 2
                    ? { background: "oklch(0.80 0.18 84)", color: "white" }
                    : doneCount === 1
                      ? { background: "oklch(0.58 0.22 260)", color: "white" }
                      : { background: "oklch(0.94 0.01 260)", color: "oklch(0.52 0.03 260)", border: "1px solid oklch(0.90 0.01 260)" };
              return (
                <motion.div
                  key={l.letter}
                  data-ocid={`progress.letter_chip.${i + 1}`}
                  className="h-9 w-full rounded-xl flex items-center justify-center font-display font-black text-sm"
                  style={{ ...style, boxShadow: doneCount > 0 ? "0 2px 6px oklch(0 0 0 / 0.12)" : undefined }}
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
              <span className="w-3 h-3 rounded inline-block" style={{ background: "oklch(0.62 0.22 145)" }} /> {getUILabel("All done")}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded inline-block" style={{ background: "oklch(0.80 0.18 84)" }} /> 2/3
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded inline-block" style={{ background: "oklch(0.58 0.22 260)" }} /> 1/3
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-muted border border-border inline-block" /> Not started
            </span>
          </div>
        </div>

        {/* Reset */}
        <button
          type="button"
          data-ocid="progress.reset_button"
          onClick={handleReset}
          className="w-full py-3 rounded-2xl border-2 border-destructive/40 text-destructive font-display font-bold active:scale-95 transition-smooth hover:bg-destructive/5 text-sm"
        >
          🔄 {getUILabel("Reset Progress")}
        </button>
      </div>
    </Layout>
  );
}
