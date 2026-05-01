import { PHONICS_DATA } from "../data/phonicsData";
import type { MatchPair, QuizLevel } from "../types";

const ROUND_SIZE = 5;

/** Pick `count` random items from an array without repeating. */
function sampleRandom<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < count && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

/** Shuffle an array in-place using Fisher-Yates and return it. */
export function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Level 1 – Uppercase letter ↔ lowercase letter
 * left: "A", right: "a"
 */
export function generateLevel1Pairs(): MatchPair[] {
  const letters = sampleRandom(PHONICS_DATA, ROUND_SIZE);
  return letters.map((l, i) => ({
    id: `l1-${i}`,
    left: l.uppercase,
    right: l.lowercase,
    matched: false,
    incorrect: false,
  }));
}

/**
 * Level 2 – Uppercase word ↔ lowercase word
 * Uses the first word from each letter's word list.
 * left: "APPLE", right: "apple"
 */
export function generateLevel2Pairs(): MatchPair[] {
  const letters = sampleRandom(PHONICS_DATA, ROUND_SIZE);
  return letters.map((l, i) => {
    const word = l.words[0].word;
    return {
      id: `l2-${i}`,
      left: word.toUpperCase(),
      right: word.toLowerCase(),
      matched: false,
      incorrect: false,
    };
  });
}

/**
 * Level 3 – Emoji picture ↔ lowercase word
 * Uses the first word's emoji from each letter's word list.
 * left: "🍎", right: "apple"
 */
export function generateLevel3Pairs(): MatchPair[] {
  const letters = sampleRandom(PHONICS_DATA, ROUND_SIZE);
  return letters.map((l, i) => {
    const { word, emoji } = l.words[0];
    return {
      id: `l3-${i}`,
      left: emoji,
      right: word.toLowerCase(),
      matched: false,
      incorrect: false,
    };
  });
}

export function generatePairs(level: QuizLevel): MatchPair[] {
  if (level === 1) return generateLevel1Pairs();
  if (level === 2) return generateLevel2Pairs();
  return generateLevel3Pairs();
}
