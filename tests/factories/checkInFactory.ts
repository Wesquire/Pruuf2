/**
 * Check-In Factory
 *
 * Creates test check-ins and related notification records in the Supabase database.
 */

import {getTestSupabaseClient} from '../setup/testDatabase';
import {generateTestId} from '../setup/testConfig';

// Type definitions
export interface TestCheckIn {
  id: string;
  member_id: string;
  checked_in_at: string;
  timezone: string;
  status: 'on_time' | 'late';
  created_at: string;
}

export interface TestMissedAlert {
  id: string;
  member_id: string;
  sent_at: string;
  contacts_notified: number;
}

export interface TestReminderNotification {
  id: string;
  member_id: string;
  reminder_minutes_before: number;
  check_in_time: string;
  sent_at: string;
}

export interface CreateCheckInOptions {
  checkedInAt?: string; // ISO timestamp
  timezone?: string;
  status?: 'on_time' | 'late';
}

/**
 * Create a test check-in for a member
 */
export async function createTestCheckIn(
  memberId: string,
  options: CreateCheckInOptions = {}
): Promise<TestCheckIn> {
  const client = getTestSupabaseClient();
  const now = new Date().toISOString();

  const checkInData = {
    member_id: memberId,
    checked_in_at: options.checkedInAt || now,
    timezone: options.timezone || 'America/New_York',
    status: options.status || 'on_time',
    created_at: now,
  };

  const {data, error} = await client
    .from('check_ins')
    .insert(checkInData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test check-in: ${error.message}`);
  }

  return data as TestCheckIn;
}

/**
 * Create a check-in for today at a specific time
 */
export async function createTodayCheckIn(
  memberId: string,
  timeString: string = '09:00', // HH:MM format
  timezone: string = 'America/New_York'
): Promise<TestCheckIn> {
  const today = new Date();
  const [hours, minutes] = timeString.split(':').map(Number);
  today.setHours(hours, minutes, 0, 0);

  return createTestCheckIn(memberId, {
    checkedInAt: today.toISOString(),
    timezone,
    status: 'on_time',
  });
}

/**
 * Create a late check-in
 */
export async function createLateCheckIn(
  memberId: string,
  minutesLate: number = 30,
  timezone: string = 'America/New_York'
): Promise<TestCheckIn> {
  const now = new Date();

  return createTestCheckIn(memberId, {
    checkedInAt: now.toISOString(),
    timezone,
    status: 'late',
  });
}

/**
 * Create a missed check-in alert record
 */
export async function createTestMissedAlert(
  memberId: string,
  contactsNotified: number = 1
): Promise<TestMissedAlert> {
  const client = getTestSupabaseClient();
  const now = new Date().toISOString();

  const alertData = {
    member_id: memberId,
    sent_at: now,
    contacts_notified: contactsNotified,
  };

  const {data, error} = await client
    .from('missed_check_in_alerts')
    .insert(alertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test missed alert: ${error.message}`);
  }

  return data as TestMissedAlert;
}

/**
 * Create a reminder notification record
 */
export async function createTestReminderNotification(
  memberId: string,
  checkInTime: string = '09:00',
  reminderMinutesBefore: number = 15
): Promise<TestReminderNotification> {
  const client = getTestSupabaseClient();
  const now = new Date().toISOString();

  const reminderData = {
    member_id: memberId,
    reminder_minutes_before: reminderMinutesBefore,
    check_in_time: checkInTime,
    sent_at: now,
  };

  const {data, error} = await client
    .from('reminder_notifications')
    .insert(reminderData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test reminder notification: ${error.message}`);
  }

  return data as TestReminderNotification;
}

/**
 * Create multiple check-ins for history testing
 */
export async function createCheckInHistory(
  memberId: string,
  days: number = 7,
  timezone: string = 'America/New_York'
): Promise<TestCheckIn[]> {
  const checkIns: TestCheckIn[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(9, 0, 0, 0); // 9 AM check-in

    const checkIn = await createTestCheckIn(memberId, {
      checkedInAt: date.toISOString(),
      timezone,
      status: 'on_time',
    });

    checkIns.push(checkIn);
  }

  return checkIns;
}

/**
 * Create a check-in with gaps (for testing missed check-in detection)
 */
export async function createCheckInHistoryWithGaps(
  memberId: string,
  totalDays: number = 14,
  missedDays: number[] = [3, 7, 10], // Days to skip (0 = today)
  timezone: string = 'America/New_York'
): Promise<{checkIns: TestCheckIn[]; missedDates: string[]}> {
  const checkIns: TestCheckIn[] = [];
  const missedDates: string[] = [];

  for (let i = 0; i < totalDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(9, 0, 0, 0);

    if (missedDays.includes(i)) {
      missedDates.push(date.toISOString().split('T')[0]);
      continue;
    }

    const checkIn = await createTestCheckIn(memberId, {
      checkedInAt: date.toISOString(),
      timezone,
      status: 'on_time',
    });

    checkIns.push(checkIn);
  }

  return {checkIns, missedDates};
}

/**
 * Get all check-ins for a member
 */
export async function getCheckInsForMember(memberId: string): Promise<TestCheckIn[]> {
  const client = getTestSupabaseClient();

  const {data, error} = await client
    .from('check_ins')
    .select('*')
    .eq('member_id', memberId)
    .order('checked_in_at', {ascending: false});

  if (error) {
    throw new Error(`Failed to get check-ins: ${error.message}`);
  }

  return data as TestCheckIn[];
}

/**
 * Get check-ins for a member on a specific date
 */
export async function getCheckInsForDate(
  memberId: string,
  date: Date
): Promise<TestCheckIn[]> {
  const client = getTestSupabaseClient();

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const {data, error} = await client
    .from('check_ins')
    .select('*')
    .eq('member_id', memberId)
    .gte('checked_in_at', startOfDay.toISOString())
    .lte('checked_in_at', endOfDay.toISOString());

  if (error) {
    throw new Error(`Failed to get check-ins for date: ${error.message}`);
  }

  return data as TestCheckIn[];
}

/**
 * Delete all check-ins for a member
 */
export async function deleteCheckInsForMember(memberId: string): Promise<void> {
  const client = getTestSupabaseClient();

  const {error} = await client
    .from('check_ins')
    .delete()
    .eq('member_id', memberId);

  if (error) {
    throw new Error(`Failed to delete check-ins: ${error.message}`);
  }
}

export default {
  createTestCheckIn,
  createTodayCheckIn,
  createLateCheckIn,
  createTestMissedAlert,
  createTestReminderNotification,
  createCheckInHistory,
  createCheckInHistoryWithGaps,
  getCheckInsForMember,
  getCheckInsForDate,
  deleteCheckInsForMember,
};
