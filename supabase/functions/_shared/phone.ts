/**
 * Phone Number Utilities
 * Normalizes, validates, and formats phone numbers to E.164 standard
 *
 * E.164 Format: +[country code][subscriber number]
 * Example: +15551234567 (US number)
 */

/**
 * Parse phone number and extract country code and subscriber number
 * Supports various input formats
 */
function parsePhoneNumber(
  phone: string,
): {countryCode: string; subscriberNumber: string} | null {
  // Remove all non-digit characters except + at the start
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Remove + from anywhere except the start
  if (cleaned.startsWith('+')) {
    cleaned = '+' + cleaned.substring(1).replace(/\+/g, '');
  }

  // If already in E.164 format (+15551234567)
  if (cleaned.startsWith('+')) {
    // For US numbers (+1), expect exactly 12 characters (+1 + 10 digits)
    if (cleaned.startsWith('+1')) {
      if (cleaned.length === 12) {
        return {countryCode: '1', subscriberNumber: cleaned.substring(2)};
      }
      // Reject US numbers that are too long or too short
      return null;
    }

    // For other international numbers with proper length
    if (cleaned.length >= 12 && cleaned.length <= 15) {
      const countryCode = cleaned.substring(1, cleaned.length - 10);
      const subscriberNumber = cleaned.substring(cleaned.length - 10);
      return {countryCode, subscriberNumber};
    }

    return null;
  }

  // If 11 digits (US format: 15551234567)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return {countryCode: '1', subscriberNumber: cleaned.substring(1)};
  }

  // If 10 digits (US format without country code: 5551234567)
  if (cleaned.length === 10) {
    return {countryCode: '1', subscriberNumber: cleaned};
  }

  return null;
}

/**
 * Normalize phone number to E.164 format
 *
 * @param phone - Phone number in any format
 * @param defaultCountryCode - Default country code (default: '1' for US)
 * @returns Phone number in E.164 format (+15551234567) or null if invalid
 *
 * @example
 * normalizePhone('(555) 123-4567') // '+15551234567'
 * normalizePhone('555-123-4567') // '+15551234567'
 * normalizePhone('5551234567') // '+15551234567'
 * normalizePhone('+1 555 123 4567') // '+15551234567'
 */
export function normalizePhone(
  phone: string,
  defaultCountryCode: string = '1',
): string | null {
  if (!phone) {
    return null;
  }

  const parsed = parsePhoneNumber(phone);

  if (!parsed) {
    return null;
  }

  const {countryCode, subscriberNumber} = parsed;

  // Validate subscriber number (must be 10 digits for US)
  if (subscriberNumber.length !== 10) {
    return null;
  }

  // Return in E.164 format
  return `+${countryCode}${subscriberNumber}`;
}

/**
 * Validate phone number format
 *
 * @param phone - Phone number to validate
 * @param countryCode - Expected country code (default: '1' for US)
 * @returns true if valid, false otherwise
 *
 * @example
 * validatePhone('+15551234567') // true
 * validatePhone('555-123-4567') // true
 * validatePhone('123') // false
 */
export function validatePhone(
  phone: string,
  countryCode: string = '1',
): boolean {
  const normalized = normalizePhone(phone, countryCode);
  return normalized !== null;
}

/**
 * Format phone number for display (US format)
 *
 * @param phone - Phone number in E.164 format
 * @returns Formatted phone number: (555) 123-4567
 *
 * @example
 * formatPhoneDisplay('+15551234567') // '(555) 123-4567'
 */
export function formatPhoneDisplay(phone: string): string | null {
  const normalized = normalizePhone(phone);

  if (!normalized) {
    return null;
  }

  // Extract subscriber number (last 10 digits)
  const subscriberNumber = normalized.substring(normalized.length - 10);

  // Format as (XXX) XXX-XXXX
  const areaCode = subscriberNumber.substring(0, 3);
  const exchange = subscriberNumber.substring(3, 6);
  const lineNumber = subscriberNumber.substring(6, 10);

  return `(${areaCode}) ${exchange}-${lineNumber}`;
}

/**
 * Mask phone number for security (show last 4 digits only)
 *
 * @param phone - Phone number in any format
 * @returns Masked phone number: (***) ***-4567
 *
 * @example
 * maskPhone('+15551234567') // '(***) ***-4567'
 * maskPhone('555-123-4567') // '(***) ***-4567'
 */
export function maskPhone(phone: string): string | null {
  const normalized = normalizePhone(phone);

  if (!normalized) {
    return null;
  }

  // Extract last 4 digits
  const lastFour = normalized.substring(normalized.length - 4);

  return `(***) ***-${lastFour}`;
}

/**
 * Extract country code from phone number
 *
 * @param phone - Phone number in any format
 * @returns Country code or null if invalid
 *
 * @example
 * getCountryCode('+15551234567') // '1'
 * getCountryCode('+442071234567') // '44'
 */
export function getCountryCode(phone: string): string | null {
  const parsed = parsePhoneNumber(phone);
  return parsed?.countryCode || null;
}

/**
 * Check if two phone numbers are the same (after normalization)
 *
 * @param phone1 - First phone number
 * @param phone2 - Second phone number
 * @returns true if same, false otherwise
 *
 * @example
 * arePhoneNumbersEqual('555-123-4567', '+15551234567') // true
 * arePhoneNumbersEqual('(555) 123-4567', '5551234567') // true
 */
export function arePhoneNumbersEqual(phone1: string, phone2: string): boolean {
  const normalized1 = normalizePhone(phone1);
  const normalized2 = normalizePhone(phone2);

  if (!normalized1 || !normalized2) {
    return false;
  }

  return normalized1 === normalized2;
}

/**
 * Validate US phone number (more strict)
 * Checks for valid area codes and exchange codes
 *
 * @param phone - Phone number to validate
 * @returns true if valid US phone number
 */
export function validateUSPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);

  if (!normalized || !normalized.startsWith('+1')) {
    return false;
  }

  const subscriberNumber = normalized.substring(2); // Remove +1

  if (subscriberNumber.length !== 10) {
    return false;
  }

  const areaCode = subscriberNumber.substring(0, 3);
  const exchange = subscriberNumber.substring(3, 6);

  // Invalid area codes: Cannot start with 0 or 1
  const areaCodeFirst = areaCode.charAt(0);
  if (areaCodeFirst === '0' || areaCodeFirst === '1') {
    return false;
  }

  // Invalid exchange codes:
  // - Cannot be N11 (where N is 2-9) - special service codes
  // - Cannot start with 0
  const exchangeFirst = exchange.charAt(0);
  const exchangeThird = exchange.charAt(2);

  // Reject 0XX exchanges
  if (exchangeFirst === '0') {
    return false;
  }

  // Reject N11 exchanges (211, 311, 411, 511, 611, 711, 811, 911)
  if (
    exchange.charAt(1) === '1' &&
    exchangeThird === '1' &&
    exchangeFirst !== '0' &&
    exchangeFirst !== '1'
  ) {
    return false;
  }

  // Area code 555 with exchange 01XX is reserved for fictional use
  if (areaCode === '555' && exchange.startsWith('01')) {
    return false;
  }

  return true;
}

/**
 * Get supported country codes
 * Currently only US is fully supported
 *
 * @returns Array of supported country codes
 */
export function getSupportedCountryCodes(): string[] {
  return ['1']; // US/Canada
}

/**
 * Get country name from country code
 *
 * @param countryCode - Country code
 * @returns Country name or null
 */
export function getCountryName(countryCode: string): string | null {
  const countries: Record<string, string> = {
    '1': 'United States / Canada',
    '44': 'United Kingdom',
    '33': 'France',
    '49': 'Germany',
  };

  return countries[countryCode] || null;
}
