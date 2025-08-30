// Civilization repository - handles CRUD operations for civilizations

import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db, serverTimestamp } from '../lib/firebase';
import { civilizationsCol, civilizationDoc } from './paths';
import { Civilization, CreateCivilizationRequest, UpdateCivilizationRequest } from '../types';

/**
 * Get all civilizations for a user
 */
export const getCivilizations = async (uid: string): Promise<Civilization[]> => {
  try {
    const colRef = collection(db, civilizationsCol(uid));
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Civilization[];
  } catch (error) {
    console.error('Failed to get civilizations:', error);
    throw error;
  }
};

/**
 * Get a specific civilization by ID
 */
export const getCivilization = async (uid: string, civId: string): Promise<Civilization | null> => {
  try {
    const docRef = doc(db, civilizationDoc(uid, civId));
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Civilization;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get civilization:', error);
    throw error;
  }
};

/**
 * Create a new civilization
 */
export const createCivilization = async (uid: string, data: CreateCivilizationRequest): Promise<string> => {
  try {
    const colRef = collection(db, civilizationsCol(uid));
    const now = serverTimestamp();
    
    const docRef = await addDoc(colRef, {
      ...data,
      state: data.state || 'uninitialized',
      createdAt: now,
      updatedAt: now,
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Failed to create civilization:', error);
    throw error;
  }
};

/**
 * Update an existing civilization
 */
export const updateCivilization = async (uid: string, civId: string, updates: UpdateCivilizationRequest): Promise<void> => {
  try {
    const docRef = doc(db, civilizationDoc(uid, civId));
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to update civilization:', error);
    throw error;
  }
};

/**
 * Delete a civilization
 */
export const deleteCivilization = async (uid: string, civId: string): Promise<void> => {
  try {
    const docRef = doc(db, civilizationDoc(uid, civId));
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete civilization:', error);
    throw error;
  }
};

/**
 * Update civilization progress timestamp
 */
export const updateCivilizationProgress = async (uid: string, civId: string): Promise<void> => {
  try {
    const docRef = doc(db, civilizationDoc(uid, civId));
    await updateDoc(docRef, {
      lastProgressAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to update civilization progress:', error);
    throw error;
  }
};
