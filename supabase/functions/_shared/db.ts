/**
 * Database helper functions for Supabase Edge Functions
 */

import {
  createClient,
  SupabaseClient,
} from 'https://esm.sh/@supabase/supabase-js@2';
import {ApiError, ErrorCodes} from './errors.ts';
import type {
  User,
  Member,
  MemberContactRelationship,
  CheckIn,
  VerificationCode,
} from './types.ts';

/**
 * Initialize Supabase client with service role key
 */
export function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Get user by phone number
 */
export async function getUserByPhone(phone: string): Promise<User | null> {
  const supabase = getSupabaseClient();

  const {data, error} = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new ApiError('Failed to fetch user', 500, ErrorCodes.DATABASE_ERROR);
  }

  return data as User;
}

/**
 * Get user by email address
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = getSupabaseClient();

  const {data, error} = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new ApiError('Failed to fetch user', 500, ErrorCodes.DATABASE_ERROR);
  }

  return data as User;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const supabase = getSupabaseClient();

  const {data, error} = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new ApiError('Failed to fetch user', 500, ErrorCodes.DATABASE_ERROR);
  }

  return data as User;
}

/**
 * Create user
 */
export async function createUser(
  email: string,
  pinHash: string,
  fontSizePreference: string = 'standard',
): Promise<User> {
  const supabase = getSupabaseClient();

  // Set trial dates (30 days from now)
  const trialStartDate = new Date();
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 30);

  const {data, error} = await supabase
    .from('users')
    .insert({
      email: email.toLowerCase(),
      pin_hash: pinHash,
      account_status: 'trial',
      trial_start_date: trialStartDate.toISOString(),
      trial_end_date: trialEndDate.toISOString(),
      font_size_preference: fontSizePreference,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      throw new ApiError(
        'Email already registered',
        409,
        ErrorCodes.ALREADY_EXISTS,
      );
    }
    throw new ApiError('Failed to create user', 500, ErrorCodes.DATABASE_ERROR);
  }

  return data as User;
}

/**
 * Update user
 */
export async function updateUser(
  userId: string,
  updates: Partial<User>,
): Promise<User> {
  const supabase = getSupabaseClient();

  const {data, error} = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new ApiError('Failed to update user', 500, ErrorCodes.DATABASE_ERROR);
  }

  return data as User;
}

/**
 * Get member data by user ID
 */
export async function getMemberByUserId(
  userId: string,
): Promise<Member | null> {
  const supabase = getSupabaseClient();

  const {data, error} = await supabase
    .from('members')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new ApiError(
      'Failed to fetch member data',
      500,
      ErrorCodes.DATABASE_ERROR,
    );
  }

  return data as Member;
}

/**
 * Create member
 */
export async function createMember(
  userId: string,
  name: string,
): Promise<Member> {
  const supabase = getSupabaseClient();

  const {data, error} = await supabase
    .from('members')
    .insert({
      user_id: userId,
      name,
    })
    .select()
    .single();

  if (error) {
    throw new ApiError(
      'Failed to create member',
      500,
      ErrorCodes.DATABASE_ERROR,
    );
  }

  return data as Member;
}

/**
 * Update member
 */
export async function updateMember(
  memberId: string,
  updates: Partial<Member>,
): Promise<Member> {
  const supabase = getSupabaseClient();

  const {data, error} = await supabase
    .from('members')
    .update(updates)
    .eq('id', memberId)
    .select()
    .single();

  if (error) {
    throw new ApiError(
      'Failed to update member',
      500,
      ErrorCodes.DATABASE_ERROR,
    );
  }

  return data as Member;
}

/**
 * Generate unique invite code
 */
export async function generateUniqueInviteCode(): Promise<string> {
  const supabase = getSupabaseClient();
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const codeLength = 6;

  // Try up to 10 times to generate a unique code
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = '';
    for (let i = 0; i < codeLength; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if code already exists
    const {data} = await supabase
      .from('member_contact_relationships')
      .select('id')
      .eq('invite_code', code)
      .single();

    if (!data) {
      return code;
    }
  }

  throw new ApiError(
    'Failed to generate unique invite code',
    500,
    ErrorCodes.INTERNAL_ERROR,
  );
}

/**
 * Create member-contact relationship
 */
export async function createRelationship(
  memberId: string,
  contactId: string,
  inviteCode: string,
): Promise<MemberContactRelationship> {
  const supabase = getSupabaseClient();

  // Check for duplicate relationship
  const {data: existing} = await supabase
    .from('member_contact_relationships')
    .select('id')
    .eq('member_id', memberId)
    .eq('contact_id', contactId)
    .neq('status', 'removed')
    .single();

  if (existing) {
    throw new ApiError(
      'Relationship already exists',
      409,
      ErrorCodes.DUPLICATE_RELATIONSHIP,
    );
  }

  // Check for self-referential relationship
  if (memberId === contactId) {
    throw new ApiError(
      'Cannot create relationship with yourself',
      400,
      ErrorCodes.SELF_RELATIONSHIP,
    );
  }

  const {data, error} = await supabase
    .from('member_contact_relationships')
    .insert({
      member_id: memberId,
      contact_id: contactId,
      invite_code: inviteCode,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw new ApiError(
      'Failed to create relationship',
      500,
      ErrorCodes.DATABASE_ERROR,
    );
  }

  return data as MemberContactRelationship;
}

/**
 * Get relationship by invite code
 */
export async function getRelationshipByInviteCode(
  inviteCode: string,
): Promise<MemberContactRelationship | null> {
  const supabase = getSupabaseClient();

  const {data, error} = await supabase
    .from('member_contact_relationships')
    .select('*')
    .eq('invite_code', inviteCode)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new ApiError(
      'Failed to fetch relationship',
      500,
      ErrorCodes.DATABASE_ERROR,
    );
  }

  return data as MemberContactRelationship;
}

/**
 * Update relationship
 */
export async function updateRelationship(
  relationshipId: string,
  updates: Partial<MemberContactRelationship>,
): Promise<MemberContactRelationship> {
  const supabase = getSupabaseClient();

  const {data, error} = await supabase
    .from('member_contact_relationships')
    .update(updates)
    .eq('id', relationshipId)
    .select()
    .single();

  if (error) {
    throw new ApiError(
      'Failed to update relationship',
      500,
      ErrorCodes.DATABASE_ERROR,
    );
  }

  return data as MemberContactRelationship;
}

/**
 * Get today's check-in for a member
 */
export async function getTodayCheckIn(
  memberId: string,
  timezone: string,
): Promise<CheckIn | null> {
  const supabase = getSupabaseClient();

  // Get today's date in UTC
  const today = new Date().toISOString().split('T')[0];

  const {data, error} = await supabase
    .from('check_ins')
    .select('*')
    .eq('member_id', memberId)
    .gte('checked_in_at', `${today}T00:00:00Z`)
    .lt('checked_in_at', `${today}T23:59:59Z`)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new ApiError(
      'Failed to fetch check-in',
      500,
      ErrorCodes.DATABASE_ERROR,
    );
  }

  return data as CheckIn;
}

/**
 * Create check-in
 */
export async function createCheckIn(
  memberId: string,
  timezone: string,
): Promise<CheckIn> {
  const supabase = getSupabaseClient();

  const {data, error} = await supabase
    .from('check_ins')
    .insert({
      member_id: memberId,
      checked_in_at: new Date().toISOString(),
      timezone,
    })
    .select()
    .single();

  if (error) {
    throw new ApiError(
      'Failed to create check-in',
      500,
      ErrorCodes.DATABASE_ERROR,
    );
  }

  return data as CheckIn;
}

/**
 * Get active verification code for email
 */
export async function getActiveVerificationCode(
  email: string,
): Promise<VerificationCode | null> {
  const supabase = getSupabaseClient();

  const {data, error} = await supabase
    .from('verification_codes')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', {ascending: false})
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new ApiError(
      'Failed to fetch verification code',
      500,
      ErrorCodes.DATABASE_ERROR,
    );
  }

  return data as VerificationCode;
}

/**
 * Create verification code
 */
export async function createVerificationCode(
  email: string,
  code: string,
  expiresInMinutes: number = 10,
): Promise<VerificationCode> {
  const supabase = getSupabaseClient();

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

  const {data, error} = await supabase
    .from('verification_codes')
    .insert({
      email: email.toLowerCase(),
      code,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new ApiError(
      'Failed to create verification code',
      500,
      ErrorCodes.DATABASE_ERROR,
    );
  }

  return data as VerificationCode;
}

/**
 * Mark verification code as used
 */
export async function markVerificationCodeAsUsed(
  codeId: string,
): Promise<void> {
  const supabase = getSupabaseClient();

  const {error} = await supabase
    .from('verification_codes')
    .update({used: true})
    .eq('id', codeId);

  if (error) {
    throw new ApiError(
      'Failed to mark verification code as used',
      500,
      ErrorCodes.DATABASE_ERROR,
    );
  }
}

/**
 * Increment verification code attempts
 */
export async function incrementVerificationCodeAttempts(
  codeId: string,
): Promise<number> {
  const supabase = getSupabaseClient();

  const {data, error} = await supabase
    .from('verification_codes')
    .select('attempts')
    .eq('id', codeId)
    .single();

  if (error) {
    throw new ApiError(
      'Failed to fetch verification code',
      500,
      ErrorCodes.DATABASE_ERROR,
    );
  }

  const newAttempts = (data.attempts || 0) + 1;

  await supabase
    .from('verification_codes')
    .update({attempts: newAttempts})
    .eq('id', codeId);

  return newAttempts;
}

/**
 * Check if user requires payment
 * (Uses the database function requires_payment)
 */
export async function requiresPayment(userId: string): Promise<boolean> {
  const supabase = getSupabaseClient();

  const {data, error} = await supabase.rpc('requires_payment', {
    user_id: userId,
  });

  if (error) {
    console.error('Failed to check payment requirement:', error);
    // Default to requiring payment in case of error
    return true;
  }

  return data as boolean;
}

/**
 * Get all active contacts for a member
 */
export async function getMemberContacts(
  memberId: string,
): Promise<Array<{user: User; relationship: MemberContactRelationship}>> {
  const supabase = getSupabaseClient();

  const {data, error} = await supabase
    .from('member_contact_relationships')
    .select(
      `
      *,
      contact:users!member_contact_relationships_contact_id_fkey(*)
    `,
    )
    .eq('member_id', memberId)
    .eq('status', 'active');

  if (error) {
    throw new ApiError(
      'Failed to fetch member contacts',
      500,
      ErrorCodes.DATABASE_ERROR,
    );
  }

  return (data as any[]).map(row => ({
    relationship: row as MemberContactRelationship,
    user: row.contact as User,
  }));
}

/**
 * Get all members for a contact
 */
export async function getContactMembers(
  contactId: string,
): Promise<
  Array<{user: User; member: Member; relationship: MemberContactRelationship}>
> {
  const supabase = getSupabaseClient();

  const {data, error} = await supabase
    .from('member_contact_relationships')
    .select(
      `
      *,
      member:users!member_contact_relationships_member_id_fkey(*),
      member_data:members!inner(*)
    `,
    )
    .eq('contact_id', contactId)
    .in('status', ['active', 'pending']);

  if (error) {
    throw new ApiError(
      'Failed to fetch contact members',
      500,
      ErrorCodes.DATABASE_ERROR,
    );
  }

  return (data as any[]).map(row => ({
    relationship: row as MemberContactRelationship,
    user: row.member as User,
    member: Array.isArray(row.member_data)
      ? row.member_data[0]
      : (row.member_data as Member),
  }));
}

/**
 * Log SMS to database
 */
export async function logSms(
  toPhone: string,
  fromPhone: string,
  body: string,
  type: string,
  status: string = 'pending',
  twilioSid?: string,
): Promise<void> {
  const supabase = getSupabaseClient();

  const {error} = await supabase.from('sms_logs').insert({
    to_phone: toPhone,
    from_phone: fromPhone,
    body,
    type,
    status,
    twilio_sid: twilioSid || null,
  });

  if (error) {
    console.error('Failed to log SMS:', error);
    // Don't throw - SMS logging failure shouldn't break the request
  }
}
