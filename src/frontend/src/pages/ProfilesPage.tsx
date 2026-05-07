import { useRouter } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { AVATARS, useAppStore } from "../store/useAppStore";
import { playSuccessSound, playTapSound } from "../utils/audio";

// ─── Floating orb config ──────────────────────────────────────────────────────
const ORB_CONFIG = [
  // Gold orbs
  {
    id: 0,
    size: 180,
    x: 5,
    y: 8,
    color: "oklch(0.82 0.17 84 / 0.07)",
    dur: 9,
    dx: 18,
    dy: 22,
  },
  {
    id: 1,
    size: 100,
    x: 80,
    y: 15,
    color: "oklch(0.90 0.18 84 / 0.09)",
    dur: 7,
    dx: -14,
    dy: 18,
  },
  {
    id: 2,
    size: 140,
    x: 60,
    y: 70,
    color: "oklch(0.82 0.17 84 / 0.06)",
    dur: 11,
    dx: 20,
    dy: -16,
  },
  {
    id: 3,
    size: 70,
    x: 25,
    y: 55,
    color: "oklch(0.92 0.18 84 / 0.10)",
    dur: 6,
    dx: -12,
    dy: 20,
  },
  {
    id: 4,
    size: 50,
    x: 90,
    y: 45,
    color: "oklch(0.88 0.16 84 / 0.12)",
    dur: 5,
    dx: -18,
    dy: -14,
  },
  {
    id: 5,
    size: 90,
    x: 45,
    y: 90,
    color: "oklch(0.82 0.17 84 / 0.08)",
    dur: 8,
    dx: 16,
    dy: -20,
  },
  // Purple/blue highlights
  {
    id: 6,
    size: 120,
    x: 15,
    y: 35,
    color: "oklch(0.68 0.22 290 / 0.07)",
    dur: 10,
    dx: 14,
    dy: 18,
  },
  {
    id: 7,
    size: 80,
    x: 70,
    y: 5,
    color: "oklch(0.72 0.22 320 / 0.08)",
    dur: 7,
    dx: -10,
    dy: 22,
  },
  {
    id: 8,
    size: 60,
    x: 50,
    y: 40,
    color: "oklch(0.68 0.24 264 / 0.06)",
    dur: 9,
    dx: 20,
    dy: -12,
  },
  {
    id: 9,
    size: 110,
    x: 85,
    y: 80,
    color: "oklch(0.65 0.22 280 / 0.07)",
    dur: 12,
    dx: -16,
    dy: -18,
  },
  // White sparkles
  {
    id: 10,
    size: 28,
    x: 30,
    y: 20,
    color: "oklch(0.97 0 0 / 0.08)",
    dur: 4,
    dx: 10,
    dy: 14,
  },
  {
    id: 11,
    size: 20,
    x: 75,
    y: 60,
    color: "oklch(0.97 0 0 / 0.07)",
    dur: 5,
    dx: -8,
    dy: 12,
  },
  {
    id: 12,
    size: 16,
    x: 55,
    y: 85,
    color: "oklch(0.95 0.18 84 / 0.10)",
    dur: 4,
    dx: 14,
    dy: -10,
  },
  {
    id: 13,
    size: 24,
    x: 10,
    y: 70,
    color: "oklch(0.97 0 0 / 0.06)",
    dur: 6,
    dx: 18,
    dy: -8,
  },
  {
    id: 14,
    size: 18,
    x: 92,
    y: 25,
    color: "oklch(0.95 0.18 84 / 0.09)",
    dur: 5,
    dx: -12,
    dy: 16,
  },
] as const;

function MotionBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {ORB_CONFIG.map((orb) => (
        <motion.div
          key={orb.id}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            background: `radial-gradient(circle at 40% 40%, ${orb.color}, transparent 70%)`,
            filter: orb.size > 60 ? "blur(18px)" : "blur(6px)",
          }}
          animate={{
            x: [0, orb.dx, 0, -orb.dx, 0],
            y: [0, orb.dy, 0, -orb.dy / 2, 0],
            scale: [1, 1.08, 1, 0.95, 1],
            opacity: [0.7, 1, 0.8, 1, 0.7],
          }}
          transition={{
            duration: orb.dur,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: orb.id * 0.4,
          }}
        />
      ))}
    </div>
  );
}

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
    <div className="min-h-screen flex flex-col bg-background relative">
      <MotionBackground />
      {/* Hero — luxury dark with gold gradient title */}
      <div
        className="px-6 pt-14 pb-10 text-center relative overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.12 0.03 280 / 0.85) 0%, oklch(0.07 0.01 264 / 0.75) 100%)",
          zIndex: 1,
          borderBottom: "1px solid oklch(0.82 0.17 84 / 0.2)",
        }}
      >
        {/* Gold radial glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, oklch(0.82 0.17 84 / 0.10) 0%, transparent 70%)",
          }}
        />
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 280 }}
          className="relative z-10"
        >
          <div className="text-7xl mb-3">🦁</div>
          <h1
            className="text-5xl font-display font-black leading-tight drop-shadow-lg"
            style={{
              background:
                "linear-gradient(to right, oklch(0.95 0.18 84), oklch(0.82 0.17 84), oklch(0.95 0.18 84))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Word
            <br />
            to Go
          </h1>
          <p className="text-muted-foreground font-body text-lg mt-2">
            Select who's learning today!
          </p>
        </motion.div>
      </div>

      {/* Profiles */}
      <div
        className="flex-1 px-5 py-6 flex flex-col gap-4 relative"
        style={{ zIndex: 1 }}
      >
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
            className="flex items-center gap-4 bg-card rounded-3xl px-4 py-4 border border-[oklch(0.82_0.17_84/0.15)]"
            style={{
              boxShadow:
                "0 4px 16px oklch(0 0 0 / 0.4), 0 0 0 1px oklch(0.82 0.17 84 / 0.08) inset",
            }}
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
              <div className="w-16 h-16 text-5xl flex items-center justify-center rounded-2xl bg-muted border border-[oklch(0.82_0.17_84/0.2)] flex-shrink-0">
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
              className="bg-card rounded-3xl p-5 border border-[oklch(0.82_0.17_84/0.2)]"
              style={{
                boxShadow:
                  "0 8px 32px oklch(0 0 0 / 0.5), 0 0 0 1px oklch(0.82 0.17 84 / 0.1) inset",
              }}
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
                  className="w-full px-4 py-3 rounded-2xl border border-[oklch(0.82_0.17_84/0.3)] bg-background text-foreground font-body text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.82_0.17_84/0.6)]"
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
                          ? "gradient-gold shadow-luxury ring-2 ring-[oklch(0.82_0.17_84/0.6)]"
                          : "bg-muted hover:bg-muted/70 border border-border"
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
                  className="flex-1 btn-lg btn-tap bg-muted text-foreground font-display font-bold border border-border"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-ocid="profiles.submit_button"
                  onClick={handleCreate}
                  disabled={!name.trim()}
                  className="flex-1 btn-lg btn-tap gradient-gold text-[oklch(0.08_0_0)] font-display font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-luxury"
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
              className="w-full py-5 rounded-3xl border-2 border-dashed border-[oklch(0.82_0.17_84/0.3)] text-[oklch(0.82_0.17_84/0.7)] font-display font-bold text-lg flex items-center justify-center gap-2 hover:border-[oklch(0.82_0.17_84/0.6)] hover:text-[oklch(0.82_0.17_84)] active:scale-95 transition-smooth"
              whileTap={{ scale: 0.97 }}
            >
              ➕ Add New Learner
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <footer
        className="py-3 text-center bg-card/60 border-t border-[oklch(0.82_0.17_84/0.15)] relative"
        style={{ zIndex: 1 }}
      >
        <p className="text-xs text-muted-foreground font-body">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.hostname : "",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[oklch(0.82_0.17_84)] transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
