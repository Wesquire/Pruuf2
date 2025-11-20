/**
 * Date Utilities
 * Common date formatting and manipulation functions
 */

import { formatDistance, format, isToday, isYesterday } from 'date-fns';

/**
 * Format date for display: "Nov 18, 2025"
 */
export function formatDate(date: Date | string): string {
  return format(new Date(date), 'MMM d, yyyy');
}

/**
 * Format date and time: "Nov 18, 2025 at 10:00 AM"
 */
export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
}

/**
 * Format time only: "10:00 AM"
 */
export function formatTime(date: Date | string): string {
  return format(new Date(date), 'h:mm a');
}

/**
 * Get relative time: "2 hours ago", "in 5 minutes"
 */
export function getRelativeTime(date: Date | string): string {
  return formatDistance(new Date(date), new Date(), { addSuffix: true });
}

/**
 * Format with "today" or "yesterday"
 */
export function formatWithRelativeDay(date: Date | string): string {
  const dateObj = new Date(date);

  if (isToday(dateObj)) {
    return `Today at ${formatTime(dateObj)}`;
  }

  if (isYesterday(dateObj)) {
    return `Yesterday at ${formatTime(dateObj)}`;
  }

  return formatDateTime(dateObj);
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Calculate days until a date
 */
export function daysUntil(targetDate: Date | string): number {
  const target = new Date(targetDate);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | string): boolean {
  return new Date(date) < new Date();
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date | string): boolean {
  return new Date(date) > new Date();
}
