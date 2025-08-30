// Self-test for civilization state machine - runs only in development

import { deriveCivilizationState, shouldPersistStateTransition } from '../civilizationStateMachine';
import { CivState } from '../../types';

// Convert days to milliseconds for testing
const DAYS_TO_MS = 24 * 60 * 60 * 1000;

/**
 * Self-test utility for civilization state machine
 * Tests several staleness cases and throws if any derived state is incorrect
 * Only runs in development environment
 */
export const runCivilizationStateMachineTests = (): void => {
  // Skip tests in production
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  console.log('🧪 Running civilization state machine self-tests...');

  const now = Date.now();
  const testCases: Array<{
    description: string;
    lastProgressAt?: number;
    expectedState: CivState;
  }> = [
    {
      description: 'No progress → uninitialized',
      lastProgressAt: undefined,
      expectedState: 'uninitialized',
    },
    {
      description: '1 day since progress → developing',
      lastProgressAt: now - 1 * DAYS_TO_MS,
      expectedState: 'developing',
    },
    {
      description: '6 days since progress → developing',
      lastProgressAt: now - 6 * DAYS_TO_MS,
      expectedState: 'developing',
    },
    {
      description: '7 days since progress → decaying',
      lastProgressAt: now - 7 * DAYS_TO_MS,
      expectedState: 'decaying',
    },
    {
      description: '15 days since progress → decaying',
      lastProgressAt: now - 15 * DAYS_TO_MS,
      expectedState: 'decaying',
    },
    {
      description: '20 days since progress → decaying',
      lastProgressAt: now - 20 * DAYS_TO_MS,
      expectedState: 'decaying',
    },
    {
      description: '21 days since progress → ocean',
      lastProgressAt: now - 21 * DAYS_TO_MS,
      expectedState: 'ocean',
    },
    {
      description: '30 days since progress → ocean',
      lastProgressAt: now - 30 * DAYS_TO_MS,
      expectedState: 'ocean',
    },
  ];

  // Test state derivation
  for (const testCase of testCases) {
    const derivedState = deriveCivilizationState(now, testCase.lastProgressAt);

    if (derivedState !== testCase.expectedState) {
      throw new Error(
        `State derivation test failed: ${testCase.description}\n` +
          `Expected: ${testCase.expectedState}, Got: ${derivedState}`
      );
    }
  }

  // Test persistence logic
  const persistenceTests = [
    {
      description: 'uninitialized → developing: no persist',
      derived: 'developing' as CivState,
      stored: 'uninitialized' as CivState,
      shouldPersist: false,
    },
    {
      description: 'developing → decaying: should persist',
      derived: 'decaying' as CivState,
      stored: 'developing' as CivState,
      shouldPersist: true,
    },
    {
      description: 'decaying → ocean: should persist',
      derived: 'ocean' as CivState,
      stored: 'decaying' as CivState,
      shouldPersist: true,
    },
    {
      description: 'decaying → decaying: no persist',
      derived: 'decaying' as CivState,
      stored: 'decaying' as CivState,
      shouldPersist: false,
    },
    {
      description: 'ocean → developing: no persist (visual only)',
      derived: 'developing' as CivState,
      stored: 'ocean' as CivState,
      shouldPersist: false,
    },
  ];

  for (const test of persistenceTests) {
    const result = shouldPersistStateTransition(test.derived, test.stored);

    if (result !== test.shouldPersist) {
      throw new Error(
        `Persistence test failed: ${test.description}\n` +
          `Expected: ${test.shouldPersist}, Got: ${result}`
      );
    }
  }

  console.log('✅ All civilization state machine tests passed!');
};
