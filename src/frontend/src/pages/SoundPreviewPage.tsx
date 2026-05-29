import { useState } from "react";

function getAudioContext(): AudioContext {
  return new AudioContext();
}

const sounds = [
  {
    id: "playful",
    name: "Playful Chime",
    emoji: "🎠",
    description: "Bouncy up-down-up 3-note hop",
    play: () => {
      const ctx = getAudioContext();
      ([[ 784, 0, 0.18], [659, 0.13, 0.14], [1047, 0.24, 0.28]] as [number, number, number][]).forEach(([freq, delay, dur]) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine"; osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + dur + 0.05);
      });
    },
  },
  {
    id: "soft-chime",
    name: "Soft Chime",
    emoji: "🎶",
    description: "Gentle low 3-note rise",
    play: () => {
      const ctx = getAudioContext();
      ([[ 523, 0, 0.15], [659, 0.15, 0.15], [784, 0.30, 0.25]] as [number, number, number][]).forEach(([freq, delay, dur]) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine"; osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + dur + 0.05);
      });
    },
  },
  {
    id: "bright-chime",
    name: "Bright Chime",
    emoji: "🎵",
    description: "Crisp high 3-note rise (currently applied)",
    play: () => {
      const ctx = getAudioContext();
      ([
        { freq: 1047, delay: 0, dur: 0.7, vol: 0.22 },
        { freq: 1319, delay: 0.08, dur: 0.55, vol: 0.16 },
        { freq: 1568, delay: 0.18, dur: 0.45, vol: 0.12 },
      ]).forEach(n => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine"; osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.delay);
        gain.gain.setValueAtTime(0, ctx.currentTime + n.delay);
        gain.gain.linearRampToValueAtTime(n.vol, ctx.currentTime + n.delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.delay + n.dur);
        osc.start(ctx.currentTime + n.delay); osc.stop(ctx.currentTime + n.delay + n.dur);
      });
    },
  },
  {
    id: "twinkle",
    name: "Twinkle",
    emoji: "⭐",
    description: "Quick 2-note ding-ding",
    play: () => {
      const ctx = getAudioContext();
      ([[ 1047, 0, 0.22], [1319, 0.16, 0.30]] as [number, number, number][]).forEach(([freq, delay, dur]) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine"; osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + dur + 0.05);
      });
    },
  },
  {
    id: "crystal",
    name: "Crystal Bell",
    emoji: "🔮",
    description: "Pure single bell with warm overtone",
    play: () => {
      const ctx = getAudioContext();
      [[880, 0.28], [1760, 0.08]] .forEach(([freq, vol]) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine"; osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 1.0);
      });
    },
  },
  {
    id: "pop-chime",
    name: "Pop + Chime",
    emoji: "🎈",
    description: "Little pop then a bright ding",
    play: () => {
      const ctx = getAudioContext();
      // pop
      const pop = ctx.createOscillator(); const popGain = ctx.createGain();
      pop.connect(popGain); popGain.connect(ctx.destination);
      pop.type = "sine";
      pop.frequency.setValueAtTime(600, ctx.currentTime);
      pop.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
      popGain.gain.setValueAtTime(0.25, ctx.currentTime);
      popGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      pop.start(ctx.currentTime); pop.stop(ctx.currentTime + 0.12);
      // ding
      const ding = ctx.createOscillator(); const dingGain = ctx.createGain();
      ding.connect(dingGain); dingGain.connect(ctx.destination);
      ding.type = "sine"; ding.frequency.setValueAtTime(1175, ctx.currentTime + 0.1);
      dingGain.gain.setValueAtTime(0, ctx.currentTime + 0.1);
      dingGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.11);
      dingGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      ding.start(ctx.currentTime + 0.1); ding.stop(ctx.currentTime + 0.75);
    },
  },
  {
    id: "marimba",
    name: "Marimba Tap",
    emoji: "🪵",
    description: "Warm wooden 3-note tap",
    play: () => {
      const ctx = getAudioContext();
      ([[ 659, 0, 0.25], [784, 0.12, 0.22], [1047, 0.22, 0.30]] as [number, number, number][]).forEach(([freq, delay, dur]) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "triangle"; osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.28, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + dur + 0.05);
      });
    },
  },
  {
    id: "fairy",
    name: "Fairy Dust",
    emoji: "🧚",
    description: "Rapid sparkly up-sweep",
    play: () => {
      const ctx = getAudioContext();
      [784, 988, 1175, 1568, 1976].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine"; osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.045);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.045);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.045 + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.045 + 0.22);
        osc.start(ctx.currentTime + i * 0.045); osc.stop(ctx.currentTime + i * 0.045 + 0.25);
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
                  {s.id === "bright-chime" && (
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
