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
  note?: string; // optional memo for progress entry
};

/**
 * Daily progress memo entry for civilization history tracking
 */
export type ProgressMemo = {
  id: string;
  civId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  memo: string; // required memo (max 50 characters)
  createdAt: number; // server timestamp in milliseconds
  updatedAt: number; // server timestamp in milliseconds
  levelBefore: number; // civilization level before this entry
  levelAfter: number; // civilization level after this entry
  levelChange: number; // level change amount (can be negative)
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
export type CreateProgressMemoRequest = Omit<ProgressMemo, 'id' | 'createdAt' | 'updatedAt' | 'levelBefore' | 'levelAfter' | 'levelChange'>;
export type UpdateProgressMemoRequest = Pick<ProgressMemo, 'memo'>;
