/**
 * Member Factory
 *
 * Creates test members and member-contact relationships in the Supabase database.
 * Members are users who check in daily; Contacts are users who monitor members.
 */

import {getTestSupabaseClient} from '../setup/testDatabase';
import {generateTestId} from '../setup/testConfig';
import {createTestUser, TestUser, CreateUserOptions} from './userFactory';

// Type definitions
export interface TestMember {
  id: string;
  user_id: string;
  name: string;
  check_in_time: string | null;
  timezone: string;
  reminder_enabled: boolean;
  reminder_minutes_before: number | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TestRelationship {
  id: string;
  member_id: string;
  contact_id: string;
  invite_code: string;
  status: 'pending' | 'active' | 'removed';
  invited_at: string;
  connected_at: string | null;
  invite_expires_at: string | null;
}

export interface CreateMemberOptions {
  name?: string;
  checkInTime?: string; // HH:MM format
  timezone?: string;
  reminderEnabled?: boolean;
  reminderMinutesBefore?: number;
  onboardingCompleted?: boolean;
}

export interface CreateRelationshipOptions {
  status?: 'pending' | 'active' | 'removed';
  inviteCode?: string;
}

/**
 * Generate a unique invite code (6 uppercase alphanumeric chars)
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No O/0, I/1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a test member profile for a user
 */
export async function createTestMember(
  userId: string,
  options: CreateMemberOptions = {}
): Promise<TestMember> {
  const client = getTestSupabaseClient();
  const now = new Date().toISOString();

  const memberData = {
    user_id: userId,
    name: options.name || `Test Member ${generateTestId().slice(-6)}`,
    check_in_time: options.checkInTime || null,
    timezone: options.timezone || 'America/New_York',
    reminder_enabled: options.reminderEnabled ?? false,
    reminder_minutes_before: options.reminderMinutesBefore ?? null,
    onboarding_completed: options.onboardingCompleted ?? false,
    created_at: now,
    updated_at: now,
  };

  const {data, error} = await client
    .from('members')
    .insert(memberData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test member: ${error.message}`);
  }

  return data as TestMember;
}

/**
 * Create a complete member (user + member profile)
 */
export async function createCompleteMember(
  userOptions: CreateUserOptions = {},
  memberOptions: CreateMemberOptions = {}
): Promise<{user: TestUser; member: TestMember}> {
  // Create the user first
  const user = await createTestUser({
    ...userOptions,
    accountStatus: userOptions.accountStatus || 'active_free',
  });

  // Create the member profile
  const member = await createTestMember(user.id, {
    ...memberOptions,
    onboardingCompleted: memberOptions.onboardingCompleted ?? true,
  });

  return {user, member};
}

/**
 * Create a member-contact relationship
 */
export async function createTestRelationship(
  memberId: string,
  contactId: string,
  options: CreateRelationshipOptions = {}
): Promise<TestRelationship> {
  const client = getTestSupabaseClient();
  const now = new Date().toISOString();

  const relationshipData = {
    member_id: memberId,
    contact_id: contactId,
    invite_code: options.inviteCode || generateInviteCode(),
    status: options.status || 'active',
    invited_at: now,
    connected_at: options.status === 'active' ? now : null,
    invite_expires_at: options.status === 'pending'
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      : null,
    created_at: now,
    updated_at: now,
  };

  const {data, error} = await client
    .from('member_contact_relationships')
    .insert(relationshipData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test relationship: ${error.message}`);
  }

  return data as TestRelationship;
}

/**
 * Create a complete member-contact pair with relationship
 */
export async function createMemberContactPair(
  memberOptions: {user?: CreateUserOptions; member?: CreateMemberOptions} = {},
  contactOptions: CreateUserOptions = {},
  relationshipOptions: CreateRelationshipOptions = {}
): Promise<{
  memberUser: TestUser;
  member: TestMember;
  contactUser: TestUser;
  relationship: TestRelationship;
}> {
  // Create member
  const {user: memberUser, member} = await createCompleteMember(
    memberOptions.user,
    memberOptions.member
  );

  // Create contact
  const contactUser = await createTestUser({
    ...contactOptions,
    accountStatus: contactOptions.accountStatus || 'active_free',
  });

  // Create relationship
  const relationship = await createTestRelationship(
    memberUser.id,
    contactUser.id,
    relationshipOptions
  );

  return {memberUser, member, contactUser, relationship};
}

/**
 * Update a test member
 */
export async function updateTestMember(
  memberId: string,
  updates: Partial<CreateMemberOptions>
): Promise<TestMember> {
  const client = getTestSupabaseClient();

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.checkInTime !== undefined) updateData.check_in_time = updates.checkInTime;
  if (updates.timezone !== undefined) updateData.timezone = updates.timezone;
  if (updates.reminderEnabled !== undefined) updateData.reminder_enabled = updates.reminderEnabled;
  if (updates.reminderMinutesBefore !== undefined) updateData.reminder_minutes_before = updates.reminderMinutesBefore;
  if (updates.onboardingCompleted !== undefined) updateData.onboarding_completed = updates.onboardingCompleted;

  const {data, error} = await client
    .from('members')
    .update(updateData)
    .eq('id', memberId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update test member: ${error.message}`);
  }

  return data as TestMember;
}

/**
 * Update a test relationship
 */
export async function updateTestRelationship(
  relationshipId: string,
  updates: Partial<CreateRelationshipOptions>
): Promise<TestRelationship> {
  const client = getTestSupabaseClient();

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.status !== undefined) {
    updateData.status = updates.status;
    if (updates.status === 'active') {
      updateData.connected_at = new Date().toISOString();
    }
  }

  const {data, error} = await client
    .from('member_contact_relationships')
    .update(updateData)
    .eq('id', relationshipId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update test relationship: ${error.message}`);
  }

  return data as TestRelationship;
}

/**
 * Get a test member by ID
 */
export async function getTestMember(memberId: string): Promise<TestMember | null> {
  const client = getTestSupabaseClient();

  const {data, error} = await client
    .from('members')
    .select('*')
    .eq('id', memberId)
    .single();

  if (error) {
    return null;
  }

  return data as TestMember;
}

/**
 * Get a test member by user ID
 */
export async function getTestMemberByUserId(userId: string): Promise<TestMember | null> {
  const client = getTestSupabaseClient();

  const {data, error} = await client
    .from('members')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    return null;
  }

  return data as TestMember;
}

export default {
  createTestMember,
  createCompleteMember,
  createTestRelationship,
  createMemberContactPair,
  updateTestMember,
  updateTestRelationship,
  getTestMember,
  getTestMemberByUserId,
};
