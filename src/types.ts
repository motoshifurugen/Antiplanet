// Core types for Antiplanet MVP

/**
 * Planet-wide goal configuration
 */
export type PlanetGoal = {
  title: string;
  deadline: string; // ISO date string (YYYY-MM-DD)
};

/**
 * Civilization development states (legacy - kept for backward compatibility)
 */
export type CivState = 'uninitialized' | 'developing' | 'decaying' | 'ocean';

/**
 * Civilization level classifications based on cultural and growth levels
 */
export type CivLevel = 'grassland' | 'village' | 'town' | 'city';

/**
 * Individual civilization levels
 */
export type CivilizationLevels = {
  culturalLevel: number; // 0-100, affects building count
  growthLevel: number;   // 0-100, affects land size
  totalLevel: number;    // (culturalLevel + growthLevel) / 2
  classification: CivLevel; // derived from totalLevel
};

/**
 * Individual civilization entity
 */
export type Civilization = {
  id: string;
  name: string;
  purpose?: string;
  deadline: string; // ISO date string (YYYY-MM-DD)
  state: CivState; // stored last-known state (legacy)
  levels: CivilizationLevels; // new level system
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
export type UpdateCivilizationRequest = Partial<
  Pick<Civilization, 'name' | 'purpose' | 'deadline' | 'state'>
>;
export type CreateProgressLogRequest = Omit<ProgressLog, 'id' | 'createdAt'>;
