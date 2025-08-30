// Firestore collection and document path builders
// Centralized path management for consistent data structure

/**
 * User document path
 * Contains user profile and settings
 */
export const userDoc = (uid: string): string => {
  return `users/${uid}`;
};

/**
 * Planet goal document path
 * Contains planet-wide goals and deadlines for a specific user
 */
export const planetGoalDoc = (uid: string): string => {
  return `users/${uid}/planet/goals`;
};

/**
 * Civilizations collection path
 * Contains all civilizations for a specific user's planet
 */
export const civilizationsCol = (uid: string): string => {
  return `users/${uid}/civilizations`;
};

/**
 * Specific civilization document path
 * Contains individual civilization data
 */
export const civilizationDoc = (uid: string, id: string): string => {
  return `users/${uid}/civilizations/${id}`;
};

/**
 * Progress collection path for a specific civilization
 * Contains progress entries, milestones, and historical data
 */
export const progressCol = (uid: string, civId: string): string => {
  return `users/${uid}/civilizations/${civId}/progress`;
};

/**
 * Progress document path for a specific entry
 * Contains individual progress entry data
 */
export const progressDoc = (uid: string, civId: string, progressId: string): string => {
  return `users/${uid}/civilizations/${civId}/progress/${progressId}`;
};

// Example of how these paths will be used:
// - User profile: users/{uid}
// - Planet goals: users/{uid}/planet/goals
// - All civilizations: users/{uid}/civilizations
// - Specific civilization: users/{uid}/civilizations/{civId}
// - Civilization progress: users/{uid}/civilizations/{civId}/progress
// - Specific progress entry: users/{uid}/civilizations/{civId}/progress/{progressId}
