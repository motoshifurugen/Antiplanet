// Civilization State Machine - deterministic state evaluation based on staleness

import { CivState } from '../types';

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

// Export thresholds for testing
export const STATE_THRESHOLDS = THRESHOLDS;
