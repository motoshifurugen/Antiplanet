// Civilization State Machine - deterministic state evaluation based on staleness
// Updated to support new level-based system

import { CivState, CivLevel, CivilizationLevels } from '../types';

// State transition thresholds (in days)
const THRESHOLDS = {
  DEVELOPING_TO_DECAYING: 7,
  DECAYING_TO_OCEAN: 21,
} as const;

// Convert days to milliseconds
const DAYS_TO_MS = 24 * 60 * 60 * 1000;

/**
 * Derives the current civilization state based on staleness since last progress
 * This is deterministic and evaluated on-demand without timers
 *
 * @param now Current timestamp in milliseconds
 * @param lastProgressAt Last progress timestamp in milliseconds (undefined if no progress)
 * @returns Current civilization state
 */
export const deriveCivilizationState = (now: number, lastProgressAt?: number): CivState => {
  // No last progress → uninitialized
  if (!lastProgressAt) {
    return 'uninitialized';
  }

  const daysSinceProgress = (now - lastProgressAt) / DAYS_TO_MS;

  // 0–6 days since last progress → developing
  if (daysSinceProgress < THRESHOLDS.DEVELOPING_TO_DECAYING) {
    return 'developing';
  }

  // 7–20 days since last progress → decaying
  if (daysSinceProgress < THRESHOLDS.DECAYING_TO_OCEAN) {
    return 'decaying';
  }

  // 21+ days since last progress → ocean
  return 'ocean';
};

/**
 * Determines if a persisted state transition is required
 * Returns true only when:
 * - Derived state is 'decaying' or 'ocean'
 * - AND differs from the previously stored state
 *
 * Note: Returning to 'developing' is visual-only for MVP (no persistence)
 *
 * @param derivedState Current derived state
 * @param storedState Previously stored state
 * @returns Whether to persist the state transition
 */
export const shouldPersistStateTransition = (
  derivedState: CivState,
  storedState: CivState
): boolean => {
  // Only persist transitions into decaying or ocean states
  if (derivedState !== 'decaying' && derivedState !== 'ocean') {
    return false;
  }

  // Only persist if the state has actually changed
  return derivedState !== storedState;
};

/**
 * Evaluates civilization state with persistence decision
 * Convenience function that combines state derivation and persistence logic
 *
 * @param now Current timestamp in milliseconds
 * @param lastProgressAt Last progress timestamp in milliseconds
 * @param storedState Previously stored state
 * @returns Object with derived state and whether to persist
 */
export const evaluateCivilizationState = (
  now: number,
  lastProgressAt?: number,
  storedState?: CivState
) => {
  const derivedState = deriveCivilizationState(now, lastProgressAt);
  const shouldPersist = shouldPersistStateTransition(derivedState, storedState || 'uninitialized');

  return {
    derivedState,
    shouldPersist,
  };
};

/**
 * Calculate civilization levels based on progress frequency and staleness
 * Cultural level: Based on recent progress frequency (last 30 days)
 * Growth level: Based on overall progress consistency (last 90 days)
 * Total level: Average of cultural and growth levels
 * Classification: Derived from total level ranges
 */
export const calculateCivilizationLevels = (
  now: number,
  progressLogs: number[] // Array of progress timestamps
): CivilizationLevels => {
  const DAYS_TO_MS = 24 * 60 * 60 * 1000;
  const CULTURAL_PERIOD = 30; // 30 days for cultural level
  const GROWTH_PERIOD = 90;   // 90 days for growth level
  
  // Filter progress logs within the periods
  const culturalLogs = progressLogs.filter(
    timestamp => (now - timestamp) <= (CULTURAL_PERIOD * DAYS_TO_MS)
  );
  const growthLogs = progressLogs.filter(
    timestamp => (now - timestamp) <= (GROWTH_PERIOD * DAYS_TO_MS)
  );
  
  // Calculate cultural level (0-100) based on recent activity
  const culturalLevel = Math.min(100, (culturalLogs.length / 10) * 100);
  
  // Calculate growth level (0-100) based on overall consistency
  const growthLevel = Math.min(100, (growthLogs.length / 20) * 100);
  
  // Calculate total level
  const totalLevel = (culturalLevel + growthLevel) / 2;
  
  // Determine classification based on total level
  let classification: CivLevel;
  if (totalLevel >= 75) {
    classification = 'city';
  } else if (totalLevel >= 50) {
    classification = 'town';
  } else if (totalLevel >= 25) {
    classification = 'village';
  } else {
    classification = 'grassland';
  }
  
  return {
    culturalLevel: Math.round(culturalLevel),
    growthLevel: Math.round(growthLevel),
    totalLevel: Math.round(totalLevel),
    classification,
  };
};

// Export thresholds for testing
export const STATE_THRESHOLDS = THRESHOLDS;
