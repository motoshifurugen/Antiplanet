import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/app/navigation/RootNavigator';
import { runCivilizationStateMachineTests } from './src/lib/__tests__/civilizationStateMachine.test';

export default function App() {
  useEffect(() => {
    // Run self-tests in development only
    runCivilizationStateMachineTests();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <RootNavigator />
    </>
  );
}
