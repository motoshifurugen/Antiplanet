// Global Zustand store for app state management

import { create } from 'zustand';
import {
  PlanetGoal,
  Civilization,
  CreateCivilizationRequest,
  UpdateCivilizationRequest,
  CreateProgressLogRequest,
} from '../types';
import {
  getPlanetGoal,
  setPlanetGoal,
  getCivilizations,
  getCivilization,
  createCivilization,
  updateCivilization,
  deleteCivilization,
  updateCivilizationProgress,
  createProgressLog,
} from '../repositories';
import {
  deriveCivilizationState,
  shouldPersistStateTransition,
} from '../lib/civilizationStateMachine';

// Mock user ID for MVP
const DEMO_UID = 'demo-uid';

interface AppState {
  // State
  uid: string;
  planetGoal: PlanetGoal | null;
  civilizations: Civilization[];
  loading: boolean;

  // Actions
  loadAll: () => Promise<void>;
  loadPlanetGoal: () => Promise<void>;
  loadCivilizations: () => Promise<void>;

  // Planet Goal actions
  savePlanetGoal: (goal: PlanetGoal) => Promise<void>;

  // Civilization actions
  createCiv: (data: CreateCivilizationRequest) => Promise<string>;
  updateCiv: (id: string, patch: UpdateCivilizationRequest) => Promise<void>;
  deleteCiv: (id: string) => Promise<void>;
  refreshCiv: (id: string) => Promise<void>;

  // Progress actions
  logProgress: (id: string) => Promise<void>;

  // State derivation
  deriveCivStates: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  uid: DEMO_UID,
  planetGoal: null,
  civilizations: [],
  loading: false,

  // Load all data
  loadAll: async () => {
    set({ loading: true });

    try {
      await Promise.all([get().loadPlanetGoal(), get().loadCivilizations()]);

      // Derive states after loading
      get().deriveCivStates();
    } catch (error) {
      console.error('Failed to load all data:', error);
    } finally {
      set({ loading: false });
    }
  },

  // Load planet goal
  loadPlanetGoal: async () => {
    const { uid } = get();

    try {
      const goal = await getPlanetGoal(uid);
      set({ planetGoal: goal });
    } catch (error) {
      console.error('Failed to load planet goal:', error);
      throw error;
    }
  },

  // Load civilizations
  loadCivilizations: async () => {
    const { uid } = get();

    try {
      const civilizations = await getCivilizations(uid);
      set({ civilizations });
    } catch (error) {
      console.error('Failed to load civilizations:', error);
      throw error;
    }
  },

  // Save planet goal
  savePlanetGoal: async (goal: PlanetGoal) => {
    const { uid } = get();

    try {
      await setPlanetGoal(uid, goal);
      set({ planetGoal: goal });
    } catch (error) {
      console.error('Failed to save planet goal:', error);
      throw error;
    }
  },

  // Create civilization
  createCiv: async (data: CreateCivilizationRequest) => {
    const { uid } = get();

    try {
      const civId = await createCivilization(uid, data);

      // Refresh civilizations list
      await get().loadCivilizations();
      get().deriveCivStates();

      return civId;
    } catch (error) {
      console.error('Failed to create civilization:', error);
      throw error;
    }
  },

  // Update civilization
  updateCiv: async (id: string, patch: UpdateCivilizationRequest) => {
    const { uid } = get();

    try {
      await updateCivilization(uid, id, patch);

      // Refresh the specific civilization
      await get().refreshCiv(id);
    } catch (error) {
      console.error('Failed to update civilization:', error);
      throw error;
    }
  },

  // Delete civilization
  deleteCiv: async (id: string) => {
    const { uid } = get();

    try {
      await deleteCivilization(uid, id);

      // Remove from local state
      set(state => ({
        civilizations: state.civilizations.filter(civ => civ.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete civilization:', error);
      throw error;
    }
  },

  // Refresh single civilization
  refreshCiv: async (id: string) => {
    const { uid } = get();

    try {
      const civilization = await getCivilization(uid, id);

      if (civilization) {
        set(state => ({
          civilizations: state.civilizations.map(civ => (civ.id === id ? civilization : civ)),
        }));

        get().deriveCivStates();
      }
    } catch (error) {
      console.error('Failed to refresh civilization:', error);
      throw error;
    }
  },

  // Log progress for a civilization
  logProgress: async (id: string) => {
    const { uid } = get();

    try {
      // Create progress log entry
      const progressData: CreateProgressLogRequest = {
        civId: id,
      };
      await createProgressLog(uid, progressData);

      // Update civilization's lastProgressAt timestamp
      await updateCivilizationProgress(uid, id);

      // Refresh the civilization to get updated data
      await get().refreshCiv(id);
    } catch (error) {
      console.error('Failed to log progress:', error);
      throw error;
    }
  },

  // Derive current states for all civilizations
  deriveCivStates: () => {
    const { civilizations } = get();
    const now = Date.now();

    const updatedCivilizations = civilizations.map(civ => {
      // Derive current state based on staleness
      const derivedState = deriveCivilizationState(now, civ.lastProgressAt);

      // Check if we need to persist state transition
      const needsPersist = shouldPersistStateTransition(derivedState, civ.state);

      // If persistence is needed, update Firestore
      if (needsPersist) {
        // Async update without blocking UI
        updateCivilization(get().uid, civ.id, { state: derivedState })
          .then(() => {
            console.log(
              `Persisted state transition for ${civ.name}: ${civ.state} → ${derivedState}`
            );
          })
          .catch(error => {
            console.error(`Failed to persist state for ${civ.name}:`, error);
          });
      }

      // Return civilization with derived state (for display)
      return {
        ...civ,
        state: derivedState, // Use derived state for display
      };
    });

    set({ civilizations: updatedCivilizations });
  },
}));
