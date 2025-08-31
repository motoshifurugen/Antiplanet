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
import { signInAnonymously, getCurrentUser, onAuthStateChanged } from '../lib/firebase';

interface AppState {
  // State
  uid: string | null;
  isAuthenticated: boolean;
  planetGoal: PlanetGoal | null;
  civilizations: Civilization[];
  loading: boolean;
  authLoading: boolean;

  // Actions
  initializeAuth: () => Promise<void>;
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
  uid: null,
  isAuthenticated: false,
  planetGoal: null,
  civilizations: [],
  loading: false,
  authLoading: false,

  // Initialize authentication
  initializeAuth: async () => {
    set({ authLoading: true });
    
    try {
      // Set up auth state listener for persistence
      onAuthStateChanged((user) => {
        if (user) {
          console.log('Auth state changed - User signed in:', user.uid);
          set({ 
            uid: user.uid, 
            isAuthenticated: true, 
            authLoading: false 
          });
        } else {
          console.log('Auth state changed - User signed out');
          set({ 
            uid: null, 
            isAuthenticated: false, 
            authLoading: false 
          });
        }
      });

      // Check if user is already signed in
      const currentUser = getCurrentUser();
      if (currentUser) {
        console.log('User already signed in:', currentUser.uid);
        set({ 
          uid: currentUser.uid, 
          isAuthenticated: true, 
          authLoading: false 
        });
        return;
      }

      // Sign in anonymously
      console.log('Signing in anonymously...');
      const uid = await signInAnonymously();
      set({ 
        uid, 
        isAuthenticated: true, 
        authLoading: false 
      });
    } catch (error) {
      console.error('Failed to initialize authentication:', error);
      set({ authLoading: false });
      throw error;
    }
  },

  // Load all data (only after authentication)
  loadAll: async () => {
    const { uid, isAuthenticated } = get();
    
    if (!isAuthenticated || !uid) {
      console.warn('Cannot load data: not authenticated');
      return;
    }

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
    
    if (!uid) {
      console.warn('Cannot load planet goal: no UID');
      return;
    }

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
    
    if (!uid) {
      console.warn('Cannot load civilizations: no UID');
      return;
    }

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
    
    if (!uid) {
      console.warn('Cannot save planet goal: no UID');
      throw new Error('Not authenticated');
    }

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
    
    if (!uid) {
      console.warn('Cannot create civilization: no UID');
      throw new Error('Not authenticated');
    }

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
    
    if (!uid) {
      console.warn('Cannot update civilization: no UID');
      throw new Error('Not authenticated');
    }

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
    
    if (!uid) {
      console.warn('Cannot delete civilization: no UID');
      throw new Error('Not authenticated');
    }

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
    
    if (!uid) {
      console.warn('Cannot refresh civilization: no UID');
      return;
    }

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
    
    if (!uid) {
      console.warn('Cannot log progress: no UID');
      throw new Error('Not authenticated');
    }

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
    const { civilizations, uid } = get();
    
    if (!uid) {
      console.warn('Cannot derive states: no UID');
      return;
    }
    
    const now = Date.now();

    const updatedCivilizations = civilizations.map(civ => {
      // Derive current state based on staleness
      const derivedState = deriveCivilizationState(now, civ.lastProgressAt);

      // Check if we need to persist state transition
      const needsPersist = shouldPersistStateTransition(derivedState, civ.state);

      // If persistence is needed, update Firestore
      if (needsPersist) {
        // Async update without blocking UI
        updateCivilization(uid, civ.id, { state: derivedState })
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
