import type { LessonProgress, Profile } from "../types";

const PROFILES_KEY = "phonics_profiles";
const PROGRESS_KEY = "phonics_progress";
const ACTIVE_PROFILE_KEY = "phonics_active_profile";

export function saveProfiles(profiles: Profile[]): void {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch {
    console.error("Failed to save profiles");
  }
}

export function loadProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    return raw ? (JSON.parse(raw) as Profile[]) : [];
  } catch {
    return [];
  }
}

export function saveActiveProfileId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_PROFILE_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
  } catch {
    console.error("Failed to save active profile");
  }
}

export function loadActiveProfileId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_PROFILE_KEY);
  } catch {
    return null;
  }
}

export function saveProgress(progress: LessonProgress): void {
  try {
    const key = `${PROGRESS_KEY}_${progress.profileId}`;
    localStorage.setItem(key, JSON.stringify(progress));
  } catch {
    console.error("Failed to save progress");
  }
}

export function loadProgress(profileId: string): LessonProgress | null {
  try {
    const key = `${PROGRESS_KEY}_${profileId}`;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as LessonProgress) : null;
  } catch {
    return null;
  }
}

export function clearProgress(profileId: string): void {
  try {
    const key = `${PROGRESS_KEY}_${profileId}`;
    localStorage.removeItem(key);
  } catch {
    console.error("Failed to clear progress");
  }
}

export function createDefaultProgress(profileId: string): LessonProgress {
  return {
    profileId,
    flashcards: {},
    blending: {},
    tracing: {},
    totalStars: 0,
    lastUpdated: Date.now(),
  };
}
