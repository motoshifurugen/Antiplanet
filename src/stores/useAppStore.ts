// Global Zustand store for app state management

import { create } from 'zustand';
import {
  PlanetGoal,
  Civilization,
  CreateCivilizationRequest,
  UpdateCivilizationRequest,
  CreateProgressLogRequest,
  ProgressMemo,
  CreateProgressMemoRequest,
  UpdateProgressMemoRequest,
} from '../types';
import {
  deriveCivilizationState,
  shouldPersistStateTransition,
  calculateCivilizationLevels,
} from '../lib/civilizationStateMachine';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  createSampleCivilizations, 
  createSamplePlanetGoal, 
  shouldSeedSampleData 
} from '../lib/sampleData';
import {
  createProgressMemo,
  updateProgressMemo,
  getTodayProgressMemo,
  getProgressMemos,
  hasTodayProgressMemo,
} from '../repositories/progressMemoRepository';

// Local storage keys
const STORAGE_KEYS = {
  PLANET_GOAL: 'planet_goal',
  CIVILIZATIONS: 'civilizations',
  PROGRESS_LOGS: 'progress_logs',
} as const;

// Local storage helpers
const saveToStorage = async (key: string, data: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save ${key}:`, error);
  }
};

const loadFromStorage = async (key: string) => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Failed to load ${key}:`, error);
    return null;
  }
};

interface AppState {
  // State
  uid: string | null;
  isAuthenticated: boolean;
  planetGoal: PlanetGoal | null;
  civilizations: Civilization[];
  loading: boolean;
  authLoading: boolean;
  
  // Toast state
  toast: {
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  };

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
  logProgress: (id: string, note?: string) => Promise<void>;

  // Progress memo actions
  createProgressMemo: (civId: string, data: CreateProgressMemoRequest) => Promise<string>;
  updateProgressMemo: (civId: string, data: UpdateProgressMemoRequest) => Promise<void>;
  getTodayProgressMemo: (civId: string) => Promise<ProgressMemo | null>;
  getProgressMemos: (civId: string) => Promise<ProgressMemo[]>;
  hasTodayProgressMemo: (civId: string) => Promise<boolean>;

  // State derivation
  deriveCivStates: () => Promise<void>;

  // Sample data seeding
  seedSampleData: () => Promise<void>;
  
  // Toast actions
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  uid: null,
  isAuthenticated: false,
  planetGoal: null,
  civilizations: [],
  loading: false,
  authLoading: false,
  
  // Toast initial state
  toast: {
    visible: false,
    message: '',
    type: 'info' as const,
  },

  // Initialize authentication - Local storage based
  initializeAuth: async () => {
    set({ authLoading: true });
    
    try {
      // Use local storage based authentication
      const localUid = 'local-user-' + Date.now();
      console.log('Using local storage authentication:', localUid);
      set({ 
        uid: localUid, 
        isAuthenticated: true, 
        authLoading: false 
      });
    } catch (error) {
      console.error('Failed to initialize authentication:', error);
      set({ authLoading: false });
      throw error;
    }
  },

  // Load all data - Local storage based
  loadAll: async () => {
    const { uid, isAuthenticated } = get();
    
    if (!isAuthenticated || !uid) {
      console.warn('Cannot load data: not authenticated');
      return;
    }

    set({ loading: true });

    try {
      // Load planet goal from local storage
      const planetGoal = await loadFromStorage(STORAGE_KEYS.PLANET_GOAL);
      if (planetGoal) {
        set({ planetGoal });
      }

      // Load civilizations from local storage
      const loadedCivilizations = await loadFromStorage(STORAGE_KEYS.CIVILIZATIONS);
      if (loadedCivilizations) {
        set({ civilizations: loadedCivilizations });
      }

      // Derive states after loading
      await get().deriveCivStates();

      // Seed sample data if no civilizations exist
      const { civilizations } = get();
      if (shouldSeedSampleData(civilizations)) {
        console.log('No civilizations found, seeding sample data...');
        await get().seedSampleData();
      }
    } catch (error) {
      console.error('Failed to load all data:', error);
    } finally {
      set({ loading: false });
    }
  },

  // Load planet goal - Local storage based
  loadPlanetGoal: async () => {
    const { uid } = get();
    
    if (!uid) {
      console.warn('Cannot load planet goal: no UID');
      return;
    }

    try {
      const goal = await loadFromStorage(STORAGE_KEYS.PLANET_GOAL);
      if (goal) {
        set({ planetGoal: goal });
      }
    } catch (error) {
      console.error('Failed to load planet goal:', error);
      throw error;
    }
  },

  // Load civilizations - Local storage based
  loadCivilizations: async () => {
    const { uid } = get();
    
    if (!uid) {
      console.warn('Cannot load civilizations: no UID');
      return;
    }

    try {
      const civilizations = await loadFromStorage(STORAGE_KEYS.CIVILIZATIONS);
      if (civilizations) {
        set({ civilizations });
      }
    } catch (error) {
      console.error('Failed to load civilizations:', error);
      throw error;
    }
  },

  // Save planet goal - Local storage based
  savePlanetGoal: async (goal: PlanetGoal) => {
    const { uid } = get();
    
    if (!uid) {
      console.warn('Cannot save planet goal: no UID');
      throw new Error('Not authenticated');
    }

    try {
      await saveToStorage(STORAGE_KEYS.PLANET_GOAL, goal);
      set({ planetGoal: goal });
      console.log('Planet goal saved to local storage');
    } catch (error) {
      console.error('Failed to save planet goal:', error);
      throw error;
    }
  },

  // Create civilization - Local storage based
  createCiv: async (data: CreateCivilizationRequest) => {
    const { uid } = get();
    
    if (!uid) {
      console.warn('Cannot create civilization: no UID');
      throw new Error('Not authenticated');
    }

    try {
      const civId = 'civ-' + Date.now();
      const civilization: Civilization = {
        ...data,
        id: civId,
        levels: {
          culturalLevel: 0,
          growthLevel: 0,
          totalLevel: 0,
          classification: 'grassland',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Add to local civilizations
      const { civilizations } = get();
      const updatedCivilizations = [...civilizations, civilization];
      await saveToStorage(STORAGE_KEYS.CIVILIZATIONS, updatedCivilizations);
      set({ civilizations: updatedCivilizations });

      await get().deriveCivStates();
      console.log('Civilization created and saved to local storage');
      return civId;
    } catch (error) {
      console.error('Failed to create civilization:', error);
      throw error;
    }
  },

  // Update civilization - Local storage based
  updateCiv: async (id: string, patch: UpdateCivilizationRequest) => {
    const { uid } = get();
    
    if (!uid) {
      console.warn('Cannot update civilization: no UID');
      throw new Error('Not authenticated');
    }

    try {
      const { civilizations } = get();
      const updatedCivilizations = civilizations.map(civ => 
        civ.id === id 
          ? { ...civ, ...patch, updatedAt: Date.now() }
          : civ
      );
      
      await saveToStorage(STORAGE_KEYS.CIVILIZATIONS, updatedCivilizations);
      set({ civilizations: updatedCivilizations });
      console.log('Civilization updated and saved to local storage');
    } catch (error) {
      console.error('Failed to update civilization:', error);
      throw error;
    }
  },

  // Delete civilization - Local storage based
  deleteCiv: async (id: string) => {
    const { uid } = get();
    
    if (!uid) {
      console.warn('Cannot delete civilization: no UID');
      throw new Error('Not authenticated');
    }

    try {
      const { civilizations } = get();
      const updatedCivilizations = civilizations.filter(civ => civ.id !== id);
      
      await saveToStorage(STORAGE_KEYS.CIVILIZATIONS, updatedCivilizations);
      set({ civilizations: updatedCivilizations });
      console.log('Civilization deleted and saved to local storage');
    } catch (error) {
      console.error('Failed to delete civilization:', error);
      throw error;
    }
  },

  // Refresh single civilization - Local storage based
  refreshCiv: async (id: string) => {
    const { uid } = get();
    
    if (!uid) {
      console.warn('Cannot refresh civilization: no UID');
      return;
    }

    try {
      // Reload all civilizations from storage
      await get().loadCivilizations();
      await get().deriveCivStates();
    } catch (error) {
      console.error('Failed to refresh civilization:', error);
      throw error;
    }
  },

  // Log progress for a civilization - Local storage based
  logProgress: async (id: string, note?: string) => {
    const { uid } = get();
    
    if (!uid) {
      console.warn('Cannot log progress: no UID');
      throw new Error('Not authenticated');
    }

    try {
      // Update civilization's lastProgressAt timestamp
      const { civilizations } = get();
      const updatedCivilizations = civilizations.map(civ => 
        civ.id === id 
          ? { ...civ, lastProgressAt: Date.now(), updatedAt: Date.now() }
          : civ
      );
      
      await saveToStorage(STORAGE_KEYS.CIVILIZATIONS, updatedCivilizations);
      set({ civilizations: updatedCivilizations });
      
      // Create progress log entry
      const progressLog = {
        id: 'log-' + Date.now(),
        civId: id,
        createdAt: Date.now(),
        note: note || undefined,
      };
      
      const existingLogs = await loadFromStorage(STORAGE_KEYS.PROGRESS_LOGS) || [];
      const updatedLogs = [...existingLogs, progressLog];
      await saveToStorage(STORAGE_KEYS.PROGRESS_LOGS, updatedLogs);
      
      console.log('Progress logged and saved to local storage');
    } catch (error) {
      console.error('Failed to log progress:', error);
      throw error;
    }
  },

  // Create progress memo for a civilization
  createProgressMemo: async (civId: string, data: CreateProgressMemoRequest) => {
    const { uid } = get();
    
    if (!uid) {
      console.warn('Cannot create progress memo: no UID');
      throw new Error('Not authenticated');
    }

    try {
      const memoId = await createProgressMemo(civId, data);
      console.log('Progress memo created:', memoId);
      return memoId;
    } catch (error) {
      console.error('Failed to create progress memo:', error);
      throw error;
    }
  },

  // Update progress memo for a civilization
  updateProgressMemo: async (civId: string, data: UpdateProgressMemoRequest) => {
    const { uid } = get();
    
    if (!uid) {
      console.warn('Cannot update progress memo: no UID');
      throw new Error('Not authenticated');
    }

    try {
      await updateProgressMemo(civId, data);
      console.log('Progress memo updated');
    } catch (error) {
      console.error('Failed to update progress memo:', error);
      throw error;
    }
  },

  // Get today's progress memo for a civilization
  getTodayProgressMemo: async (civId: string) => {
    const { uid } = get();
    
    if (!uid) {
      console.warn('Cannot get today\'s progress memo: no UID');
      return null;
    }

    try {
      return await getTodayProgressMemo(civId);
    } catch (error) {
      console.error('Failed to get today\'s progress memo:', error);
      return null;
    }
  },

  // Get all progress memos for a civilization
  getProgressMemos: async (civId: string) => {
    const { uid } = get();
    
    if (!uid) {
      console.warn('Cannot get progress memos: no UID');
      return [];
    }

    try {
      return await getProgressMemos(civId);
    } catch (error) {
      console.error('Failed to get progress memos:', error);
      return [];
    }
  },

  // Check if civilization has progress memo for today
  hasTodayProgressMemo: async (civId: string) => {
    const { uid } = get();
    
    if (!uid) {
      console.warn('Cannot check today\'s progress memo: no UID');
      return false;
    }

    try {
      return await hasTodayProgressMemo(civId);
    } catch (error) {
      console.error('Failed to check today\'s progress memo:', error);
      return false;
    }
  },

  // Derive current states and levels for all civilizations - Local storage based
  deriveCivStates: async () => {
    const { civilizations, uid } = get();
    
    if (!uid) {
      console.warn('Cannot derive states: no UID');
      return;
    }
    
    const now = Date.now();

    // Load progress logs for level calculation
    const progressLogs = await loadFromStorage(STORAGE_KEYS.PROGRESS_LOGS) || [];
    console.log('Progress logs loaded:', progressLogs.length);

    const updatedCivilizations = civilizations.map(civ => {
      // Derive current state based on staleness
      const derivedState = deriveCivilizationState(now, civ.lastProgressAt);

      // Calculate levels based on progress logs
      const civProgressLogs = progressLogs
        .filter((log: any) => log.civId === civ.id)
        .map((log: any) => log.createdAt);
      
      console.log(`Civilization ${civ.name} progress logs:`, civProgressLogs.length);
      
      // Use existing levels if available (for sample data), otherwise calculate from progress logs
      const levels = civ.levels || calculateCivilizationLevels(now, civProgressLogs);
      console.log(`Civilization ${civ.name} final levels:`, levels);

      // Check if we need to persist state transition
      const needsPersist = shouldPersistStateTransition(derivedState, civ.state);

      // If persistence is needed, update local storage
      if (needsPersist) {
        // Async update without blocking UI
        const { civilizations: currentCivs } = get();
        const updatedCivs = currentCivs.map(c => 
          c.id === civ.id ? { ...c, state: derivedState, updatedAt: Date.now() } : c
        );
        
        saveToStorage(STORAGE_KEYS.CIVILIZATIONS, updatedCivs)
          .then(() => {
            console.log(
              `Persisted state transition for ${civ.name}: ${civ.state} → ${derivedState}`
            );
          })
          .catch(error => {
            console.error(`Failed to persist state for ${civ.name}:`, error);
          });
      }

      // Return civilization with derived state and calculated levels
      return {
        ...civ,
        state: derivedState, // Use derived state for display
        levels,
      };
    });

    set({ civilizations: updatedCivilizations });
  },

  // Seed sample data for testing
  seedSampleData: async () => {
    const { uid } = get();
    
    if (!uid) {
      console.warn('Cannot seed sample data: no UID');
      throw new Error('Not authenticated');
    }

    try {
      // Create sample civilizations
      const sampleCivilizations = createSampleCivilizations();
      
      // Save civilizations to local storage
      await saveToStorage(STORAGE_KEYS.CIVILIZATIONS, sampleCivilizations);
      set({ civilizations: sampleCivilizations });

      // Create sample planet goal if none exists
      const { planetGoal } = get();
      if (!planetGoal) {
        const samplePlanetGoal = createSamplePlanetGoal();
        await saveToStorage(STORAGE_KEYS.PLANET_GOAL, samplePlanetGoal);
        set({ planetGoal: samplePlanetGoal });
      }

      // Derive states for sample data
      await get().deriveCivStates();
      
      console.log('Sample data seeded successfully:', {
        civilizations: sampleCivilizations.length,
        planetGoal: !!planetGoal,
      });
    } catch (error) {
      console.error('Failed to seed sample data:', error);
      throw error;
    }
  },

  // Toast actions
  showToast: (message: string, type: 'success' | 'error' | 'info') => {
    set({
      toast: {
        visible: true,
        message,
        type,
      },
    });
  },

  hideToast: () => {
    console.log('hideToast called');
    set({
      toast: {
        visible: false,
        message: '',
        type: 'info',
      },
    });
  },
}));
