import { useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="px-5 py-4 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-1 text-sm font-display font-bold text-muted-foreground active:opacity-60 transition-smooth"
        >
          <ChevronLeft className="w-5 h-5" />
          {step === 1 ? "Cancel" : "Back"}
        </button>

        {/* Step dots */}
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-smooth ${
                i + 1 === step
                  ? "bg-[oklch(0.55_0.22_280)]"
                  : i + 1 < step
                    ? "bg-[oklch(0.55_0.22_280/0.4)]"
                    : "bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="w-16" />
      </header>

      {/* Full-screen step content */}
      <div className="flex-1 flex flex-col px-6 pt-4 pb-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-display font-black text-foreground leading-tight">
                  Choose Your Character
                </h1>
                <p className="text-base font-body text-muted-foreground mt-2">
                  Pick your favorite friend!
                </p>
              </div>

              <div className="flex-1 flex items-center justify-center">
                <div className="grid grid-cols-3 gap-4 w-full max-w-xs mx-auto">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => {
                        playTapSound();
                        setAvatar(a);
                      }}
                      className={`aspect-square rounded-3xl flex items-center justify-center text-5xl transition-smooth active:scale-90 border-4 ${
                        avatar === a
                          ? "border-[oklch(0.55_0.22_280)] bg-[oklch(0.94_0.05_280)] shadow-playful"
                          : "border-transparent bg-muted hover:bg-[oklch(0.91_0.01_260)]"
                      }`}
                    >
                      {a}
                    </button>
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
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-display font-black text-foreground leading-tight">
                  What's Your Name?
                </h1>
                <p className="text-base font-body text-muted-foreground mt-2">
                  Type it in below
                </p>
              </div>

              <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-sm mx-auto">
                  <div className="text-center mb-6 text-7xl">{avatar}</div>
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
                    className="w-full px-5 py-4 rounded-2xl border-2 border-border bg-white text-center text-2xl font-display font-bold text-foreground placeholder:text-muted-foreground placeholder:font-body placeholder:font-normal placeholder:text-lg focus:outline-none focus:border-[oklch(0.55_0.22_280)] focus:ring-2 focus:ring-[oklch(0.55_0.22_280/0.2)] transition-smooth"
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
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-display font-black text-foreground leading-tight">
                  How Old Are You?
                </h1>
                <p className="text-base font-body text-muted-foreground mt-2">
                  Tap the number
                </p>
              </div>

              <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-sm mx-auto text-center">
                  <div className="text-7xl mb-6">{avatar}</div>
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
                      className="w-14 h-14 rounded-2xl bg-muted border border-border text-2xl font-display font-black text-foreground active:scale-90 transition-smooth flex items-center justify-center"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setAge("");
                          return;
                        }
                        const n = parseInt(val, 10);
                        if (!isNaN(n) && n >= 2 && n <= 16) setAge(n.toString());
                      }}
                      className="w-28 py-3 rounded-2xl border-2 border-border bg-white text-center text-3xl font-display font-black text-foreground focus:outline-none focus:border-[oklch(0.55_0.22_280)] transition-smooth"
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
                      className="w-14 h-14 rounded-2xl bg-muted border border-border text-2xl font-display font-black text-foreground active:scale-90 transition-smooth flex items-center justify-center"
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

      {/* Bottom action */}
      <div className="px-5 py-6 shrink-0">
        <button
          type="button"
          onClick={goNext}
          disabled={!canProceed()}
          className="w-full h-14 rounded-2xl font-display font-bold text-lg text-white active:scale-95 transition-smooth shadow-playful flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 bg-[oklch(0.55_0.22_280)]"
        >
          {step === 3 ? (
            <>
              Start! <span className="text-2xl leading-none">🎉</span>
            </>
          ) : (
            <>
              Next <span className="text-xl leading-none">→</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
