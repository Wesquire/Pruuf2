/**
 * Timezone Utilities
 * Handle timezone conversions and formatting
 */

import moment from 'moment-timezone';

/**
 * Get device timezone
 */
export function getDeviceTimezone(): string {
  return moment.tz.guess();
}

/**
 * Get timezone abbreviation (PST, EST, etc.)
 */
export function getTimezoneAbbr(timezone: string): string {
  return moment.tz(timezone).format('z');
}

/**
 * Convert time to specific timezone
 */
export function convertToTimezone(
  time: Date | string,
  timezone: string,
): moment.Moment {
  return moment(time).tz(timezone);
}

/**
 * Format time with timezone: "10:00 AM PST"
 */
export function formatTimeWithTimezone(time: string, timezone: string): string {
  const abbr = getTimezoneAbbr(timezone);
  return `${time} ${abbr}`;
}

/**
 * Calculate countdown to check-in deadline
 */
export function calculateCountdown(
  checkInTime: string,
  timezone: string,
): string {
  const now = moment();
  const [hours, minutes] = checkInTime.split(':').map(Number);

  let deadline = moment.tz(timezone).hours(hours).minutes(minutes).seconds(0);

  // If deadline has passed today, show tomorrow's deadline
  if (deadline.isBefore(now)) {
    deadline.add(1, 'day');
  }

  const duration = moment.duration(deadline.diff(now));
  const hoursLeft = Math.floor(duration.asHours());
  const minutesLeft = duration.minutes();

  if (hoursLeft > 24) {
    return `in ${Math.floor(hoursLeft / 24)} day${
      Math.floor(hoursLeft / 24) > 1 ? 's' : ''
    }`;
  }

  if (hoursLeft > 0) {
    return `in ${hoursLeft} hour${
      hoursLeft > 1 ? 's' : ''
    } ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`;
  }

  return `in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`;
}

/**
 * Check if check-in is late
 */
export function isCheckInLate(
  checkInTime: string,
  timezone: string,
  actualCheckInTime: Date,
): {isLate: boolean; minutesLate: number} {
  const [hours, minutes] = checkInTime.split(':').map(Number);
  const deadline = moment.tz(timezone).hours(hours).minutes(minutes).seconds(0);

  const actual = moment(actualCheckInTime);
  const minutesLate = actual.diff(deadline, 'minutes');

  return {
    isLate: minutesLate > 0,
    minutesLate: minutesLate > 0 ? minutesLate : 0,
  };
}

/**
 * Format relative time: "Today, 9:45 AM" or "Yesterday, 10:00 AM"
 */
export function formatRelativeTime(
  time: Date | string,
  timezone: string,
): string {
  const timeMoment = moment(time).tz(timezone);
  const now = moment().tz(timezone);

  const isToday = timeMoment.isSame(now, 'day');
  const isYesterday = timeMoment.isSame(now.clone().subtract(1, 'day'), 'day');

  if (isToday) {
    return `Today, ${timeMoment.format('h:mm A')}`;
  }

  if (isYesterday) {
    return `Yesterday, ${timeMoment.format('h:mm A')}`;
  }

  return timeMoment.format('MMM D, h:mm A');
}

/**
 * Parse time string to 24-hour format
 */
export function parseTime(timeString: string): {
  hours: number;
  minutes: number;
} {
  const [time, period] = timeString.split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  if (period?.toUpperCase() === 'PM' && hours !== 12) {
    hours += 12;
  }

  if (period?.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }

  return {hours, minutes};
}

/**
 * Format 24-hour time to 12-hour: "14:00" -> "2:00 PM"
 */
export function format24To12Hour(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format 12-hour time to 24-hour: "2:00 PM" -> "14:00"
 */
export function format12To24Hour(time: string): string {
  const {hours, minutes} = parseTime(time);
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;
}
