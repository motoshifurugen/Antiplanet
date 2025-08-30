import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/navigation/RootNavigator';
import { useAppStore } from './src/stores';

export default function App() {
  const loadAll = useAppStore(state => state.loadAll);

  useEffect(() => {
    // Initialize app data
    loadAll().catch(error => {
      console.error('Failed to initialize app data:', error);
    });
  }, [loadAll]);

  return (
    <>
      <StatusBar style="light" />
      <RootNavigator />
    </>
  );
}
