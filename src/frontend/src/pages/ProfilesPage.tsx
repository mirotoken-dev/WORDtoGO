import { useRouter } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { getUILabel } from "../data/arabicTranslations";
import { playChimeSound } from "../utils/audio";

export default function ProfilesPage() {
  const router = useRouter();
  const { profiles, deleteProfile, setActiveProfile } = useAppStore();
  const [toDelete, setToDelete] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    playChimeSound();
    setActiveProfile(id);
    router.navigate({ to: "/home" });
  };

  const handleDelete = (id: string) => {
    playChimeSound();
    deleteProfile(id);
    setToDelete(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero */}
      <div className="relative pb-0 bg-[oklch(0.72_0.27_130)] overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
        <div className="absolute bottom-8 left-0 w-24 h-24 rounded-full bg-white/10 -translate-x-6" />

        <div className="relative px-6 pt-10 pb-6 text-center">
          {/* Logo — bounces in then floats continuously */}
          <motion.img
            src="/logo-wordtogo.png"
            alt="Word to Go"
            className="w-72 mx-auto select-none"
            style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.2))" }}
            initial={{ scale: 0.5, opacity: 0, y: 30 }}
            animate={[
              { scale: 1, opacity: 1, y: 0, transition: { type: "spring", stiffness: 220, damping: 16, delay: 0.05 } },
              { y: [0, -10, 0], transition: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.6 } },
            ]}
            draggable={false}
          />
          <motion.p
            className="text-white/90 font-body text-base mt-1"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            {getUILabel("Select who's learning today!")}
          </motion.p>
        </div>

        {/* Wave bottom */}
        <div className="wave-divider -mb-px">
          <svg viewBox="0 0 390 40" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 40V20C65 0 130 40 195 20C260 0 325 40 390 20V40H0Z" fill="oklch(0.99 0.008 95)" />
          </svg>
        </div>
      </div>

      {/* Profiles */}
      <div className="flex-1 px-5 py-5 flex flex-col gap-3">
        {profiles.length === 0 && (
          <motion.div
            data-ocid="profiles.empty_state"
            className="text-center py-14"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-7xl mb-4 float inline-block">👶</div>
            <p className="text-2xl font-display font-black text-foreground mt-4">
              {getUILabel("No profiles yet!")}
            </p>
            <p className="text-sm font-body text-muted-foreground mt-2">
              {getUILabel("Create a profile to start learning")}
            </p>
          </motion.div>
        )}

        {profiles.map((profile, idx) => (
          <motion.div
            key={profile.id}
            data-ocid={`profiles.item.${idx + 1}`}
            className="duo-card flex items-center gap-4 px-4 py-4"
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: idx * 0.08 }}
          >
            <button
              type="button"
              data-ocid={`profiles.select_button.${idx + 1}`}
              onClick={() => handleSelect(profile.id)}
              className="flex-1 flex items-center gap-4 text-left active:scale-95 transition-smooth"
            >
              <div className="w-16 h-16 text-4xl flex items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.72_0.27_130/0.12)] to-[oklch(0.67_0.21_222/0.12)] border-2 border-[oklch(0.88_0.012_260)] flex-shrink-0">
                {profile.avatar}
              </div>
              <div className="min-w-0">
                <p className="text-xl font-display font-black text-foreground truncate">
                  {profile.name}
                  {profile.age && (
                    <span className="text-muted-foreground font-body font-normal text-sm">
                      {" · "}
                      {profile.age} yrs
                    </span>
                  )}
                </p>
                <p className="text-sm font-body text-[oklch(0.72_0.27_130)] font-bold">
                  {getUILabel("Tap to play!")} 🎉
                </p>
              </div>
            </button>

            {toDelete === profile.id ? (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  type="button"
                  data-ocid={`profiles.confirm_button.${idx + 1}`}
                  onClick={() => handleDelete(profile.id)}
                  className="w-10 h-10 rounded-xl bg-destructive flex items-center justify-center active:scale-95 transition-smooth"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
                <button
                  type="button"
                  data-ocid={`profiles.cancel_button.${idx + 1}`}
                  onClick={() => setToDelete(null)}
                  className="w-10 h-10 rounded-xl bg-muted border-2 border-border flex items-center justify-center active:scale-95 transition-smooth text-sm font-black text-foreground"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                data-ocid={`profiles.delete_button.${idx + 1}`}
                onClick={() => setToDelete(profile.id)}
                className="w-10 h-10 rounded-xl bg-muted border-2 border-border flex items-center justify-center active:scale-95 transition-smooth flex-shrink-0"
              >
                <Trash2 className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </motion.div>
        ))}

        {profiles.length >= 3 ? (
          <motion.div
            data-ocid="profiles.max_reached"
            className="text-center py-5 px-5 rounded-3xl bg-muted border-2 border-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-base font-display font-black text-muted-foreground">
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
            onClick={() => {
              playChimeSound();
              router.navigate({ to: "/wizard" });
            }}
            className="press-btn press-primary w-full h-16 text-lg font-display font-black"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: profiles.length * 0.08 + 0.1 }}
            whileTap={{ scale: 0.97 }}
          >
            ✦ {getUILabel("Add New Learner")}
          </motion.button>
        )}
      </div>
    </div>
  );
}
