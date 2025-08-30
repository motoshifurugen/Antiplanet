// Planet Goal repository - handles planet-wide goals and deadlines

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, serverTimestamp } from '../lib/firebase';
import { planetGoalDoc } from './paths';
import { PlanetGoal } from '../types';

/**
 * Get planet goal for a user
 */
export const getPlanetGoal = async (uid: string): Promise<PlanetGoal | null> => {
  try {
    const docRef = doc(db, planetGoalDoc(uid));
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as PlanetGoal;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get planet goal:', error);
    throw error;
  }
};

/**
 * Set planet goal for a user
 */
export const setPlanetGoal = async (uid: string, goal: PlanetGoal): Promise<void> => {
  try {
    const docRef = doc(db, planetGoalDoc(uid));
    await setDoc(docRef, {
      ...goal,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to set planet goal:', error);
    throw error;
  }
};

/**
 * Update planet goal for a user
 */
export const updatePlanetGoal = async (uid: string, updates: Partial<PlanetGoal>): Promise<void> => {
  try {
    const docRef = doc(db, planetGoalDoc(uid));
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to update planet goal:', error);
    throw error;
  }
};
