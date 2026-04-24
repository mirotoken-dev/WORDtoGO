import { create } from "zustand";
import type { LessonProgress, Profile } from "../types";
import {
  clearProgress,
  createDefaultProgress,
  loadActiveProfileId,
  loadProfiles,
  loadProgress,
  saveActiveProfileId,
  saveProfiles,
  saveProgress,
} from "../utils/storage";

interface AppState {
  profiles: Profile[];
  activeProfileId: string | null;
  progress: LessonProgress | null;

  // Profile actions
  loadFromStorage: () => void;
  addProfile: (name: string, avatar: string) => void;
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  clearActiveProfile: () => void;

  // Progress actions
  updateProgress: (updater: (prev: LessonProgress) => LessonProgress) => void;
  resetProgress: () => void;

  // Derived
  activeProfile: () => Profile | null;
}

const AVATARS = ["🦁", "🐯", "🐻", "🦊", "🐸", "🐙", "🦋", "🐬", "🦄", "🐧"];

export const useAppStore = create<AppState>((set, get) => ({
  profiles: [],
  activeProfileId: null,
  progress: null,

  loadFromStorage: () => {
    const profiles = loadProfiles();
    const activeId = loadActiveProfileId();
    const progress = activeId ? loadProgress(activeId) : null;
    set({
      profiles,
      activeProfileId: activeId,
      progress: progress ?? (activeId ? createDefaultProgress(activeId) : null),
    });
  },

  addProfile: (name, avatar) => {
    const id = `profile_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const newProfile: Profile = {
      id,
      name,
      avatar,
      createdAt: Date.now(),
    };
    const profiles = [...get().profiles, newProfile];
    saveProfiles(profiles);
    set({ profiles });
  },

  deleteProfile: (id) => {
    const profiles = get().profiles.filter((p) => p.id !== id);
    saveProfiles(profiles);
    clearProgress(id);
    const state: Partial<AppState> = { profiles };
    if (get().activeProfileId === id) {
      saveActiveProfileId(null);
      state.activeProfileId = null;
      state.progress = null;
    }
    set(state);
  },

  setActiveProfile: (id) => {
    saveActiveProfileId(id);
    const progress = loadProgress(id) ?? createDefaultProgress(id);
    saveProgress(progress);
    set({ activeProfileId: id, progress });
  },

  clearActiveProfile: () => {
    saveActiveProfileId(null);
    set({ activeProfileId: null, progress: null });
  },

  updateProgress: (updater) => {
    const current = get().progress;
    if (!current) return;
    const next = updater({ ...current, lastUpdated: Date.now() });
    saveProgress(next);
    set({ progress: next });
  },

  resetProgress: () => {
    const id = get().activeProfileId;
    if (!id) return;
    const fresh = createDefaultProgress(id);
    saveProgress(fresh);
    set({ progress: fresh });
  },

  activeProfile: () => {
    const { profiles, activeProfileId } = get();
    return profiles.find((p) => p.id === activeProfileId) ?? null;
  },
}));

export { AVATARS };
