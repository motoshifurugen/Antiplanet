import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/app/navigation/RootNavigator';
import { runCivilizationStateMachineTests } from './src/lib/__tests__/civilizationStateMachine.test';
import { useAppStore } from './src/stores';

export default function App() {
  const loadAll = useAppStore(state => state.loadAll);

  useEffect(() => {
    // Run self-tests in development only
    runCivilizationStateMachineTests();
    
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
