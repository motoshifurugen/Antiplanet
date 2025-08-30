// Progress Log repository - handles civilization progress tracking

import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, serverTimestamp } from '../lib/firebase';
import { progressCol } from './paths';
import { ProgressLog, CreateProgressLogRequest } from '../types';

/**
 * Create a new progress log entry
 */
export const createProgressLog = async (
  uid: string,
  data: CreateProgressLogRequest
): Promise<string> => {
  try {
    const colRef = collection(db, progressCol(uid, data.civId));

    const docRef = await addDoc(colRef, {
      ...data,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Failed to create progress log:', error);
    throw error;
  }
};

/**
 * Get progress logs for a specific civilization
 */
export const getProgressLogs = async (
  uid: string,
  civId: string,
  limitCount: number = 50
): Promise<ProgressLog[]> => {
  try {
    const colRef = collection(db, progressCol(uid, civId));
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as ProgressLog[];
  } catch (error) {
    console.error('Failed to get progress logs:', error);
    throw error;
  }
};

/**
 * Get latest progress log for a civilization
 */
export const getLatestProgressLog = async (
  uid: string,
  civId: string
): Promise<ProgressLog | null> => {
  try {
    const logs = await getProgressLogs(uid, civId, 1);
    return logs.length > 0 ? logs[0] : null;
  } catch (error) {
    console.error('Failed to get latest progress log:', error);
    throw error;
  }
};
