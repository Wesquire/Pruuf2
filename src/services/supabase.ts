/**
 * Supabase Client
 * Initialize and export Supabase client
 */

import {createClient, SupabaseClient} from '@supabase/supabase-js';
import Constants from 'expo-constants';
import {storage} from './storage';

// Configuration from Expo app.config.js extra section
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

// Validate required configuration
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your environment.',
  );
}

const SUPABASE_URL = supabaseUrl;
const SUPABASE_ANON_KEY = supabaseAnonKey;

/**
 * Initialize Supabase client with custom auth storage
 */
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: async (key: string) => {
        if (key === 'supabase.auth.token') {
          return await storage.getAccessToken();
        }
        return null;
      },
      setItem: async (key: string, value: string) => {
        if (key === 'supabase.auth.token') {
          await storage.setAccessToken(value);
        }
      },
      removeItem: async (key: string) => {
        if (key === 'supabase.auth.token') {
          await storage.removeAccessToken();
        }
      },
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Get current session
 */
export async function getSession() {
  const {data, error} = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return data.session;
}

/**
 * Sign in with email and PIN (custom auth)
 */
export async function signInWithEmail(email: string, pin: string) {
  // This would call your custom auth endpoint
  // For now, this is a placeholder
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({email, pin}),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

/**
 * Sign out
 */
export async function signOut() {
  const {error} = await supabase.auth.signOut();
  if (error) {
    console.error('Sign out error:', error);
    throw error;
  }
  await storage.clearAll();
}

/**
 * Database query helpers
 */

/**
 * Get user profile
 */
export async function getUserProfile(userId: string) {
  const {data, error} = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

/**
 * Get member data
 */
export async function getMemberData(userId: string) {
  const {data, error} = await supabase
    .from('members')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching member data:', error);
    return null;
  }

  return data;
}

/**
 * Get contacts for a member
 */
export async function getMemberContacts(memberId: string) {
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
    console.error('Error fetching member contacts:', error);
    return [];
  }

  return data;
}

/**
 * Get members for a contact
 */
export async function getContactMembers(contactId: string) {
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
    console.error('Error fetching contact members:', error);
    return [];
  }

  return data;
}

/**
 * Record check-in
 */
export async function recordCheckIn(memberId: string, timezone: string) {
  const {data, error} = await supabase.from('check_ins').insert({
    member_id: memberId,
    checked_in_at: new Date().toISOString(),
    timezone,
  });

  if (error) {
    console.error('Error recording check-in:', error);
    throw error;
  }

  return data;
}

/**
 * Get today's check-in for a member
 */
export async function getTodayCheckIn(memberId: string, timezone: string) {
  const today = new Date().toISOString().split('T')[0];

  const {data, error} = await supabase
    .from('check_ins')
    .select('*')
    .eq('member_id', memberId)
    .gte('checked_in_at', `${today}T00:00:00`)
    .lte('checked_in_at', `${today}T23:59:59`)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "no rows returned"
    console.error('Error fetching today check-in:', error);
    return null;
  }

  return data;
}

/**
 * Subscribe to real-time changes
 */
export function subscribeToCheckIns(
  memberId: string,
  callback: (payload: any) => void,
) {
  const subscription = supabase
    .channel(`check_ins:${memberId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'check_ins',
        filter: `member_id=eq.${memberId}`,
      },
      callback,
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

export {supabase};
export default supabase;
