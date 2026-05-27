import { useRouter } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { AVATARS, useAppStore } from "../store/useAppStore";
import { getUILabel } from "../data/arabicTranslations";
import { playSuccessSound, playTapSound } from "../utils/audio";

export default function ProfilesPage() {
  const router = useRouter();
  const { profiles, addProfile, deleteProfile, setActiveProfile } = useAppStore();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
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
    const ageNum = age.trim() ? parseInt(age.trim(), 10) : undefined;
    addProfile(name.trim(), avatar, ageNum && !isNaN(ageNum) ? ageNum : undefined);
    const allProfiles = useAppStore.getState().profiles;
    const newProfile = allProfiles[allProfiles.length - 1];
    if (newProfile) {
      useAppStore.getState().setActiveProfile(newProfile.id);
      router.navigate({ to: "/home" });
    }
    setCreating(false);
    setName("");
    setAge("");
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
        {profiles.length === 0 && !creating && (
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

        <AnimatePresence>
          {profiles.length >= 3 && !creating ? (
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
          ) : creating ? (
            <motion.div
              data-ocid="profiles.create_form"
              className="bg-white rounded-2xl p-5 border border-border shadow-card"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
            >
              <h2 className="text-xl font-display font-bold text-foreground mb-4">
                {getUILabel("New Learner")}
              </h2>
              <div className="mb-4">
                <label
                  htmlFor="profile-name"
                  className="block text-sm font-display font-semibold text-foreground mb-2"
                >
                  {getUILabel("Name")}
                </label>
                <input
                  id="profile-name"
                  ref={inputRef}
                  data-ocid="profiles.name_input"
                  type="text"
                  placeholder={getUILabel("Enter name...")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-foreground font-body text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.55_0.22_280/0.4)] focus:border-[oklch(0.55_0.22_280)]"
                  maxLength={20}
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="profile-age"
                  className="block text-sm font-display font-semibold text-foreground mb-2"
                >
                  {getUILabel("Age")}
                </label>
                <input
                  id="profile-age"
                  data-ocid="profiles.age_input"
                  type="number"
                  placeholder={getUILabel("Enter age...")}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-foreground font-body text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.55_0.22_280/0.4)] focus:border-[oklch(0.55_0.22_280)]"
                  min={2}
                  max={16}
                />
              </div>
              <div className="mb-5">
                <p className="block text-sm font-display font-semibold text-foreground mb-2">
                  {getUILabel("Avatar")}
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      data-ocid="profiles.avatar_option"
                      onClick={() => setAvatar(a)}
                      className={`w-12 h-12 rounded-2xl text-2xl flex items-center justify-center active:scale-95 transition-smooth border-2 ${
                        avatar === a
                          ? "border-[oklch(0.55_0.22_280)] bg-[oklch(0.94_0.05_280)]"
                          : "border-transparent bg-muted hover:bg-[oklch(0.91_0.01_260)]"
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
                  onClick={() => { setCreating(false); setName(""); }}
                  className="flex-1 py-3 rounded-xl bg-muted text-foreground font-display font-bold border border-border active:scale-95 transition-smooth"
                >
                  {getUILabel("Cancel")}
                </button>
                <button
                  type="button"
                  data-ocid="profiles.submit_button"
                  onClick={handleCreate}
                  disabled={!name.trim()}
                  className="flex-1 py-3 rounded-xl gradient-indigo text-white font-display font-bold active:scale-95 transition-smooth shadow-playful disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {getUILabel("Start!")} 🎉
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
              className="w-full py-5 rounded-2xl border-2 border-dashed border-[oklch(0.55_0.22_280/0.35)] text-[oklch(0.55_0.22_280)] font-display font-bold text-base flex items-center justify-center gap-2 hover:border-[oklch(0.55_0.22_280/0.6)] hover:bg-[oklch(0.96_0.03_280)] active:scale-95 transition-smooth"
              whileTap={{ scale: 0.97 }}
            >
              ➕ {getUILabel("Add New Learner")}
            </motion.button>
          )}
        </AnimatePresence>
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
