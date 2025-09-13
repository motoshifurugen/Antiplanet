// Sample data for testing in Expo Go
// Creates 4 civilizations covering all level classifications (grassland, village, town, city)

import { Civilization, CivState, CivilizationLevels } from '../types';

/**
 * Generate sample civilizations covering all 4 level classifications
 * Each civilization represents a different development stage
 */
export const createSampleCivilizations = (): Civilization[] => {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const oneWeekMs = 7 * oneDayMs;
  const twoWeeksMs = 14 * oneDayMs;
  const threeWeeksMs = 21 * oneDayMs;

  // Helper function to create sample levels
  const createSampleLevels = (culturalLevel: number, growthLevel: number): CivilizationLevels => {
    const totalLevel = (culturalLevel + growthLevel) / 2;
    let classification: 'grassland' | 'village' | 'town' | 'city';
    if (totalLevel >= 75) classification = 'city';
    else if (totalLevel >= 50) classification = 'town';
    else if (totalLevel >= 25) classification = 'village';
    else classification = 'grassland';
    
    return {
      culturalLevel,
      growthLevel,
      totalLevel: Math.round(totalLevel),
      classification,
    };
  };

  return [
    // 1. 草原レベル - 未初期化文明（進捗なし）
    {
      id: 'sample-civ-1',
      name: '宇宙探査技術革新',
      purpose: '火星探査機の設計と開発',
      deadline: '2025-03-20',
      state: 'uninitialized' as CivState,
      levels: createSampleLevels(0, 0), // No progress - grassland
      lastProgressAt: undefined, // Never had progress
      createdAt: now - (5 * oneDayMs), // 5 days ago
      updatedAt: now - (5 * oneDayMs),
    },

    // 2. 村レベル - 初期段階の文明
    {
      id: 'sample-civ-2',
      name: '持続可能な農業プロジェクト',
      purpose: '有機農業技術の研究と実践',
      deadline: '2024-12-15',
      state: 'developing' as CivState,
      levels: createSampleLevels(30, 35), // Low-medium levels - village
      lastProgressAt: now - (5 * oneDayMs), // 5 days ago
      createdAt: now - (20 * oneDayMs), // 20 days ago
      updatedAt: now - (5 * oneDayMs),
    },

    // 3. 町レベル - 中程度の発展
    {
      id: 'sample-civ-3',
      name: '海洋環境保護プロジェクト',
      purpose: '海洋プラスチック問題の解決策を研究する',
      deadline: '2024-11-15',
      state: 'developing' as CivState,
      levels: createSampleLevels(55, 60), // Medium levels - town
      lastProgressAt: now - (3 * oneDayMs), // 3 days ago
      createdAt: now - (45 * oneDayMs), // 45 days ago
      updatedAt: now - (3 * oneDayMs),
    },

    // 4. 都市レベル - 高度に発展した文明
    {
      id: 'sample-civ-4',
      name: 'AI倫理ガイドライン策定',
      purpose: '人工知能の倫理的使用に関する指針を作成',
      deadline: '2024-12-31',
      state: 'developing' as CivState,
      levels: createSampleLevels(85, 90), // High levels - city
      lastProgressAt: now - (1 * oneDayMs), // 1 day ago
      createdAt: now - (60 * oneDayMs), // 60 days ago
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
