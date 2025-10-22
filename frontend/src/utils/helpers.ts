/**
 * Truncate a display string if it exceeds the specified limit
 * @param displayString - The string to truncate
 * @param limit - Maximum length before truncation (default: 15)
 * @returns Truncated string with "..." appended if it was truncated
 */
export const truncateDisplayString = (displayString: string = '', limit = 15): string => {
  return displayString.length > limit ? displayString.slice(0, limit) + '...' : displayString;
};