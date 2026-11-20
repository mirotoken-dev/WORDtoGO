import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

interface CelebrationBurstProps {
  active: boolean;
  onComplete?: () => void;
  intensity?: "low" | "medium" | "high";
}

const EMOJIS = ["⭐", "🌟", "✨", "🎉", "🎊", "🎈", "🏆", "🥇", "🎵", "💖"];

function randomRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    x: randomRange(10, 90),
    delay: randomRange(0, 0.4),
    duration: randomRange(1.2, 2.2),
    rotate: randomRange(-180, 180),
    scale: randomRange(0.7, 1.4),
    drift: randomRange(-60, 60),
  }));
}

export default function CelebrationBurst({
  active,
  onComplete,
  intensity = "medium",
}: CelebrationBurstProps) {
  const [particles, setParticles] = useState<ReturnType<typeof generateParticles>>([]);
  const [showBanner, setShowBanner] = useState(false);

  const particleCount = intensity === "low" ? 15 : intensity === "medium" ? 28 : 45;

  useEffect(() => {
    if (active) {
      setParticles(generateParticles(particleCount));
      setShowBanner(true);
      const timer = setTimeout(() => {
        setShowBanner(false);
        onComplete?.();
      }, 2800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [active, intensity, onComplete, particleCount]);

  return (
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          {/* Particle burst */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute text-3xl select-none"
              style={{ left: `${p.x}%`, bottom: "10%" }}
              initial={{ y: 0, opacity: 1, scale: 0, rotate: 0 }}
              animate={{
                y: [0, -randomRange(120, 280), -randomRange(200, 400)],
                x: [0, p.drift * 0.5, p.drift],
                opacity: [1, 1, 0],
                scale: [0, p.scale, p.scale * 0.6],
                rotate: [0, p.rotate * 0.5, p.rotate],
              }}
              transition={{
                delay: p.delay,
                duration: p.duration,
                ease: "easeOut",
              }}
            >
              {p.emoji}
            </motion.div>
          ))}

          {/* Central banner */}
          <AnimatePresence>
            {showBanner && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="rounded-3xl px-8 py-6 text-center"
                  style={{
                    background: "linear-gradient(135deg, oklch(0.72 0.22 88) 0%, oklch(0.58 0.22 88) 100%)",
                    boxShadow: "0 8px 0 0 oklch(0.46 0.18 78), 0 12px 40px rgba(0,0,0,0.25)",
                  }}
                  initial={{ scale: 0.3, y: 40, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.8, y: -20, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                >
                  <motion.div
                    className="text-6xl mb-2"
                    animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                  >
                    🎉
                  </motion.div>
                  <p className="font-display font-black text-2xl text-white drop-shadow-sm">
                    Amazing!
                  </p>
                  <p className="font-body text-sm text-white/80 mt-1">
                    You did it! Keep going!
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
