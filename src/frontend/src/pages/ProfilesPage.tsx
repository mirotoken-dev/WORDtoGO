import { useRouter } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { getUILabel } from "../data/arabicTranslations";
import { playTapSound } from "../utils/audio";

export default function ProfilesPage() {
  const router = useRouter();
  const { profiles, deleteProfile, setActiveProfile } = useAppStore();
  const [toDelete, setToDelete] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    playTapSound();
    setActiveProfile(id);
    router.navigate({ to: "/home" });
  };

  const handleDelete = (id: string) => {
    playTapSound();
    deleteProfile(id);
    setToDelete(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero */}
      <div className="px-6 pt-16 pb-10 text-center bg-white border-b border-border">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
        >
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-3xl flex items-center justify-center text-5xl shadow-card"
            style={{ background: "linear-gradient(135deg, oklch(0.80 0.18 84) 0%, oklch(0.68 0.22 40) 100%)" }}
          >
            🦁
          </div>
          <h1 className="text-4xl font-display font-black text-foreground leading-tight">
            Word to Go
          </h1>
          <p className="text-muted-foreground font-body text-base mt-2">
            {getUILabel("Select who's learning today!")}
          </p>
        </motion.div>
      </div>

      {/* Profiles */}
      <div className="flex-1 px-5 py-6 flex flex-col gap-3">
        {profiles.length === 0 && (
          <motion.div
            data-ocid="profiles.empty_state"
            className="text-center py-14"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-6xl mb-4">👶</div>
            <p className="text-xl font-display font-bold text-foreground">{getUILabel("No profiles yet!")}</p>
            <p className="text-sm font-body text-muted-foreground mt-1">
              {getUILabel("Create a profile to start learning")}
            </p>
          </motion.div>
        )}

        {profiles.map((profile, idx) => (
          <motion.div
            key={profile.id}
            data-ocid={`profiles.item.${idx + 1}`}
            className="flex items-center gap-4 bg-white rounded-2xl px-4 py-4 border border-border shadow-card"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: idx * 0.07 }}
          >
            <button
              type="button"
              data-ocid={`profiles.select_button.${idx + 1}`}
              onClick={() => handleSelect(profile.id)}
              className="flex-1 flex items-center gap-4 text-left active:scale-95 transition-smooth"
            >
              <div className="w-14 h-14 text-4xl flex items-center justify-center rounded-2xl bg-muted border border-border flex-shrink-0">
                {profile.avatar}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-display font-bold text-foreground truncate">
                  {profile.name}
                  {profile.age && <span className="text-muted-foreground font-body font-normal text-sm"> · {profile.age} yrs</span>}
                </p>
                <p className="text-sm font-body text-muted-foreground">{getUILabel("Tap to play!")} 🎉</p>
              </div>
            </button>

            {toDelete === profile.id ? (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  type="button"
                  data-ocid={`profiles.confirm_button.${idx + 1}`}
                  onClick={() => handleDelete(profile.id)}
                  className="w-9 h-9 rounded-xl bg-destructive flex items-center justify-center active:scale-95 transition-smooth"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
                <button
                  type="button"
                  data-ocid={`profiles.cancel_button.${idx + 1}`}
                  onClick={() => setToDelete(null)}
                  className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center active:scale-95 transition-smooth text-sm font-bold text-foreground"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                data-ocid={`profiles.delete_button.${idx + 1}`}
                onClick={() => setToDelete(profile.id)}
                className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center active:scale-95 transition-smooth flex-shrink-0"
              >
                <Trash2 className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </motion.div>
        ))}

        {profiles.length >= 3 ? (
          <motion.div
            data-ocid="profiles.max_reached"
            className="text-center py-4 px-5 rounded-2xl bg-muted border border-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-base font-display font-bold text-muted-foreground">
              {getUILabel("Maximum 3 learners reached")}
            </p>
            <p className="text-sm font-body text-muted-foreground mt-1">
              {getUILabel("Delete a profile to add a new one")}
            </p>
          </motion.div>
        ) : (
          <motion.button
            type="button"
            data-ocid="profiles.add_button"
            onClick={() => { playTapSound(); router.navigate({ to: "/wizard" }); }}
            className="w-full py-5 rounded-2xl border-2 border-dashed border-[oklch(0.55_0.22_280/0.35)] text-[oklch(0.55_0.22_280)] font-display font-bold text-base flex items-center justify-center gap-2 hover:border-[oklch(0.55_0.22_280/0.6)] hover:bg-[oklch(0.96_0.03_280)] active:scale-95 transition-smooth"
            whileTap={{ scale: 0.97 }}
          >
            ➕ {getUILabel("Add New Learner")}
          </motion.button>
        )}
      </div>

      <footer className="py-3 text-center bg-white border-t border-border">
        <p className="text-xs text-muted-foreground font-body">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.hostname : "",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[oklch(0.55_0.22_280)] transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
