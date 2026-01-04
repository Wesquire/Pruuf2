/**
 * Test Data Cleanup Utility
 *
 * Standalone utility to clean up test data from the database after test runs.
 * Deletes all users matching the test+*@pruuf.me pattern and their related data.
 *
 * Usage:
 *   npx ts-node tests/cleanup/cleanupTestData.ts
 *
 * Environment Variables:
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (required for cleanup)
 */

import {createClient, SupabaseClient} from '@supabase/supabase-js';

// Configuration
const CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://ivnstzpolgjzfqduhlvw.supabase.co',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  testEmailPattern: 'test+%@pruuf.me',
  testEmailPrefix: 'test+',
  testEmailDomain: '@pruuf.me',
};

// Tables to clean up (in order of dependencies)
const CLEANUP_TABLES = [
  'push_notification_logs',
  'push_notification_tokens',
  'email_notification_logs',
  'audit_logs',
  'check_ins',
  'reminder_notifications',
  'missed_check_in_alerts',
  'member_contact_relationships',
  'members',
  'email_verification_codes',
  'user_sessions',
  'app_notifications',
  'idempotency_keys',
  'rate_limit_buckets',
  'users',
];

interface CleanupResult {
  success: boolean;
  testUsersFound: number;
  testUsersDeleted: number;
  tablesProcessed: string[];
  errors: string[];
  duration: number;
}

/**
 * Check if an email is a test email
 */
function isTestEmail(email: string): boolean {
  return (
    email.startsWith(CONFIG.testEmailPrefix) &&
    email.endsWith(CONFIG.testEmailDomain)
  );
}

/**
 * Get Supabase client with service role access
 */
function getSupabaseClient(): SupabaseClient {
  if (!CONFIG.supabaseServiceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for cleanup. ' +
      'Set it in your environment variables.'
    );
  }

  return createClient(CONFIG.supabaseUrl, CONFIG.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Clean up all data for a specific user ID
 */
async function cleanupUserData(
  client: SupabaseClient,
  userId: string,
  email: string
): Promise<string[]> {
  const errors: string[] = [];

  for (const table of CLEANUP_TABLES) {
    try {
      if (table === 'email_verification_codes') {
        // This table uses email, not user_id
        await client.from(table).delete().eq('email', email);
      } else if (table === 'member_contact_relationships') {
        // This table can have user as either member or contact
        await client
          .from(table)
          .delete()
          .or(`member_id.eq.${userId},contact_id.eq.${userId}`);
      } else if (table === 'users') {
        // Delete the user last
        await client.from(table).delete().eq('id', userId);
      } else {
        await client.from(table).delete().eq('user_id', userId);
      }
    } catch (error) {
      // Silently ignore errors for tables that might not exist or have no data
      // Only log actual errors, not "no rows" results
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('No rows')) {
        errors.push(`${table}: ${errorMessage}`);
      }
    }
  }

  return errors;
}

/**
 * Main cleanup function
 * Deletes all test users matching test+*@pruuf.me pattern
 */
async function cleanupTestData(): Promise<CleanupResult> {
  const startTime = Date.now();
  const result: CleanupResult = {
    success: false,
    testUsersFound: 0,
    testUsersDeleted: 0,
    tablesProcessed: [...CLEANUP_TABLES],
    errors: [],
    duration: 0,
  };

  console.log('========================================');
  console.log('Test Data Cleanup Utility');
  console.log('========================================');
  console.log(`Supabase URL: ${CONFIG.supabaseUrl}`);
  console.log(`Pattern: ${CONFIG.testEmailPattern}`);
  console.log('');

  try {
    // Get Supabase client
    const client = getSupabaseClient();
    console.log('Connected to Supabase');

    // Find all test users
    console.log('Finding test users...');
    const {data: testUsers, error: findError} = await client
      .from('users')
      .select('id, email')
      .like('email', CONFIG.testEmailPattern);

    if (findError) {
      result.errors.push(`Error finding test users: ${findError.message}`);
      result.duration = Date.now() - startTime;
      console.error('Failed to find test users:', findError.message);
      return result;
    }

    if (!testUsers || testUsers.length === 0) {
      console.log('No test users found. Database is clean!');
      result.success = true;
      result.duration = Date.now() - startTime;
      return result;
    }

    result.testUsersFound = testUsers.length;
    console.log(`Found ${testUsers.length} test user(s)`);
    console.log('');

    // Clean up each test user
    for (const user of testUsers) {
      if (!isTestEmail(user.email)) {
        console.log(`Skipping non-test email: ${user.email}`);
        continue;
      }

      console.log(`Cleaning up: ${user.email}`);
      const userErrors = await cleanupUserData(client, user.id, user.email);

      if (userErrors.length > 0) {
        result.errors.push(...userErrors.map(e => `${user.email}: ${e}`));
      }

      result.testUsersDeleted++;
    }

    result.success = result.errors.length === 0;
    result.duration = Date.now() - startTime;

    // Summary
    console.log('');
    console.log('========================================');
    console.log('Cleanup Summary');
    console.log('========================================');
    console.log(`Test users found: ${result.testUsersFound}`);
    console.log(`Test users deleted: ${result.testUsersDeleted}`);
    console.log(`Tables processed: ${result.tablesProcessed.length}`);
    console.log(`Errors: ${result.errors.length}`);
    console.log(`Duration: ${result.duration}ms`);
    console.log(`Status: ${result.success ? 'SUCCESS' : 'COMPLETED WITH ERRORS'}`);

    if (result.errors.length > 0) {
      console.log('');
      console.log('Errors:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(`Unexpected error: ${errorMessage}`);
    result.duration = Date.now() - startTime;
    console.error('Cleanup failed:', errorMessage);
  }

  return result;
}

/**
 * Verify cleanup was successful
 */
async function verifyCleanup(): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    const {data: remainingUsers, error} = await client
      .from('users')
      .select('id, email')
      .like('email', CONFIG.testEmailPattern);

    if (error) {
      console.error('Verification failed:', error.message);
      return false;
    }

    if (remainingUsers && remainingUsers.length > 0) {
      console.log(`Warning: ${remainingUsers.length} test user(s) still exist`);
      remainingUsers.forEach(user => {
        console.log(`  - ${user.email}`);
      });
      return false;
    }

    console.log('Verification passed: No test users remain');
    return true;
  } catch (error) {
    console.error('Verification failed:', error);
    return false;
  }
}

// Run if executed directly
if (require.main === module) {
  (async () => {
    try {
      const result = await cleanupTestData();

      if (result.success) {
        const verified = await verifyCleanup();
        process.exit(verified ? 0 : 1);
      } else {
        process.exit(1);
      }
    } catch (error) {
      console.error('Fatal error:', error);
      process.exit(1);
    }
  })();
}

// Export for use in test suites
export {cleanupTestData, verifyCleanup, isTestEmail, CONFIG};
export type {CleanupResult};
