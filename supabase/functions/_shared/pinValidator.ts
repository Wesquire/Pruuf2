/**
 * PIN Strength Validator
 * Prevents users from choosing weak, common, or easily guessable PINs
 *
 * Validates against:
 * - Sequential patterns (1234, 4321)
 * - Repeated digits (1111, 0000)
 * - Common PINs (most frequently used)
 * - Format requirements (4 digits, numeric only)
 */

/**
 * List of most common PINs to reject
 * Source: Data breach analysis and security research
 */
const COMMON_PINS: Set<string> = new Set([
  // Top 20 most common PINs
  '1234',
  '1111',
  '0000',
  '1212',
  '7777',
  '1004',
  '2000',
  '4444',
  '2222',
  '6969',
  '9999',
  '3333',
  '5555',
  '6666',
  '1122',
  '1313',
  '8888',
  '4321',
  '2001',
  '1010',

  // Dates and patterns
  '0101',
  '1231',
  '1201', // Jan 1, Dec 31, Dec 1
  '0420',
  '1225',
  '0704', // 4/20, Christmas, July 4th
  '1234',
  '2345',
  '3456',
  '4567',
  '5678',
  '6789', // Sequential
  '9876',
  '8765',
  '7654',
  '6543',
  '5432',
  '4321', // Reverse sequential

  // Keyboard patterns
  '2580',
  '1379',
  '2468',
  '1357', // Numeric keypad patterns

  // Repeated pairs
  '1212',
  '2121',
  '1313',
  '3131',
  '1414',
  '4141',
  '1515',
  '5151',
]);

/**
 * Validate PIN format (must be exactly 4 digits)
 *
 * @param pin - PIN to validate
 * @returns true if format is valid
 */
export function validatePinFormat(pin: string): boolean {
  // Handle null/undefined
  if (!pin) {
    return false;
  }

  // Must be exactly 4 characters
  if (pin.length !== 4) {
    return false;
  }

  // Must be all digits
  if (!/^\d{4}$/.test(pin)) {
    return false;
  }

  return true;
}

/**
 * Check if PIN is sequential (ascending or descending)
 *
 * @param pin - PIN to check
 * @returns true if sequential
 */
export function isSequentialPin(pin: string): boolean {
  const digits = pin.split('').map(Number);

  // Check ascending sequence (1234, 2345, etc.)
  let isAscending = true;
  for (let i = 1; i < digits.length; i++) {
    if (digits[i] !== digits[i - 1] + 1) {
      isAscending = false;
      break;
    }
  }

  // Check descending sequence (4321, 5432, etc.)
  let isDescending = true;
  for (let i = 1; i < digits.length; i++) {
    if (digits[i] !== digits[i - 1] - 1) {
      isDescending = false;
      break;
    }
  }

  // Special case: wrapping sequences like 9012
  const isWrappingAscending =
    (digits[0] === 9 &&
      digits[1] === 0 &&
      digits[2] === 1 &&
      digits[3] === 2) ||
    (digits[0] === 8 &&
      digits[1] === 9 &&
      digits[2] === 0 &&
      digits[3] === 1) ||
    (digits[0] === 7 && digits[1] === 8 && digits[2] === 9 && digits[3] === 0);

  return isAscending || isDescending || isWrappingAscending;
}

/**
 * Check if PIN has all repeated digits
 *
 * @param pin - PIN to check
 * @returns true if all digits are the same
 */
export function isRepeatedPin(pin: string): boolean {
  const firstDigit = pin.charAt(0);
  return pin.split('').every(digit => digit === firstDigit);
}

/**
 * Check if PIN is in the common/weak PIN list
 *
 * @param pin - PIN to check
 * @returns true if PIN is common
 */
export function isCommonPin(pin: string): boolean {
  return COMMON_PINS.has(pin);
}

/**
 * Check if PIN contains repeated pairs (e.g., 1212, 3434)
 *
 * @param pin - PIN to check
 * @returns true if contains repeated pair pattern
 */
export function hasRepeatedPairs(pin: string): boolean {
  const firstPair = pin.substring(0, 2);
  const secondPair = pin.substring(2, 4);
  return firstPair === secondPair;
}

/**
 * Comprehensive PIN strength validation
 *
 * @param pin - PIN to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validatePinStrength(pin: string): {
  isValid: boolean;
  error?: string;
  reason?: string;
} {
  // Check format first
  if (!validatePinFormat(pin)) {
    return {
      isValid: false,
      error: 'INVALID_PIN_FORMAT',
      reason: 'PIN must be exactly 4 digits',
    };
  }

  // Check for repeated digits
  if (isRepeatedPin(pin)) {
    return {
      isValid: false,
      error: 'PIN_TOO_WEAK',
      reason: 'PIN cannot be all the same digit (e.g., 1111, 0000)',
    };
  }

  // Check for sequential patterns
  if (isSequentialPin(pin)) {
    return {
      isValid: false,
      error: 'PIN_TOO_WEAK',
      reason: 'PIN cannot be sequential (e.g., 1234, 4321)',
    };
  }

  // Check for repeated pairs
  if (hasRepeatedPairs(pin)) {
    return {
      isValid: false,
      error: 'PIN_TOO_WEAK',
      reason: 'PIN cannot have repeated pairs (e.g., 1212, 3434)',
    };
  }

  // Check against common PIN list
  if (isCommonPin(pin)) {
    return {
      isValid: false,
      error: 'PIN_TOO_WEAK',
      reason: 'This PIN is too common. Please choose a different one',
    };
  }

  // PIN is strong enough
  return {
    isValid: true,
  };
}

/**
 * Get PIN strength score (0-100)
 * Higher is better
 *
 * @param pin - PIN to score
 * @returns Strength score from 0 (weakest) to 100 (strongest)
 */
export function getPinStrength(pin: string): number {
  if (!validatePinFormat(pin)) {
    return 0;
  }

  let score = 100;

  // Deduct points for weaknesses
  if (isRepeatedPin(pin)) {
    score -= 80;
  }
  if (isSequentialPin(pin)) {
    score -= 60;
  }
  if (hasRepeatedPairs(pin)) {
    score -= 40;
  }
  if (isCommonPin(pin)) {
    score -= 50;
  }

  // Check digit diversity
  const uniqueDigits = new Set(pin.split('')).size;
  if (uniqueDigits === 1) {
    score -= 80;
  } // All same
  if (uniqueDigits === 2) {
    score -= 30;
  } // Only 2 different digits
  if (uniqueDigits === 3) {
    score -= 10;
  } // Only 3 different digits

  return Math.max(0, Math.min(100, score));
}

/**
 * Get human-readable PIN strength description
 *
 * @param pin - PIN to evaluate
 * @returns Strength description
 */
export function getPinStrengthDescription(pin: string): string {
  const score = getPinStrength(pin);

  if (score >= 80) {
    return 'Strong';
  }
  if (score >= 60) {
    return 'Good';
  }
  if (score >= 40) {
    return 'Fair';
  }
  if (score >= 20) {
    return 'Weak';
  }
  return 'Very Weak';
}

/**
 * Generate a random strong PIN
 * Useful for testing or temporary PINs
 *
 * @returns A random 4-digit PIN that passes all validation rules
 */
export function generateStrongPin(): string {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    // Generate random 4-digit PIN
    const pin = Math.floor(1000 + Math.random() * 9000).toString();

    // Validate strength
    const validation = validatePinStrength(pin);
    if (validation.isValid) {
      return pin;
    }

    attempts++;
  }

  // Fallback (should rarely happen)
  return '5739'; // Pre-validated strong PIN
}

/**
 * Get list of common PINs (for testing/documentation)
 *
 * @returns Array of common PINs that should be rejected
 */
export function getCommonPinsList(): string[] {
  return Array.from(COMMON_PINS).sort();
}

/**
 * Check if PIN meets minimum entropy requirements
 * Entropy is a measure of randomness/unpredictability
 *
 * @param pin - PIN to check
 * @returns true if PIN has sufficient entropy
 */
export function hasMinimumEntropy(pin: string): boolean {
  // Calculate digit frequency
  const digitCounts: Record<string, number> = {};
  for (const digit of pin) {
    digitCounts[digit] = (digitCounts[digit] || 0) + 1;
  }

  // PIN should have at least 3 unique digits for reasonable entropy
  const uniqueDigits = Object.keys(digitCounts).length;
  return uniqueDigits >= 3;
}
