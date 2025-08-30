// Placeholder for utilities
// Future: Firebase, Three.js, and other utilities will be added here

export const utils = {
  formatDate: (date: Date): string => {
    return date.toISOString().split('T')[0];
  },
  generateId: (): string => {
    return Math.random().toString(36).substr(2, 9);
  },
};
