// Firebase configuration and utilities
// Firebase v11 (modular v9+ API) for Expo SDK 53

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getFirestore,
  Firestore,
  FieldValue,
  serverTimestamp as firestoreServerTimestamp,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  enableNetwork,
  disableNetwork,
  connectFirestoreEmulator,
} from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Initialize Firebase app (singleton pattern)
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase services with AsyncStorage persistence
let auth: Auth;
try {
  if (getApps().length === 0) {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } else {
    auth = getAuth(app);
  }
} catch (error) {
  // Fallback to default auth if initializeAuth fails
  auth = getAuth(app);
}

export { auth };
export const db: Firestore = getFirestore(app);

// Enable offline persistence for better UX
// Note: This is automatically enabled in React Native
// The SDK handles offline caching and syncing automatically

// Export the app instance
export { app };

// Network control utilities for testing
export const goOffline = () => disableNetwork(db);
export const goOnline = () => enableNetwork(db);

// Helper functions
export const serverTimestamp = (): FieldValue => {
  return firestoreServerTimestamp();
};

/**
 * Get server time by creating a temporary document
 * This is useful for getting the actual server timestamp value
 */
export const getServerTime = async (): Promise<Date> => {
  try {
    const tempDocRef = doc(db, 'temp', 'servertime');
    await setDoc(tempDocRef, { timestamp: serverTimestamp() });

    const docSnap = await getDoc(tempDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Clean up the temporary document
      await deleteDoc(tempDocRef);
      return data.timestamp.toDate();
    }

    // Fallback to local time if something goes wrong
    return new Date();
  } catch (error) {
    console.warn('Failed to get server time, using local time:', error);
    return new Date();
  }
};
