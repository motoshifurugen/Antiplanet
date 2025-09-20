// Progress Memo repository - handles daily progress memo tracking

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProgressMemo, CreateProgressMemoRequest, UpdateProgressMemoRequest } from '../types';
import { calculateCivilizationLevels } from '../lib/civilizationStateMachine';

// Local storage key for progress memos
const STORAGE_KEY = 'progress_memos';

// Local storage helpers
const saveToStorage = async (data: ProgressMemo[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save progress memos:', error);
    throw error;
  }
};

const loadFromStorage = async (): Promise<ProgressMemo[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load progress memos:', error);
    return [];
  }
};

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Calculate level change based on progress frequency
 * - Daily progress: +1 level
 * - Missing days: -1 level per 30 days of inactivity
 * - Level cannot go below 0
 */
const calculateLevelChange = (
  civId: string,
  existingMemos: ProgressMemo[],
  currentLevel: number
): number => {
  const civMemos = existingMemos
    .filter(memo => memo.civId === civId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (civMemos.length === 0) {
    // First memo: start at level 1
    return 1;
  }

  const lastMemo = civMemos[civMemos.length - 1];
  const lastDate = new Date(lastMemo.date);
  const today = new Date();
  const daysSinceLastMemo = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceLastMemo === 0) {
    // Same day: no level change
    return 0;
  } else if (daysSinceLastMemo === 1) {
    // Consecutive day: +1 level
    return 1;
  } else {
    // Multiple days gap: -1 level per 30 days
    const levelDecrease = Math.floor(daysSinceLastMemo / 30);
    return -Math.min(levelDecrease, currentLevel); // Cannot go below 0
  }
};

/**
 * Get all progress memos for a civilization
 */
export const getProgressMemos = async (civId: string): Promise<ProgressMemo[]> => {
  try {
    const allMemos = await loadFromStorage();
    return allMemos
      .filter(memo => memo.civId === civId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Failed to get progress memos:', error);
    throw error;
  }
};

/**
 * Get today's progress memo for a civilization
 */
export const getTodayProgressMemo = async (civId: string): Promise<ProgressMemo | null> => {
  try {
    const today = getTodayDate();
    const allMemos = await loadFromStorage();
    
    return allMemos.find(memo => memo.civId === civId && memo.date === today) || null;
  } catch (error) {
    console.error('Failed to get today\'s progress memo:', error);
    throw error;
  }
};

/**
 * Create a new progress memo for today
 */
export const createProgressMemo = async (
  civId: string,
  data: CreateProgressMemoRequest
): Promise<string> => {
  try {
    const allMemos = await loadFromStorage();
    const today = getTodayDate();
    
    // Check if today's memo already exists
    const existingMemo = allMemos.find(memo => memo.civId === civId && memo.date === today);
    if (existingMemo) {
      throw new Error('今日の進捗メモは既に存在します。編集モードを使用してください。');
    }

    // Calculate level change
    const currentLevel = existingMemo?.levelAfter || 0;
    const levelChange = calculateLevelChange(civId, allMemos, currentLevel);
    const levelAfter = Math.max(0, currentLevel + levelChange);

    const memo: ProgressMemo = {
      id: 'memo-' + Date.now(),
      civId,
      date: today,
      memo: data.memo,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      levelBefore: currentLevel,
      levelAfter,
      levelChange,
    };

    const updatedMemos = [...allMemos, memo];
    await saveToStorage(updatedMemos);

    console.log('Progress memo created:', memo);
    return memo.id;
  } catch (error) {
    console.error('Failed to create progress memo:', error);
    throw error;
  }
};

/**
 * Update today's progress memo
 */
export const updateProgressMemo = async (
  civId: string,
  data: UpdateProgressMemoRequest
): Promise<void> => {
  try {
    const allMemos = await loadFromStorage();
    const today = getTodayDate();
    
    const memoIndex = allMemos.findIndex(memo => memo.civId === civId && memo.date === today);
    if (memoIndex === -1) {
      throw new Error('今日の進捗メモが見つかりません。');
    }

    const updatedMemos = [...allMemos];
    updatedMemos[memoIndex] = {
      ...updatedMemos[memoIndex],
      memo: data.memo,
      updatedAt: Date.now(),
    };

    await saveToStorage(updatedMemos);
    console.log('Progress memo updated:', updatedMemos[memoIndex]);
  } catch (error) {
    console.error('Failed to update progress memo:', error);
    throw error;
  }
};

/**
 * Delete a progress memo
 */
export const deleteProgressMemo = async (memoId: string): Promise<void> => {
  try {
    const allMemos = await loadFromStorage();
    const updatedMemos = allMemos.filter(memo => memo.id !== memoId);
    
    await saveToStorage(updatedMemos);
    console.log('Progress memo deleted:', memoId);
  } catch (error) {
    console.error('Failed to delete progress memo:', error);
    throw error;
  }
};

/**
 * Get progress memo history for a civilization (chronological order)
 */
export const getProgressMemoHistory = async (civId: string): Promise<ProgressMemo[]> => {
  try {
    const allMemos = await loadFromStorage();
    return allMemos
      .filter(memo => memo.civId === civId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error('Failed to get progress memo history:', error);
    throw error;
  }
};

/**
 * Check if civilization has progress memo for today
 */
export const hasTodayProgressMemo = async (civId: string): Promise<boolean> => {
  try {
    const todayMemo = await getTodayProgressMemo(civId);
    return todayMemo !== null;
  } catch (error) {
    console.error('Failed to check today\'s progress memo:', error);
    return false;
  }
};
