/**
 * Test Database Connection
 *
 * Provides a Supabase client configured for testing with service role access.
 * This allows tests to directly verify database state and clean up test data.
 */

import {createClient, SupabaseClient} from '@supabase/supabase-js';
import {TEST_CONFIG, isTestEmail} from './testConfig';

// Singleton Supabase client for tests
let testSupabaseClient: SupabaseClient | null = null;

/**
 * Get the Supabase client for tests
 * Uses service role key for full database access
 */
export function getTestSupabaseClient(): SupabaseClient {
  if (!testSupabaseClient) {
    if (!TEST_CONFIG.supabase.serviceRoleKey) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY is required for integration tests. ' +
        'Set it in your environment or .env.test file.'
      );
    }

    testSupabaseClient = createClient(
      TEST_CONFIG.supabase.url,
      TEST_CONFIG.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  return testSupabaseClient;
}

/**
 * Reset the Supabase client (useful for testing connection issues)
 */
export function resetTestSupabaseClient(): void {
  testSupabaseClient = null;
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = getTestSupabaseClient();
    const {error} = await client.from('users').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Get a user by email (for test verification)
 */
export async function getUserByEmail(email: string): Promise<any | null> {
  const client = getTestSupabaseClient();
  const {data, error} = await client
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    return null;
  }
  return data;
}

/**
 * Get verification codes for an email (for testing verification flow)
 */
export async function getVerificationCodes(email: string): Promise<any[]> {
  const client = getTestSupabaseClient();
  const {data, error} = await client
    .from('email_verification_codes')
    .select('*')
    .eq('email', email)
    .order('created_at', {ascending: false});

  if (error) {
    console.error('Error fetching verification codes:', error);
    return [];
  }
  return data || [];
}

/**
 * Get check-ins for a member (for testing check-in flow)
 */
export async function getCheckInsForMember(memberId: string): Promise<any[]> {
  const client = getTestSupabaseClient();
  const {data, error} = await client
    .from('check_ins')
    .select('*')
    .eq('member_id', memberId)
    .order('checked_in_at', {ascending: false});

  if (error) {
    console.error('Error fetching check-ins:', error);
    return [];
  }
  return data || [];
}

/**
 * Get member by user ID
 */
export async function getMemberByUserId(userId: string): Promise<any | null> {
  const client = getTestSupabaseClient();
  const {data, error} = await client
    .from('members')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    return null;
  }
  return data;
}

/**
 * Get relationships for a user
 */
export async function getRelationshipsForUser(userId: string): Promise<any[]> {
  const client = getTestSupabaseClient();
  const {data, error} = await client
    .from('member_contact_relationships')
    .select('*')
    .or(`member_id.eq.${userId},contact_id.eq.${userId}`)
    .order('created_at', {ascending: false});

  if (error) {
    console.error('Error fetching relationships:', error);
    return [];
  }
  return data || [];
}

/**
 * Get push notification tokens for a user
 */
export async function getPushTokensForUser(userId: string): Promise<any[]> {
  const client = getTestSupabaseClient();
  const {data, error} = await client
    .from('push_notification_tokens')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching push tokens:', error);
    return [];
  }
  return data || [];
}

/**
 * Get audit logs for a user
 */
export async function getAuditLogsForUser(userId: string): Promise<any[]> {
  const client = getTestSupabaseClient();
  const {data, error} = await client
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', {ascending: false});

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
  return data || [];
}

/**
 * Clean up test user and all related data
 */
export async function cleanupTestUser(userId: string): Promise<void> {
  const client = getTestSupabaseClient();

  // Delete in order of dependencies
  const tables = [
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
    'users',
  ];

  for (const table of tables) {
    try {
      if (table === 'email_verification_codes') {
        // This table uses email, not user_id
        const {data: user} = await client
          .from('users')
          .select('email')
          .eq('id', userId)
          .single();

        if (user?.email) {
          await client.from(table).delete().eq('email', user.email);
        }
      } else if (table === 'member_contact_relationships') {
        // This table can have user as either member or contact
        await client.from(table).delete().or(`member_id.eq.${userId},contact_id.eq.${userId}`);
      } else {
        await client.from(table).delete().eq('user_id', userId);
      }
    } catch (error) {
      // Ignore errors for tables that might not exist or have no data
      console.log(`Cleanup: Skipped ${table} (may be empty or not exist)`);
    }
  }
}

/**
 * Clean up all test users (matching test email pattern)
 */
export async function cleanupAllTestUsers(): Promise<{deleted: number; errors: string[]}> {
  const client = getTestSupabaseClient();
  const errors: string[] = [];
  let deleted = 0;

  try {
    // Find all test users
    const {data: testUsers, error} = await client
      .from('users')
      .select('id, email')
      .like('email', 'test+%@pruuf.me');

    if (error) {
      errors.push(`Error finding test users: ${error.message}`);
      return {deleted, errors};
    }

    if (!testUsers || testUsers.length === 0) {
      return {deleted: 0, errors: []};
    }

    // Clean up each test user
    for (const user of testUsers) {
      if (isTestEmail(user.email)) {
        try {
          await cleanupTestUser(user.id);
          deleted++;
        } catch (err) {
          errors.push(`Error cleaning up user ${user.email}: ${err}`);
        }
      }
    }
  } catch (err) {
    errors.push(`Unexpected error during cleanup: ${err}`);
  }

  return {deleted, errors};
}

export default {
  getTestSupabaseClient,
  resetTestSupabaseClient,
  testDatabaseConnection,
  getUserByEmail,
  getVerificationCodes,
  getCheckInsForMember,
  getMemberByUserId,
  getRelationshipsForUser,
  getPushTokensForUser,
  getAuditLogsForUser,
  cleanupTestUser,
  cleanupAllTestUsers,
};
