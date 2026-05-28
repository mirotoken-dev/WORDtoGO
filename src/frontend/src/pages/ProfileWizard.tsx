import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { AVATARS, useAppStore } from "../store/useAppStore";
import { playSuccessSound, playTapSound } from "../utils/audio";

export default function ProfileWizard() {
  const router = useRouter();
  const { addProfile } = useAppStore();

  const [step, setStep] = useState(1);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");

  const totalSteps = 3;

  const goNext = () => {
    playTapSound();
    if (step === 3) {
      const ageNum = age.trim() ? parseInt(age.trim(), 10) : undefined;
      addProfile(
        name.trim(),
        avatar,
        ageNum && !isNaN(ageNum) ? ageNum : undefined,
      );
      const allProfiles = useAppStore.getState().profiles;
      const newProfile = allProfiles[allProfiles.length - 1];
      if (newProfile) {
        useAppStore.getState().setActiveProfile(newProfile.id);
        playSuccessSound();
        router.navigate({ to: "/home" });
      }
      return;
    }
    setStep((s) => s + 1);
  };

  const goBack = () => {
    playTapSound();
    if (step === 1) {
      router.navigate({ to: "/" });
    } else {
      setStep((s) => s - 1);
    }
  };

  const canProceed = () => {
    if (step === 1) return true;
    if (step === 2) return name.trim().length > 0;
    return true;
  };

  const stepLabels = ["Pick Character", "Your Name", "Your Age"];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="px-5 py-4 flex items-center gap-3 shrink-0 bg-white border-b-2 border-border">
        <button
          type="button"
          onClick={goBack}
          className="nav-btn"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Progress bars */}
        <div className="flex-1 flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 h-3 rounded-full overflow-hidden bg-muted border border-border">
              <motion.div
                className="h-full rounded-full bg-[oklch(0.72_0.27_130)]"
                initial={{ width: 0 }}
                animate={{ width: i + 1 <= step ? "100%" : "0%" }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>
          ))}
        </div>

        <span className="text-sm font-display font-bold text-muted-foreground w-12 text-right">
          {step}/{totalSteps}
        </span>
      </header>

      {/* Step content */}
      <div className="flex-1 flex flex-col px-6 pt-6 pb-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.22 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">🎭</div>
                <h1 className="text-3xl font-display font-black text-foreground leading-tight">
                  {stepLabels[0]}
                </h1>
                <p className="text-base font-body text-muted-foreground mt-1">
                  Pick your favorite friend!
                </p>
              </div>

              <div className="flex-1 flex items-center justify-center">
                <div className="grid grid-cols-3 gap-4 w-full max-w-xs mx-auto">
                  {AVATARS.map((a) => (
                    <motion.button
                      key={a}
                      type="button"
                      onClick={() => {
                        playTapSound();
                        setAvatar(a);
                      }}
                      whileTap={{ scale: 0.88 }}
                      className={`aspect-square rounded-3xl flex items-center justify-center text-5xl transition-smooth border-4 shadow-duo ${
                        avatar === a
                          ? "border-[oklch(0.72_0.27_130)] bg-[oklch(0.95_0.06_130)] scale-105"
                          : "border-transparent bg-white hover:bg-muted"
                      }`}
                      style={
                        avatar === a
                          ? { boxShadow: "0 5px 0 0 oklch(0.56 0.25 130)" }
                          : { boxShadow: "0 4px 0 0 oklch(0.88 0.012 260)" }
                      }
                    >
                      {a}
                      {avatar === a && (
                        <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[oklch(0.72_0.27_130)] text-white text-xs flex items-center justify-center font-black">
                          ✓
                        </span>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.22 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">✍️</div>
                <h1 className="text-3xl font-display font-black text-foreground leading-tight">
                  {stepLabels[1]}
                </h1>
                <p className="text-base font-body text-muted-foreground mt-1">
                  Type it in below
                </p>
              </div>

              <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-sm mx-auto">
                  <div className="text-center mb-6">
                    <div className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center text-6xl bg-white border-2 border-border shadow-duo">
                      {avatar}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canProceed()) goNext();
                    }}
                    placeholder="Your name"
                    maxLength={20}
                    autoFocus
                    className="w-full px-5 py-4 rounded-2xl border-2 border-border bg-white text-center text-2xl font-display font-black text-foreground placeholder:text-muted-foreground placeholder:font-body placeholder:font-normal placeholder:text-lg focus:outline-none focus:border-[oklch(0.72_0.27_130)] focus:ring-2 focus:ring-[oklch(0.72_0.27_130/0.15)] transition-smooth shadow-duo"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.22 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">🎂</div>
                <h1 className="text-3xl font-display font-black text-foreground leading-tight">
                  {stepLabels[2]}
                </h1>
                <p className="text-base font-body text-muted-foreground mt-1">
                  Tap the number
                </p>
              </div>

              <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-sm mx-auto text-center">
                  <div className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center text-6xl bg-white border-2 border-border shadow-duo mb-6">
                    {avatar}
                  </div>
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        playTapSound();
                        setAge((prev) => {
                          const n = parseInt(prev || "0", 10);
                          return Math.max(2, n - 1).toString();
                        });
                      }}
                      className="press-btn press-outline w-14 h-14 text-2xl font-black p-0"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") { setAge(""); return; }
                        const n = parseInt(val, 10);
                        if (!isNaN(n) && n >= 2 && n <= 16) setAge(n.toString());
                      }}
                      className="w-28 py-3 rounded-2xl border-2 border-border bg-white text-center text-3xl font-display font-black text-foreground focus:outline-none focus:border-[oklch(0.72_0.27_130)] transition-smooth shadow-duo"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        playTapSound();
                        setAge((prev) => {
                          const n = parseInt(prev || "0", 10);
                          return Math.min(16, n + 1).toString();
                        });
                      }}
                      className="press-btn press-primary w-14 h-14 text-2xl font-black p-0"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground font-body">
                    Age is optional — skip if you want!
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div className="px-5 py-6 shrink-0 bg-white border-t-2 border-border">
        <motion.button
          type="button"
          onClick={goNext}
          disabled={!canProceed()}
          className="press-btn press-primary w-full h-16 text-xl"
          whileTap={{ scale: 0.97 }}
        >
          {step === 3 ? (
            <>Let's Go! 🎉</>
          ) : (
            <>Continue →</>
          )}
        </motion.button>
      </div>
    </div>
  );
}
