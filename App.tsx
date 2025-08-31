import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/navigation/RootNavigator';
import { useAppStore } from './src/stores';

export default function App() {
  const { initializeAuth, loadAll } = useAppStore(state => ({
    initializeAuth: state.initializeAuth,
    loadAll: state.loadAll,
  }));

  useEffect(() => {
    // Initialize authentication first, then load data
    const initializeApp = async () => {
      try {
        await initializeAuth();
        await loadAll();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, [initializeAuth, loadAll]);

  return (
    <>
      <StatusBar style="light" />
      <RootNavigator />
    </>
  );
}
