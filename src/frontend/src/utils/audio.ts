let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.3,
): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + duration,
    );

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Audio not supported
  }
}

export function playSuccessSound(): void {
  playTone(523, 0.15, "sine", 0.3);
  setTimeout(() => playTone(659, 0.15, "sine", 0.3), 150);
  setTimeout(() => playTone(784, 0.25, "sine", 0.3), 300);
}

export function playCorrectSound(): void {
  playTone(660, 0.1, "sine", 0.25);
  setTimeout(() => playTone(880, 0.2, "sine", 0.25), 100);
}

export function playWrongSound(): void {
  playTone(220, 0.15, "sawtooth", 0.2);
  setTimeout(() => playTone(180, 0.25, "sawtooth", 0.15), 150);
}

export function playTapSound(): void {
  playTone(440, 0.08, "sine", 0.15);
}

export function playCelebrationSound(): void {
  const notes = [523, 587, 659, 698, 784, 880, 988, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.15, "sine", 0.25), i * 80);
  });
}

// ─── MP3 Letter Audio ──────────────────────────────────────────────────────────

// Letters that have user-supplied mp3 phonetic recordings
const MP3_LETTERS = new Set([
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
]);

// Phonetic fallback sounds for u–z (speech synthesis)
const PHONETIC_FALLBACK: Record<string, string> = {
  u: "uh",
  v: "vuh",
  w: "wuh",
  x: "ks",
  y: "yuh",
  z: "zuh",
};

// Cache of loaded HTMLAudioElement instances
const audioCache = new Map<string, HTMLAudioElement>();

/**
 * Preload all mp3 letter files at app startup.
 * Call once from App.tsx or the first page that needs audio.
 * Fire-and-forget — errors are handled gracefully.
 */
export async function preloadLetterAudio(): Promise<void> {
  const preloadPromises = Array.from(MP3_LETTERS).map(
    (letter) =>
      new Promise<void>((resolve) => {
        if (audioCache.has(letter)) {
          resolve();
          return;
        }
        const audio = new Audio(`/assets/audio/${letter}.mp3`);
        audio.preload = "auto";
        audio.oncanplaythrough = () => {
          audioCache.set(letter, audio);
          resolve();
        };
        audio.onerror = () => {
          console.warn(`Could not preload audio for letter: ${letter}`);
          resolve();
        };
        audio.load();
        // Don't block startup for more than 3 seconds
        setTimeout(resolve, 3000);
      }),
  );
  await Promise.all(preloadPromises);
}

/**
 * Play an HTMLAudioElement and return a Promise that resolves when playback ENDS.
 * Resolves on error or after a safety timeout so sequences never hang.
 */
function playAudioToEnd(audio: HTMLAudioElement): Promise<void> {
  return new Promise<void>((resolve) => {
    const cleanup = () => {
      audio.onended = null;
      audio.onerror = null;
      resolve();
    };
    audio.onended = cleanup;
    // onerror fires with an Event, not necessarily an Error — ignore the value
    audio.onerror = () => cleanup();
    audio.currentTime = 0;
    audio.play().catch(() => cleanup());
    // Safety net: resolve after 5 seconds at the latest
    setTimeout(cleanup, 5000);
  });
}

/**
 * Speak text using speech synthesis and return a Promise that resolves when
 * the utterance ends (or after a 700ms approximation as fallback).
 */
function speakTextAsync(text: string, rate = 0.85, pitch = 0.9): Promise<void> {
  return new Promise<void>((resolve) => {
    if (!("speechSynthesis" in window)) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 1;

    const voice = selectMaleVoice();
    if (voice) utterance.voice = voice;

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    // Fallback: resolve after 700ms in case onend never fires
    setTimeout(resolve, 700);

    if (!window.speechSynthesis.getVoices().length) {
      const handler = () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handler);
        const v = selectMaleVoice();
        if (v) utterance.voice = v;
        window.speechSynthesis.speak(utterance);
      };
      window.speechSynthesis.addEventListener("voiceschanged", handler);
      return;
    }

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Play the phonetic sound for a letter.
 * Tries user-supplied mp3 first (a–t), falls back to speech synthesis (u–z).
 * Returns a Promise that resolves when audio ENDS (not when it starts).
 */
export async function playLetterPhonetic(letter: string): Promise<void> {
  const lower = letter.toLowerCase();

  if (MP3_LETTERS.has(lower)) {
    // Try cached audio element first
    const cached = audioCache.get(lower);
    if (cached) {
      try {
        return await playAudioToEnd(cached);
      } catch {
        console.warn(`Cached mp3 play failed for ${letter}, trying fresh load`);
      }
    }

    // Try loading fresh
    try {
      const audio = new Audio(`/assets/audio/${lower}.mp3`);
      audioCache.set(lower, audio);
      return await playAudioToEnd(audio);
    } catch {
      console.warn(
        `Fresh mp3 load failed for ${letter}, falling back to speech`,
      );
    }
  }

  // Fallback: speech synthesis with phonetic text — resolves when utterance ends
  const soundText = PHONETIC_FALLBACK[lower] ?? lower;
  return speakTextAsync(soundText, 0.85, 0.9);
}

/**
 * Play a sequence of letter phonetic sounds sequentially.
 * Each letter plays fully before the next begins.
 * A short 120ms pause is inserted between letters for natural pacing.
 * Used by the "Say it!" button in Making Words.
 */
export async function playLetterSequence(letters: string[]): Promise<void> {
  for (let i = 0; i < letters.length; i++) {
    await playLetterPhonetic(letters[i]);
    if (i < letters.length - 1) {
      // Short gap between letters so they sound distinct, not blurred
      await new Promise<void>((r) => setTimeout(r, 120));
    }
  }
}

// ─── Speech Synthesis (word/sentence pronunciation) ───────────────────────────

// Male voice preference list — tried in order
const MALE_VOICE_NAMES = [
  "Google UK English Male",
  "Microsoft David Desktop",
  "Microsoft David",
  "Alex",
  "Daniel",
  "Fred",
];

function selectMaleVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // 1. Try exact preferred name match
  for (const preferred of MALE_VOICE_NAMES) {
    const match = voices.find(
      (v) => v.name.toLowerCase() === preferred.toLowerCase(),
    );
    if (match) return match;
  }

  // 2. Try any voice with "male" in the name
  const maleByName = voices.find((v) => v.name.toLowerCase().includes("male"));
  if (maleByName) return maleByName;

  // 3. Try any voice with common male names
  const maleByKnown = voices.find((v) => {
    const n = v.name.toLowerCase();
    return (
      n.includes("david") ||
      n.includes("daniel") ||
      n.includes("fred") ||
      n.includes("alex") ||
      n.includes("mark") ||
      n.includes("james") ||
      n.includes("george")
    );
  });
  if (maleByKnown) return maleByKnown;

  // 4. Fall back to first English voice
  const english = voices.find((v) => v.lang.startsWith("en"));
  return english ?? voices[0];
}

/**
 * Speak text using a clear, comfortable male voice.
 * IMPORTANT: Always pass the full phonetic string (e.g. "buh", "cuh") —
 * never pass a single letter character, as the browser will read it as a
 * letter name ("bee", "see") instead of a phonetic sound.
 */
export function speakText(text: string, rate = 0.85, pitch = 0.9): void {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = 1;

  const voice = selectMaleVoice();
  if (voice) utterance.voice = voice;

  // If voices not loaded yet, wait for voiceschanged then speak
  if (!window.speechSynthesis.getVoices().length) {
    const handler = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
      const v = selectMaleVoice();
      if (v) utterance.voice = v;
      window.speechSynthesis.speak(utterance);
    };
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    return;
  }

  window.speechSynthesis.speak(utterance);
}

export function speakLetter(letter: string): void {
  // Use mp3-backed playLetterPhonetic for proper phonetic sounds
  void playLetterPhonetic(letter);
}

export function speakWord(word: string): void {
  speakText(word, 0.75, 0.9);
}

export function speakPhonics(sounds: string[]): void {
  // Join phonetic strings with a space so the engine blends them naturally
  const text = sounds.join(" ");
  speakText(text, 0.7, 0.9);
}
