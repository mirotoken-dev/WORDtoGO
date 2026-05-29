import { useState } from "react";

function getAudioContext(): AudioContext {
  return new AudioContext();
}

const sounds = [
  {
    id: "bell",
    name: "Bell",
    emoji: "🔔",
    description: "Single clear bell tone with long fade",
    play: () => {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.setValueAtTime(1046, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 1.2);
    },
  },
  {
    id: "chime",
    name: "Chime",
    emoji: "🎵",
    description: "Ascending 3-note chime (currently applied)",
    play: () => {
      const ctx = getAudioContext();
      const notes = [
        { freq: 1047, delay: 0, dur: 0.7, vol: 0.22 },
        { freq: 1319, delay: 0.08, dur: 0.55, vol: 0.16 },
        { freq: 1568, delay: 0.18, dur: 0.45, vol: 0.12 },
      ];
      for (const n of notes) {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine"; osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.delay);
        gain.gain.setValueAtTime(0, ctx.currentTime + n.delay);
        gain.gain.linearRampToValueAtTime(n.vol, ctx.currentTime + n.delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.delay + n.dur);
        osc.start(ctx.currentTime + n.delay); osc.stop(ctx.currentTime + n.delay + n.dur);
      }
    },
  },
  {
    id: "sparkle",
    name: "Sparkle",
    emoji: "✨",
    description: "Quick bright cascade of high notes",
    play: () => {
      const ctx = getAudioContext();
      [1568, 1865, 2093, 2349].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine"; osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.055);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.055);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.055 + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.055 + 0.28);
        osc.start(ctx.currentTime + i * 0.055); osc.stop(ctx.currentTime + i * 0.055 + 0.3);
      });
    },
  },
  {
    id: "bubble",
    name: "Bubble Pop",
    emoji: "🫧",
    description: "Soft bubbly swooping pop",
    play: () => {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(900, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.06);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.25);
    },
  },
  {
    id: "xylophone",
    name: "Xylophone",
    emoji: "🪘",
    description: "Two-note wooden tap",
    play: () => {
      const ctx = getAudioContext();
      ([[ 880, 0], [1175, 0.13]] as [number, number][]).forEach(([freq, delay]) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "triangle"; osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35);
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.4);
      });
    },
  },
  {
    id: "magic",
    name: "Magic Rise",
    emoji: "🪄",
    description: "Soft 5-note rising shimmer",
    play: () => {
      const ctx = getAudioContext();
      [523, 659, 784, 1047, 1319].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine"; osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.07);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.07 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.07 + 0.5);
        osc.start(ctx.currentTime + i * 0.07); osc.stop(ctx.currentTime + i * 0.07 + 0.55);
      });
    },
  },
];

export default function SoundPreviewPage() {
  const [playing, setPlaying] = useState<string | null>(null);

  const handlePlay = (s: typeof sounds[0]) => {
    setPlaying(s.id);
    s.play();
    setTimeout(() => setPlaying(null), 900);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[oklch(0.96_0.05_130)] to-[oklch(0.92_0.08_160)] p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🎧</div>
          <h2 className="text-2xl font-black text-gray-800">Pick a Button Sound</h2>
          <p className="text-sm text-gray-500 mt-1 font-body">Tap each one to hear it, then tell me which you like</p>
        </div>

        <div className="flex flex-col gap-3">
          {sounds.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handlePlay(s)}
              className={`
                flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left
                transition-all duration-150 active:scale-95
                ${playing === s.id
                  ? "bg-[oklch(0.72_0.27_130)] border-[oklch(0.56_0.25_130)] text-white shadow-lg scale-[1.02]"
                  : "bg-white border-[oklch(0.90_0.015_130)] hover:border-[oklch(0.72_0.27_130)] hover:bg-[oklch(0.97_0.04_130)] text-gray-800 shadow-sm"
                }
              `}
            >
              <span className="text-2xl w-8 text-center flex-shrink-0">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className={`font-black text-base leading-tight ${playing === s.id ? "text-white" : "text-gray-800"}`}>
                  {s.name}
                  {s.id === "chime" && (
                    <span className={`ml-2 text-xs font-normal px-1.5 py-0.5 rounded-full ${playing === s.id ? "bg-white/25 text-white" : "bg-[oklch(0.93_0.08_130)] text-[oklch(0.45_0.18_130)]"}`}>
                      current
                    </span>
                  )}
                </div>
                <div className={`text-xs mt-0.5 ${playing === s.id ? "text-white/80" : "text-gray-400"}`}>
                  {s.description}
                </div>
              </div>
              <span className={`text-base transition-transform duration-150 ${playing === s.id ? "scale-125" : "opacity-40"}`}>
                {playing === s.id ? "🔊" : "▶"}
              </span>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-5 font-body">
          Tell me which one you like and it'll be applied instantly
        </p>
      </div>
    </div>
  );
}
