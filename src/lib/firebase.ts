// Firebase configuration and utilities
// Firebase v11 (modular v9+ API) for Expo SDK 53

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  FieldValue,
  serverTimestamp as firestoreServerTimestamp,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
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

// Initialize Firebase services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Export the app instance
export { app };

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
