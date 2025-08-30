// Core types for Antiplanet MVP

/**
 * Planet-wide goal configuration
 */
export type PlanetGoal = {
  title: string;
  deadline: string; // ISO date string (YYYY-MM-DD)
};

/**
 * Civilization development states
 */
export type CivState = 'uninitialized' | 'developing' | 'decaying' | 'ocean';

/**
 * Individual civilization entity
 */
export type Civilization = {
  id: string;
  name: string;
  purpose?: string;
  deadline: string; // ISO date string (YYYY-MM-DD)
  state: CivState; // stored last-known state
  lastProgressAt?: number; // server timestamp in milliseconds
  createdAt: number; // server timestamp in milliseconds
  updatedAt: number; // server timestamp in milliseconds
};

/**
 * Progress log entry for civilization tracking
 */
export type ProgressLog = {
  id: string;
  civId: string;
  createdAt: number; // server timestamp in milliseconds
};

// Utility types for working with timestamps
export type TimestampMillis = number;
export type ISODateString = string;

// Request/Response types for repositories
export type CreateCivilizationRequest = Omit<Civilization, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCivilizationRequest = Partial<Pick<Civilization, 'name' | 'purpose' | 'deadline' | 'state'>>;
export type CreateProgressLogRequest = Omit<ProgressLog, 'id' | 'createdAt'>;
