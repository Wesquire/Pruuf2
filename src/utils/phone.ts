/**
 * Phone Number Utilities
 * Format and validate phone numbers
 */

/**
 * Format phone to E.164 format (+1XXXXXXXXXX)
 */
export function formatPhoneE164(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }

  return phone;
}

/**
 * Format phone for display: (555) 123-4567
 */
export function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phone;
}

/**
 * Mask phone number: (***) ***-1234
 */
export function maskPhone(phone: string): string {
  const formatted = formatPhoneDisplay(phone);
  if (formatted.length >= 4) {
    return `(***) ***-${formatted.slice(-4)}`;
  }
  return formatted;
}

/**
 * Validate US phone number (10 digits)
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10;
}

/**
 * Format as user types: auto-add parentheses and dashes
 */
export function formatPhoneInput(value: string, previousValue: string = ''): string {
  const cleaned = value.replace(/\D/g, '');

  let formatted = '';

  if (cleaned.length > 0) {
    formatted = '(' + cleaned.substring(0, 3);
  }

  if (cleaned.length > 3) {
    formatted += ') ' + cleaned.substring(3, 6);
  }

  if (cleaned.length > 6) {
    formatted += '-' + cleaned.substring(6, 10);
  }

  return formatted;
}
