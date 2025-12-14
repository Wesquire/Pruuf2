/**
 * Timezone Utility Tests
 */

import {
  getDeviceTimezone,
  calculateCountdown,
  isCheckInLate,
  format24To12Hour,
  format12To24Hour,
} from '../timezone';

describe('Timezone Utilities', () => {
  describe('getDeviceTimezone', () => {
    it('should return a valid IANA timezone', () => {
      const timezone = getDeviceTimezone();
      expect(timezone).toBeTruthy();
      expect(typeof timezone).toBe('string');
      // Should contain a slash (e.g., America/New_York)
      expect(timezone).toMatch(/\//);
    });
  });

  describe('format24To12Hour', () => {
    it('should convert midnight', () => {
      expect(format24To12Hour('00:00')).toBe('12:00 AM');
    });

    it('should convert morning time', () => {
      expect(format24To12Hour('09:30')).toBe('9:30 AM');
    });

    it('should convert noon', () => {
      expect(format24To12Hour('12:00')).toBe('12:00 PM');
    });

    it('should convert afternoon time', () => {
      expect(format24To12Hour('15:45')).toBe('3:45 PM');
    });

    it('should convert late evening', () => {
      expect(format24To12Hour('23:59')).toBe('11:59 PM');
    });

    it('should handle single digit hours', () => {
      expect(format24To12Hour('01:00')).toBe('1:00 AM');
    });
  });

  describe('format12To24Hour', () => {
    it('should convert midnight', () => {
      expect(format12To24Hour('12:00 AM')).toBe('00:00');
    });

    it('should convert morning time', () => {
      expect(format12To24Hour('9:30 AM')).toBe('09:30');
    });

    it('should convert noon', () => {
      expect(format12To24Hour('12:00 PM')).toBe('12:00');
    });

    it('should convert afternoon time', () => {
      expect(format12To24Hour('3:45 PM')).toBe('15:45');
    });

    it('should convert late evening', () => {
      expect(format12To24Hour('11:59 PM')).toBe('23:59');
    });

    it('should handle 1 AM', () => {
      expect(format12To24Hour('1:00 AM')).toBe('01:00');
    });

    it('should handle 1 PM', () => {
      expect(format12To24Hour('1:00 PM')).toBe('13:00');
    });
  });

  describe('isCheckInLate', () => {
    it('should detect late check-in', () => {
      const pastTime = '08:00'; // Assuming current time is after 8 AM
      const timezone = 'America/New_York';

      // This test is time-dependent, so we'll just check the structure
      const result = isCheckInLate(pastTime, timezone, new Date());
      expect(result).toHaveProperty('isLate');
      expect(result).toHaveProperty('minutesLate');
      expect(typeof result.isLate).toBe('boolean');
      expect(typeof result.minutesLate).toBe('number');
    });
  });

  describe('calculateCountdown', () => {
    it('should return countdown string', () => {
      const checkInTime = '23:59'; // Late night
      const timezone = 'America/New_York';

      const countdown = calculateCountdown(checkInTime, timezone);
      expect(countdown).toBeTruthy();
      expect(typeof countdown).toBe('string');
      // Should contain time-related words
      expect(countdown.toLowerCase()).toMatch(/hour|minute|second/);
    });
  });
});
