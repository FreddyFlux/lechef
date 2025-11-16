/**
 * Format a date to a short format (e.g., "Jan 15")
 */
export function formatShortDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a date to a long format (e.g., "January 15, 2024")
 */
export function formatLongDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a week date range (e.g., "Jan 15 - Jan 21, 2024")
 */
export function formatWeekDateRange(weekStartDate: number): {
  start: string;
  end: string;
  full: string;
} {
  const date = new Date(weekStartDate);
  const endDate = new Date(weekStartDate);
  endDate.setDate(endDate.getDate() + 6);

  return {
    start: formatShortDate(weekStartDate),
    end: endDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    full: formatLongDate(weekStartDate),
  };
}

/**
 * Get the start of the week (Monday) for a given date
 */
export function getWeekStartDate(date: Date): number {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
}

/**
 * Format a day index to a date string for a given week start
 */
export function formatDayDate(weekStartDate: number, dayIndex: number): string {
  const date = new Date(weekStartDate);
  date.setDate(date.getDate() + dayIndex);
  return formatShortDate(date.getTime());
}

