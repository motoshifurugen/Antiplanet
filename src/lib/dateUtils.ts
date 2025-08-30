// Date utility functions

/**
 * Format relative time from timestamp to now
 */
export const formatRelativeTime = (timestamp?: number): string => {
  if (!timestamp) {
    return 'Never';
  }

  const now = Date.now();
  const diffMs = now - timestamp;
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffMinutes = Math.floor(diffMs / (60 * 1000));

  if (diffDays > 0) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }

  if (diffHours > 0) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }

  return 'Just now';
};

/**
 * Format ISO date string to display format
 */
export const formatDate = (isoDate: string): string => {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString();
  } catch {
    return isoDate;
  }
};

/**
 * Calculate remaining days until deadline
 * Returns positive number for future dates, negative for past dates
 */
export const calculateRemainingDays = (deadline: string): number | null => {
  try {
    const deadlineDate = new Date(deadline);
    const now = new Date();

    // Reset time to compare only dates
    deadlineDate.setHours(23, 59, 59, 999); // End of deadline day
    now.setHours(0, 0, 0, 0); // Start of current day

    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

    return diffDays;
  } catch {
    return null;
  }
};

/**
 * Format remaining days text
 */
export const formatRemainingDays = (deadline: string): string => {
  const days = calculateRemainingDays(deadline);

  if (days === null) {
    return 'Invalid date';
  }

  if (days === 0) {
    return 'Due today';
  } else if (days === 1) {
    return '1 day remaining';
  } else if (days > 1) {
    return `${days} days remaining`;
  } else if (days === -1) {
    return '1 day overdue';
  } else {
    return `${Math.abs(days)} days overdue`;
  }
};
