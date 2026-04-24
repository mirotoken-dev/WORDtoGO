import { useRouter } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { AVATARS, useAppStore } from "../store/useAppStore";
import { playSuccessSound, playTapSound } from "../utils/audio";

export default function ProfilesPage() {
  const router = useRouter();
  const { profiles, addProfile, deleteProfile, setActiveProfile } =
    useAppStore();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (id: string) => {
    playTapSound();
    setActiveProfile(id);
    router.navigate({ to: "/home" });
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    playSuccessSound();
    addProfile(name.trim(), avatar);
    // find new profile
    const allProfiles = useAppStore.getState().profiles;
    const newProfile = allProfiles[allProfiles.length - 1];
    if (newProfile) {
      useAppStore.getState().setActiveProfile(newProfile.id);
      router.navigate({ to: "/home" });
    }
    setCreating(false);
    setName("");
  };

  const handleDelete = (id: string) => {
    playTapSound();
    deleteProfile(id);
    setToDelete(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero */}
      <div className="gradient-purple px-6 pt-14 pb-10 text-center relative overflow-hidden">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 280 }}
          className="relative z-10"
        >
          <div className="text-7xl mb-3">🦁</div>
          <h1 className="text-5xl font-display font-black text-card leading-tight drop-shadow-lg">
            Phonics
            <br />
            Playroom
          </h1>
          <p className="text-card/80 font-body text-lg mt-2">
            Select who's learning today!
          </p>
        </motion.div>
      </div>

      {/* Profiles */}
      <div className="flex-1 px-5 py-6 flex flex-col gap-4">
        {profiles.length === 0 && !creating && (
          <motion.div
            data-ocid="profiles.empty_state"
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-6xl mb-4">👶</div>
            <p className="text-xl font-display font-bold text-foreground">
              No profiles yet!
            </p>
            <p className="text-sm font-body text-muted-foreground mt-1">
              Create a profile to start learning.
            </p>
          </motion.div>
        )}

        {profiles.map((profile, idx) => (
          <motion.div
            key={profile.id}
            data-ocid={`profiles.item.${idx + 1}`}
            className="flex items-center gap-4 bg-card rounded-3xl px-4 py-4 shadow-playful border border-border"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: idx * 0.08 }}
          >
            <button
              type="button"
              data-ocid={`profiles.select_button.${idx + 1}`}
              onClick={() => handleSelect(profile.id)}
              className="flex-1 flex items-center gap-4 text-left active:scale-95 transition-smooth"
            >
              <div className="w-16 h-16 text-5xl flex items-center justify-center rounded-2xl bg-muted flex-shrink-0">
                {profile.avatar}
              </div>
              <div className="min-w-0">
                <p className="text-xl font-display font-bold text-foreground truncate">
                  {profile.name}
                </p>
                <p className="text-sm font-body text-muted-foreground">
                  Tap to play! 🎉
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
                  aria-label="Confirm delete"
                >
                  <Trash2 className="w-4 h-4 text-destructive-foreground" />
                </button>
                <button
                  type="button"
                  data-ocid={`profiles.cancel_button.${idx + 1}`}
                  onClick={() => setToDelete(null)}
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center active:scale-95 transition-smooth text-sm font-bold text-foreground"
                  aria-label="Cancel"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                data-ocid={`profiles.delete_button.${idx + 1}`}
                onClick={() => setToDelete(profile.id)}
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center active:scale-95 transition-smooth flex-shrink-0"
                aria-label={`Delete ${profile.name}`}
              >
                <Trash2 className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </motion.div>
        ))}

        <AnimatePresence>
          {profiles.length >= 3 && !creating ? (
            <motion.div
              data-ocid="profiles.max_reached"
              className="text-center py-4 px-5 rounded-3xl bg-muted border border-border"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-base font-display font-bold text-muted-foreground">
                Maximum 3 learners reached
              </p>
              <p className="text-sm font-body text-muted-foreground mt-1">
                Delete a profile to add a new one.
              </p>
            </motion.div>
          ) : creating ? (
            <motion.div
              data-ocid="profiles.create_form"
              className="bg-card rounded-3xl p-5 shadow-playful border border-border"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <h2 className="text-xl font-display font-bold text-foreground mb-4">
                New Learner
              </h2>

              <div className="mb-4">
                <label
                  htmlFor="profile-name"
                  className="block text-sm font-display font-semibold text-foreground mb-2"
                >
                  Name
                </label>
                <input
                  id="profile-name"
                  ref={inputRef}
                  data-ocid="profiles.name_input"
                  type="text"
                  placeholder="Enter name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                  }}
                  className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-foreground font-body text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  maxLength={20}
                />
              </div>

              <div className="mb-5">
                <p className="block text-sm font-display font-semibold text-foreground mb-2">
                  Avatar
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      data-ocid={"profiles.avatar_option"}
                      onClick={() => setAvatar(a)}
                      className={`w-12 h-12 rounded-2xl text-2xl flex items-center justify-center active:scale-95 transition-smooth ${
                        avatar === a
                          ? "gradient-purple text-card shadow-playful ring-2 ring-secondary"
                          : "bg-muted hover:bg-muted/70"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  data-ocid="profiles.cancel_create_button"
                  onClick={() => {
                    setCreating(false);
                    setName("");
                  }}
                  className="flex-1 btn-lg btn-tap bg-muted text-foreground font-display font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-ocid="profiles.submit_button"
                  onClick={handleCreate}
                  disabled={!name.trim()}
                  className="flex-1 btn-lg btn-tap gradient-purple text-card font-display font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start! 🎉
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              type="button"
              data-ocid="profiles.add_button"
              onClick={() => {
                playTapSound();
                setCreating(true);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="w-full py-5 rounded-3xl border-2 border-dashed border-border text-muted-foreground font-display font-bold text-lg flex items-center justify-center gap-2 hover:border-primary hover:text-primary active:scale-95 transition-smooth"
              whileTap={{ scale: 0.97 }}
            >
              ➕ Add New Learner
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <footer className="py-3 text-center bg-muted/40 border-t border-border">
        <p className="text-xs text-muted-foreground font-body">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.hostname : "",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
