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

export function speakText(text: string, rate = 0.85, pitch = 1.1): void {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

export function speakLetter(letter: string): void {
  speakText(letter, 0.7, 1.2);
}

export function speakWord(word: string): void {
  speakText(word, 0.8, 1.0);
}

export function speakPhonics(sounds: string[]): void {
  const text = sounds.join("... ");
  speakText(text, 0.65, 1.1);
}
