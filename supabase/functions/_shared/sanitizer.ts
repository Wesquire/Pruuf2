/**
 * Input Sanitization Utilities
 * Prevents XSS, SQL injection, command injection, and other attacks
 *
 * Usage:
 *   const clean = sanitizeString(userInput);
 *   const safe = sanitizeObject(requestBody);
 */

/**
 * HTML special characters that need escaping
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escape HTML special characters to prevent XSS
 *
 * @param str - String to sanitize
 * @returns Sanitized string with HTML entities escaped
 *
 * @example
 * escapeHtml('<script>alert("XSS")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 */
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  return str.replace(/[&<>"'\/]/g, char => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Remove all HTML tags from string
 *
 * @param str - String to strip
 * @returns String with all HTML tags removed
 *
 * @example
 * stripHtmlTags('<p>Hello <b>World</b></p>')
 * // Returns: 'Hello World'
 */
export function stripHtmlTags(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  // Remove script and style tags with their content
  let result = str.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    '',
  );
  result = result.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    '',
  );

  // Remove remaining HTML tags
  return result.replace(/<[^>]*>/g, '');
}

/**
 * Remove potentially dangerous characters from string
 * Prevents command injection, SQL injection patterns
 *
 * @param str - String to sanitize
 * @returns Sanitized string
 *
 * @example
 * removeDangerousChars('hello; DROP TABLE users;')
 * // Returns: 'hello DROP TABLE users'
 */
export function removeDangerousChars(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  // Remove: semicolons, backticks, null bytes, control characters
  return str
    .replace(/[;\x00-\x1F\x7F`]/g, '')
    .replace(/[\\]/g, '') // Remove backslashes
    .trim();
}

/**
 * Sanitize string for safe database queries
 * Note: Supabase already uses parameterized queries, but this provides extra protection
 *
 * @param str - String to sanitize
 * @returns Sanitized string
 *
 * @example
 * sanitizeSql("'; DROP TABLE users; --")
 * // Returns: " DROP TABLE users --"
 */
export function sanitizeSql(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  // Remove SQL injection patterns
  return str
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* comment */ blocks
    .replace(/['";\\]/g, '') // Remove quotes and semicolons
    .replace(/--/g, '') // Remove SQL line comments
    .trim();
}

/**
 * Validate and sanitize file paths
 * Prevents path traversal attacks (../, ..\, etc.)
 *
 * @param path - File path to validate
 * @returns Sanitized path or null if invalid
 *
 * @example
 * sanitizeFilePath('../../etc/passwd')
 * // Returns: null
 *
 * sanitizeFilePath('uploads/image.jpg')
 * // Returns: 'uploads/image.jpg'
 */
export function sanitizeFilePath(path: string): string | null {
  if (typeof path !== 'string') {
    return null;
  }

  // Reject paths with traversal patterns
  if (
    path.includes('../') ||
    path.includes('..\\') ||
    path.includes('%2e%2e') || // URL encoded ..
    path.includes('%252e%252e') // Double encoded ..
  ) {
    return null;
  }

  // Reject absolute paths
  if (path.startsWith('/') || /^[a-zA-Z]:/.test(path)) {
    return null;
  }

  // Remove null bytes
  path = path.replace(/\x00/g, '');

  // Basic sanitization
  return path.trim();
}

/**
 * Sanitize email address
 *
 * @param email - Email to sanitize
 * @returns Sanitized email or null if invalid
 *
 * @example
 * sanitizeEmail('user@example.com')
 * // Returns: 'user@example.com'
 *
 * sanitizeEmail('not-an-email')
 * // Returns: null
 */
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== 'string') {
    return null;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  email = email.trim().toLowerCase();

  if (!emailRegex.test(email)) {
    return null;
  }

  // Max length check
  if (email.length > 254) {
    return null;
  }

  return email;
}

/**
 * Sanitize URL
 * Only allows http:// and https:// protocols
 *
 * @param url - URL to sanitize
 * @returns Sanitized URL or null if invalid
 *
 * @example
 * sanitizeUrl('https://example.com')
 * // Returns: 'https://example.com'
 *
 * sanitizeUrl('javascript:alert(1)')
 * // Returns: null
 */
export function sanitizeUrl(url: string): string | null {
  if (typeof url !== 'string') {
    return null;
  }

  url = url.trim();

  // Only allow http and https
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return null;
  }

  // Reject dangerous protocols in URL
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:',
  ];

  const lowerUrl = url.toLowerCase();
  if (dangerousProtocols.some(proto => lowerUrl.includes(proto))) {
    return null;
  }

  try {
    // Validate URL structure
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

/**
 * Sanitize string - general purpose
 * Combines HTML escaping and dangerous character removal
 *
 * @param str - String to sanitize
 * @param options - Sanitization options
 * @returns Sanitized string
 *
 * @example
 * sanitizeString('<script>alert(1)</script>')
 * // Returns: '&lt;script&gt;alert(1)&lt;/script&gt;'
 */
export function sanitizeString(
  str: string,
  options: {
    stripHtml?: boolean;
    removeDangerous?: boolean;
    maxLength?: number;
  } = {},
): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  let result = str;

  // Strip HTML tags if requested
  if (options.stripHtml) {
    result = stripHtmlTags(result);
  }

  // Escape HTML entities
  result = escapeHtml(result);

  // Remove dangerous characters if requested
  if (options.removeDangerous) {
    result = removeDangerousChars(result);
  }

  // Trim to max length
  if (options.maxLength && result.length > options.maxLength) {
    result = result.substring(0, options.maxLength);
  }

  return result.trim();
}

/**
 * Sanitize integer
 * Ensures value is a safe integer
 *
 * @param value - Value to sanitize
 * @param options - Validation options
 * @returns Sanitized integer or null if invalid
 *
 * @example
 * sanitizeInteger('42')
 * // Returns: 42
 *
 * sanitizeInteger('not-a-number')
 * // Returns: null
 */
export function sanitizeInteger(
  value: any,
  options: {
    min?: number;
    max?: number;
  } = {},
): number | null {
  // If string contains decimal point, reject it
  if (typeof value === 'string' && value.includes('.')) {
    return null;
  }

  const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);

  // Check if valid number
  if (isNaN(num) || !Number.isFinite(num)) {
    return null;
  }

  // Check if integer
  if (!Number.isInteger(num)) {
    return null;
  }

  // Check min/max bounds
  if (options.min !== undefined && num < options.min) {
    return null;
  }

  if (options.max !== undefined && num > options.max) {
    return null;
  }

  // Check if safe integer (prevents precision loss)
  if (!Number.isSafeInteger(num)) {
    return null;
  }

  return num;
}

/**
 * Sanitize boolean
 *
 * @param value - Value to sanitize
 * @returns Boolean value
 *
 * @example
 * sanitizeBoolean('true')
 * // Returns: true
 *
 * sanitizeBoolean('1')
 * // Returns: true
 */
export function sanitizeBoolean(value: any): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return false;
}

/**
 * Sanitize UUID
 *
 * @param uuid - UUID to validate
 * @returns Sanitized UUID or null if invalid
 *
 * @example
 * sanitizeUuid('123e4567-e89b-12d3-a456-426614174000')
 * // Returns: '123e4567-e89b-12d3-a456-426614174000'
 */
export function sanitizeUuid(uuid: string): string | null {
  if (typeof uuid !== 'string') {
    return null;
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  uuid = uuid.trim().toLowerCase();

  if (!uuidRegex.test(uuid)) {
    return null;
  }

  return uuid;
}

/**
 * Sanitize object recursively
 * Sanitizes all string values in an object
 *
 * @param obj - Object to sanitize
 * @param options - Sanitization options
 * @returns Sanitized object
 *
 * @example
 * sanitizeObject({
 *   name: '<script>alert(1)</script>',
 *   age: 25,
 *   nested: { bio: '<b>Hello</b>' }
 * })
 * // Returns: {
 * //   name: '&lt;script&gt;alert(1)&lt;/script&gt;',
 * //   age: 25,
 * //   nested: { bio: '&lt;b&gt;Hello&lt;/b&gt;' }
 * // }
 */
export function sanitizeObject(
  obj: any,
  options: {
    stripHtml?: boolean;
    removeDangerous?: boolean;
    maxStringLength?: number;
    maxDepth?: number;
    currentDepth?: number;
  } = {},
): any {
  const depth = options.currentDepth || 0;
  const maxDepth = options.maxDepth || 10;

  // Prevent infinite recursion
  if (depth > maxDepth) {
    return obj;
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  // Sanitize strings
  if (typeof obj === 'string') {
    return sanitizeString(obj, {
      stripHtml: options.stripHtml,
      removeDangerous: options.removeDangerous,
      maxLength: options.maxStringLength,
    });
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item =>
      sanitizeObject(item, {...options, currentDepth: depth + 1}),
    );
  }

  // Handle objects
  if (typeof obj === 'object') {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key
      const safeKey = sanitizeString(key, {
        removeDangerous: true,
        maxLength: 100,
      });

      // Sanitize value
      sanitized[safeKey] = sanitizeObject(value, {
        ...options,
        currentDepth: depth + 1,
      });
    }

    return sanitized;
  }

  // Return primitives as-is
  return obj;
}

/**
 * Validate and sanitize JSON
 *
 * @param json - JSON string to validate
 * @param maxSize - Maximum size in bytes
 * @returns Parsed and sanitized object or null if invalid
 *
 * @example
 * sanitizeJson('{"name": "<script>alert(1)</script>"}')
 * // Returns: { name: '&lt;script&gt;alert(1)&lt;/script&gt;' }
 */
export function sanitizeJson(
  json: string,
  maxSize: number = 1048576, // 1MB default
): any {
  if (typeof json !== 'string') {
    return null;
  }

  // Check size
  if (json.length > maxSize) {
    return null;
  }

  try {
    const parsed = JSON.parse(json);
    return sanitizeObject(parsed);
  } catch {
    return null;
  }
}

/**
 * Sanitize phone number
 * Removes all non-digit characters except +
 *
 * @param phone - Phone number to sanitize
 * @returns Sanitized phone number
 *
 * @example
 * sanitizePhone('(555) 123-4567')
 * // Returns: '5551234567'
 *
 * sanitizePhone('+1 (555) 123-4567')
 * // Returns: '+15551234567'
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') {
    return '';
  }

  // Keep only digits and +
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Create sanitization middleware
 * Can be used to automatically sanitize request bodies
 *
 * @param options - Sanitization options
 * @returns Middleware function
 *
 * @example
 * const req = await req.json();
 * const sanitized = sanitizeRequestBody(req);
 */
export function sanitizeRequestBody(
  body: any,
  options: {
    stripHtml?: boolean;
    removeDangerous?: boolean;
    maxStringLength?: number;
  } = {
    stripHtml: false, // Don't strip by default (breaks intentional HTML)
    removeDangerous: true, // Remove dangerous chars by default
    maxStringLength: 10000, // 10KB per string field
  },
): any {
  return sanitizeObject(body, options);
}
