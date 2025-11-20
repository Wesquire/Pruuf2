/**
 * Timezone Utilities with DST Support
 * Uses moment-timezone for accurate timezone calculations including DST transitions
 */

import moment from 'npm:moment-timezone@0.6.0';

/**
 * Calculate the check-in deadline for today in the member's timezone
 * Handles DST transitions automatically
 *
 * @param checkInTime - Time in HH:MM format (e.g., "14:30")
 * @param timezone - IANA timezone name (e.g., "America/New_York")
 * @returns Date object representing the deadline in UTC
 */
export function calculateDeadlineInTimezone(
  checkInTime: string,
  timezone: string
): Date {
  // Parse the check-in time
  const [hours, minutes] = checkInTime.split(':').map(Number);

  // Create a moment in the member's timezone for today at their check-in time
  const deadlineMoment = moment.tz(timezone)
    .hours(hours)
    .minutes(minutes)
    .seconds(0)
    .milliseconds(0);

  // Convert to JavaScript Date (in UTC)
  return deadlineMoment.toDate();
}

/**
 * Calculate the reminder time in UTC
 * Subtracts reminder minutes from check-in time and accounts for DST
 *
 * @param checkInTime - Time in HH:MM format (e.g., "14:30")
 * @param timezone - IANA timezone name (e.g., "America/New_York")
 * @param reminderMinutesBefore - How many minutes before check-in time to send reminder
 * @returns Date object representing the reminder time in UTC
 */
export function calculateReminderTime(
  checkInTime: string,
  timezone: string,
  reminderMinutesBefore: number
): Date {
  // Parse the check-in time
  const [hours, minutes] = checkInTime.split(':').map(Number);

  // Create a moment in the member's timezone for today at their check-in time
  const checkInMoment = moment.tz(timezone)
    .hours(hours)
    .minutes(minutes)
    .seconds(0)
    .milliseconds(0);

  // Subtract reminder minutes
  const reminderMoment = checkInMoment.subtract(reminderMinutesBefore, 'minutes');

  // Convert to JavaScript Date (in UTC)
  return reminderMoment.toDate();
}

/**
 * Get the start of today (midnight) in the member's timezone
 * Handles DST transitions (e.g., when midnight doesn't exist or occurs twice)
 *
 * @param timezone - IANA timezone name (e.g., "America/New_York")
 * @returns ISO string representing midnight today in the specified timezone (in UTC)
 */
export function getTodayStartInTimezone(timezone: string): string {
  const startOfDay = moment.tz(timezone)
    .startOf('day'); // Sets time to 00:00:00.000

  return startOfDay.toISOString();
}

/**
 * Get the end of today (23:59:59.999) in the member's timezone
 * Handles DST transitions
 *
 * @param timezone - IANA timezone name (e.g., "America/New_York")
 * @returns ISO string representing end of today in the specified timezone (in UTC)
 */
export function getTodayEndInTimezone(timezone: string): string {
  const endOfDay = moment.tz(timezone)
    .endOf('day'); // Sets time to 23:59:59.999

  return endOfDay.toISOString();
}

/**
 * Get the current timezone offset in hours (including DST)
 * This is useful for debugging and logging
 *
 * @param timezone - IANA timezone name (e.g., "America/New_York")
 * @returns Offset in hours (e.g., -5 for EST, -4 for EDT)
 */
export function getTimezoneOffset(timezone: string): number {
  const offsetMinutes = moment.tz.zone(timezone)?.utcOffset(Date.now()) || 0;
  // moment-timezone returns offset in minutes (negative for west of UTC)
  // Convert to hours and flip sign to match standard convention
  return -(offsetMinutes / 60);
}

/**
 * Check if a timezone is currently observing DST
 *
 * @param timezone - IANA timezone name (e.g., "America/New_York")
 * @returns true if currently in DST, false otherwise
 */
export function isDST(timezone: string): boolean {
  return moment.tz(timezone).isDST();
}

/**
 * Format a date in the member's timezone
 * Useful for logging and debugging
 *
 * @param date - Date to format
 * @param timezone - IANA timezone name (e.g., "America/New_York")
 * @param format - moment.js format string (default: 'YYYY-MM-DD HH:mm:ss z')
 * @returns Formatted date string
 */
export function formatDateInTimezone(
  date: Date | string,
  timezone: string,
  format: string = 'YYYY-MM-DD HH:mm:ss z'
): string {
  return moment.tz(date, timezone).format(format);
}

/**
 * Get the timezone abbreviation (e.g., "EST", "EDT", "PST", "PDT")
 * Automatically accounts for DST
 *
 * @param timezone - IANA timezone name (e.g., "America/New_York")
 * @returns Timezone abbreviation (e.g., "EST" or "EDT")
 */
export function getTimezoneAbbreviation(timezone: string): string {
  return moment.tz(timezone).format('z');
}

/**
 * Handle DST Spring Forward edge case
 * When check-in time is 2:30 AM on spring forward day, it doesn't exist
 * This function adjusts to 3:30 AM automatically
 *
 * @param checkInTime - Time in HH:MM format
 * @param timezone - IANA timezone name
 * @returns Adjusted Date object or null if time exists
 */
export function handleSpringForwardEdgeCase(
  checkInTime: string,
  timezone: string
): { adjusted: boolean; actualTime: Date } {
  const [hours, minutes] = checkInTime.split(':').map(Number);

  const checkInMoment = moment.tz(timezone)
    .hours(hours)
    .minutes(minutes)
    .seconds(0)
    .milliseconds(0);

  // Check if the time was adjusted due to DST
  const actualHours = checkInMoment.hours();
  const actualMinutes = checkInMoment.minutes();

  const adjusted = actualHours !== hours || actualMinutes !== minutes;

  return {
    adjusted,
    actualTime: checkInMoment.toDate(),
  };
}

/**
 * Handle DST Fall Back edge case
 * When check-in time is 1:30 AM on fall back day, it occurs twice
 * This function uses the first occurrence (before DST ends)
 *
 * @param checkInTime - Time in HH:MM format
 * @param timezone - IANA timezone name
 * @returns Date object for the first occurrence
 */
export function handleFallBackEdgeCase(
  checkInTime: string,
  timezone: string
): Date {
  const [hours, minutes] = checkInTime.split(':').map(Number);

  // Create moment in timezone (will default to first occurrence)
  const checkInMoment = moment.tz(timezone)
    .hours(hours)
    .minutes(minutes)
    .seconds(0)
    .milliseconds(0);

  return checkInMoment.toDate();
}

/**
 * Validate timezone string
 * Checks if the provided timezone is valid according to IANA timezone database
 *
 * @param timezone - Timezone string to validate
 * @returns true if valid, false otherwise
 */
export function isValidTimezone(timezone: string): boolean {
  return moment.tz.zone(timezone) !== null;
}

/**
 * Get all supported US timezones
 * Useful for timezone selection in the app
 *
 * @returns Array of US timezone names
 */
export function getUSTimezones(): string[] {
  return [
    'America/New_York',      // EST/EDT
    'America/Chicago',       // CST/CDT
    'America/Denver',        // MST/MDT
    'America/Phoenix',       // MST (no DST)
    'America/Los_Angeles',   // PST/PDT
    'America/Anchorage',     // AKST/AKDT
    'Pacific/Honolulu',      // HST (no DST)
  ];
}
