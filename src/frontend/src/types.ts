export type LetterColor = "red" | "blue" | "green" | "yellow" | "purple";

export interface FlashcardWord {
  word: string;
  emoji: string;
}

export interface BlendingTask {
  id: string;
  sounds: string[];
  word: string;
  emoji: string;
  hint: string;
}

export interface LetterData {
  letter: string;
  uppercase: string;
  lowercase: string;
  phonicSound: string;
  color: LetterColor;
  words: FlashcardWord[];
  blendingTasks: BlendingTask[];
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  createdAt: number;
}

export interface FlashcardProgress {
  letterId: string;
  wordsSeen: string[];
  completed: boolean;
  lastVisited: number;
}

export interface BlendingProgress {
  letterId: string;
  tasksCompleted: string[];
  score: number;
  completed: boolean;
  lastVisited: number;
}

export interface TracingProgress {
  letterId: string;
  attempts: number;
  completed: boolean;
  lastVisited: number;
}

export interface LessonProgress {
  profileId: string;
  flashcards: Record<string, FlashcardProgress>;
  blending: Record<string, BlendingProgress>;
  tracing: Record<string, TracingProgress>;
  totalStars: number;
  lastUpdated: number;
}

export type AppView =
  | "profiles"
  | "home"
  | "flashcards"
  | "blending"
  | "tracing"
  | "progress";
