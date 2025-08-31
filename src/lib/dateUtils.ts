// Date utility functions

/**
 * Format relative time from timestamp to now
 */
export const formatRelativeTime = (timestamp?: number): string => {
  if (!timestamp) {
    return '未記録';
  }

  const now = Date.now();
  const diffMs = now - timestamp;
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffMinutes = Math.floor(diffMs / (60 * 1000));

  if (diffDays > 0) {
    return `${diffDays}日前`;
  }

  if (diffHours > 0) {
    return `${diffHours}時間前`;
  }

  if (diffMinutes > 0) {
    return `${diffMinutes}分前`;
  }

  return '今';
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
    return '無効な日付';
  }

  if (days === 0) {
    return '今日が期限';
  } else if (days === 1) {
    return '残り1日';
  } else if (days > 1) {
    return `残り${days}日`;
  } else if (days === -1) {
    return '1日超過';
  } else {
    return `${Math.abs(days)}日超過`;
  }
};
