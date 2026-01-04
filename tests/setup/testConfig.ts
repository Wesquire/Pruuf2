/**
 * Test Environment Configuration
 *
 * Configures the test environment for integration testing with Supabase.
 * Uses environment variables for connection details to support both
 * local development and CI/CD environments.
 */

// Environment configuration
export const TEST_CONFIG = {
  // Supabase connection
  supabase: {
    url: process.env.SUPABASE_URL || 'https://ivnstzpolgjzfqduhlvw.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  // Test data prefixes (for cleanup)
  testPrefixes: {
    email: 'test+',
    emailDomain: '@pruuf.me',
  },

  // Timeouts
  timeouts: {
    api: 10000, // 10 seconds for API calls
    database: 5000, // 5 seconds for database operations
    cleanup: 30000, // 30 seconds for cleanup operations
  },

  // Test isolation
  isolation: {
    // Use unique identifiers for test data
    useTimestampSuffix: true,
    // Clean up test data after each test suite
    cleanupAfterSuite: true,
  },
} as const;

/**
 * Generate a unique test email
 */
export function generateTestEmail(prefix: string = 'user'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${TEST_CONFIG.testPrefixes.email}${prefix}_${timestamp}_${random}${TEST_CONFIG.testPrefixes.emailDomain}`;
}

/**
 * Generate a unique test identifier
 */
export function generateTestId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `test_${timestamp}_${random}`;
}

/**
 * Check if an email is a test email
 */
export function isTestEmail(email: string): boolean {
  return (
    email.startsWith(TEST_CONFIG.testPrefixes.email) &&
    email.endsWith(TEST_CONFIG.testPrefixes.emailDomain)
  );
}

/**
 * Validate test environment configuration
 */
export function validateTestConfig(): {valid: boolean; errors: string[]} {
  const errors: string[] = [];

  if (!TEST_CONFIG.supabase.url) {
    errors.push('SUPABASE_URL is not configured');
  }

  if (!TEST_CONFIG.supabase.serviceRoleKey) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is not configured (required for integration tests)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Log test configuration (for debugging)
 */
export function logTestConfig(): void {
  console.log('Test Configuration:');
  console.log(`  Supabase URL: ${TEST_CONFIG.supabase.url}`);
  console.log(`  Service Role Key: ${TEST_CONFIG.supabase.serviceRoleKey ? '[SET]' : '[NOT SET]'}`);
  console.log(`  Test Email Prefix: ${TEST_CONFIG.testPrefixes.email}`);
  console.log(`  API Timeout: ${TEST_CONFIG.timeouts.api}ms`);
}

export default TEST_CONFIG;
