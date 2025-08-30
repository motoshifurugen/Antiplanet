// Utilities and core library functions

export const utils = {
  formatDate: (date: Date): string => {
    return date.toISOString().split('T')[0];
  },
  generateId: (): string => {
    return Math.random().toString(36).substr(2, 9);
  },
};

// Re-export civilization state machine
export * from './civilizationStateMachine';

// Re-export date utilities
export * from './dateUtils';
