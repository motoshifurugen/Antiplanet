// Sample data for testing in Expo Go
// Creates 5 civilizations with different ranks (states)

import { Civilization, CivState } from '../types';

/**
 * Generate sample civilizations with different states
 * Each state represents a different rank/development level
 */
export const createSampleCivilizations = (): Civilization[] => {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const oneWeekMs = 7 * oneDayMs;
  const twoWeeksMs = 14 * oneDayMs;
  const threeWeeksMs = 21 * oneDayMs;

  return [
    // 1. Developing civilization (highest rank) - recently active
    {
      id: 'sample-civ-1',
      name: '持続可能なエネルギー開発',
      purpose: '太陽光発電システムの研究開発を毎日進める',
      deadline: '2024-12-31',
      state: 'developing' as CivState,
      lastProgressAt: now - (2 * oneDayMs), // 2 days ago
      createdAt: now - (30 * oneDayMs), // 30 days ago
      updatedAt: now - (2 * oneDayMs),
    },

    // 2. Decaying civilization (medium rank) - moderately stale
    {
      id: 'sample-civ-2',
      name: '海洋環境保護プロジェクト',
      purpose: '海洋プラスチック問題の解決策を研究する',
      deadline: '2024-11-15',
      state: 'decaying' as CivState,
      lastProgressAt: now - (10 * oneDayMs), // 10 days ago
      createdAt: now - (45 * oneDayMs), // 45 days ago
      updatedAt: now - (10 * oneDayMs),
    },

    // 3. Uninitialized civilization (lowest rank) - never had progress
    {
      id: 'sample-civ-3',
      name: '宇宙探査技術革新',
      purpose: '火星探査機の設計と開発',
      deadline: '2025-03-20',
      state: 'uninitialized' as CivState,
      lastProgressAt: undefined, // Never had progress
      createdAt: now - (5 * oneDayMs), // 5 days ago
      updatedAt: now - (5 * oneDayMs),
    },

    // 4. Ocean civilization (inactive) - very stale
    {
      id: 'sample-civ-4',
      name: '古代文明の謎解き',
      purpose: '失われた古代技術の復元研究',
      deadline: '2024-10-30',
      state: 'ocean' as CivState,
      lastProgressAt: now - (25 * oneDayMs), // 25 days ago
      createdAt: now - (60 * oneDayMs), // 60 days ago
      updatedAt: now - (25 * oneDayMs),
    },

    // 5. Another developing civilization - recently active
    {
      id: 'sample-civ-5',
      name: 'AI倫理ガイドライン策定',
      purpose: '人工知能の倫理的使用に関する指針を作成',
      deadline: '2024-12-15',
      state: 'developing' as CivState,
      lastProgressAt: now - (1 * oneDayMs), // 1 day ago
      createdAt: now - (20 * oneDayMs), // 20 days ago
      updatedAt: now - (1 * oneDayMs),
    },
  ];
};

/**
 * Sample planet goal for testing
 */
export const createSamplePlanetGoal = () => {
  return {
    title: '地球環境の持続可能な発展',
    deadline: '2025-12-31',
  };
};

/**
 * Check if sample data should be seeded
 * Only seed if no civilizations exist
 */
export const shouldSeedSampleData = (existingCivilizations: Civilization[]): boolean => {
  return existingCivilizations.length === 0;
};
