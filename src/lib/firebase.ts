// Firebase configuration and utilities
// Firebase v11 (modular v9+ API) for Expo SDK 53

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import Constants from 'expo-constants';
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

// Firebase configuration from Expo Constants
const firebaseExtraConfig = Constants.expoConfig?.extra?.firebase;

// Runtime guard: Ensure all required Firebase keys are present
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseExtraConfig?.[key]);

if (missingKeys.length > 0) {
  throw new Error(
    `Missing Firebase configuration keys: ${missingKeys.join(', ')}. ` +
    'Please check your .env file and app.config.ts'
  );
}

const firebaseConfig = {
  apiKey: firebaseExtraConfig.apiKey,
  authDomain: firebaseExtraConfig.authDomain,
  projectId: firebaseExtraConfig.projectId,
  storageBucket: firebaseExtraConfig.storageBucket,
  messagingSenderId: firebaseExtraConfig.messagingSenderId,
  appId: firebaseExtraConfig.appId,
};

// デバッグ用：設定値を確認（APIキーはマスク）
console.log('Firebase Config Debug:', {
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'undefined',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 20)}...` : 'undefined',
});

// Initialize Firebase app (singleton pattern)
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase Auth with simplified configuration
let auth: Auth;
try {
  // Use default auth initialization to avoid compatibility issues
  auth = getAuth(app);
  console.log('Firebase Auth initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase Auth:', error);
  throw error;
}

export { auth };
export const db: Firestore = getFirestore(app);

// Enable offline persistence for better UX
// Note: This is automatically enabled in React Native
// The SDK handles offline caching and syncing automatically

// Export the app instance
export { app };

// Authentication utilities
export const signInAnonymously = async (): Promise<string> => {
  try {
    const { user } = await import('firebase/auth').then(({ signInAnonymously }) => 
      signInAnonymously(auth)
    );
    console.log('Signed in anonymously with UID:', user.uid);
    return user.uid;
  } catch (error) {
    console.error('Failed to sign in anonymously:', error);
    throw error;
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const onAuthStateChanged = (callback: (user: any) => void) => {
  return auth.onAuthStateChanged(callback);
};

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
