/**
 * User Factory
 *
 * Creates test users in the Supabase database for integration testing.
 * All test users use the pattern: test+*@pruuf.me
 */

import {getTestSupabaseClient, cleanupTestUser} from '../setup/testDatabase';
import {generateTestEmail, generateTestId} from '../setup/testConfig';

// Type definitions
export interface TestUser {
  id: string;
  email: string;
  email_verified: boolean;
  pin_hash: string | null;
  account_status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserOptions {
  email?: string;
  emailVerified?: boolean;
  pinHash?: string;
  accountStatus?: 'pending_verification' | 'pending_pin' | 'active_free' | 'active_paid' | 'suspended' | 'deleted';
}

// Default PIN hash for test users (PIN: 1234)
// bcrypt hash of "1234" with cost factor 10
const DEFAULT_TEST_PIN_HASH = '$2b$10$testPinHashForTestingPurposesOnly';

/**
 * Create a test user in the database
 */
export async function createTestUser(options: CreateUserOptions = {}): Promise<TestUser> {
  const client = getTestSupabaseClient();

  const email = options.email || generateTestEmail('user');
  const now = new Date().toISOString();

  const userData = {
    email,
    email_verified: options.emailVerified ?? true,
    pin_hash: options.pinHash ?? DEFAULT_TEST_PIN_HASH,
    account_status: options.accountStatus ?? 'active_free',
    created_at: now,
    updated_at: now,
  };

  const {data, error} = await client
    .from('users')
    .insert(userData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }

  return data as TestUser;
}

/**
 * Create a test user with pending verification status
 */
export async function createUnverifiedUser(options: Omit<CreateUserOptions, 'emailVerified' | 'accountStatus'> = {}): Promise<TestUser> {
  return createTestUser({
    ...options,
    emailVerified: false,
    accountStatus: 'pending_verification',
    pinHash: null,
  });
}

/**
 * Create a test user with pending PIN status
 */
export async function createUserPendingPin(options: Omit<CreateUserOptions, 'accountStatus' | 'pinHash'> = {}): Promise<TestUser> {
  return createTestUser({
    ...options,
    emailVerified: true,
    accountStatus: 'pending_pin',
    pinHash: null,
  });
}

/**
 * Create a fully verified and active test user
 */
export async function createActiveUser(options: Omit<CreateUserOptions, 'emailVerified' | 'accountStatus'> = {}): Promise<TestUser> {
  return createTestUser({
    ...options,
    emailVerified: true,
    accountStatus: 'active_free',
  });
}

/**
 * Create a verification code for a user
 */
export async function createVerificationCode(email: string, code?: string): Promise<{code: string; expiresAt: string}> {
  const client = getTestSupabaseClient();

  const verificationCode = code || Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

  const {error} = await client
    .from('email_verification_codes')
    .insert({
      email,
      code: verificationCode,
      expires_at: expiresAt,
      used: false,
      created_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error(`Failed to create verification code: ${error.message}`);
  }

  return {code: verificationCode, expiresAt};
}

/**
 * Create a test session for a user
 */
export async function createTestSession(userId: string): Promise<{sessionToken: string; expiresAt: string}> {
  const client = getTestSupabaseClient();

  const sessionToken = `test_session_${generateTestId()}`;
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days

  const {error} = await client
    .from('user_sessions')
    .insert({
      user_id: userId,
      session_token: sessionToken,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error(`Failed to create test session: ${error.message}`);
  }

  return {sessionToken, expiresAt};
}

/**
 * Update a test user
 */
export async function updateTestUser(userId: string, updates: Partial<CreateUserOptions>): Promise<TestUser> {
  const client = getTestSupabaseClient();

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.email !== undefined) updateData.email = updates.email;
  if (updates.emailVerified !== undefined) updateData.email_verified = updates.emailVerified;
  if (updates.pinHash !== undefined) updateData.pin_hash = updates.pinHash;
  if (updates.accountStatus !== undefined) updateData.account_status = updates.accountStatus;

  const {data, error} = await client
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update test user: ${error.message}`);
  }

  return data as TestUser;
}

/**
 * Delete a test user and all related data
 */
export async function deleteTestUser(userId: string): Promise<void> {
  await cleanupTestUser(userId);
}

/**
 * Get a test user by ID
 */
export async function getTestUser(userId: string): Promise<TestUser | null> {
  const client = getTestSupabaseClient();

  const {data, error} = await client
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    return null;
  }

  return data as TestUser;
}

/**
 * Get a test user by email
 */
export async function getTestUserByEmail(email: string): Promise<TestUser | null> {
  const client = getTestSupabaseClient();

  const {data, error} = await client
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    return null;
  }

  return data as TestUser;
}

export default {
  createTestUser,
  createUnverifiedUser,
  createUserPendingPin,
  createActiveUser,
  createVerificationCode,
  createTestSession,
  updateTestUser,
  deleteTestUser,
  getTestUser,
  getTestUserByEmail,
  DEFAULT_TEST_PIN_HASH,
};
