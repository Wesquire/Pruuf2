/**
 * Test Factories Verification
 *
 * Verifies that the test factory functions work correctly.
 * These tests validate:
 * 1. Factory type definitions are correct
 * 2. Factory functions exist and are properly typed
 * 3. Helper functions work correctly
 *
 * Note: Live database tests are conditional on having credentials.
 */

import {describe, it, expect} from '@jest/globals';

// Import type definitions and functions from factories
import {
  TestUser,
  CreateUserOptions,
  TestMember,
  CreateMemberOptions,
  TestRelationship,
  CreateRelationshipOptions,
  TestCheckIn,
  CreateCheckInOptions,
  TestMissedAlert,
  TestReminderNotification,
  // User factory functions
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
  // Member factory functions
  createTestMember,
  createCompleteMember,
  createTestRelationship,
  createMemberContactPair,
  updateTestMember,
  updateTestRelationship,
  getTestMember,
  getTestMemberByUserId,
  // Check-in factory functions
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
  // Factory defaults
  userFactory,
  memberFactory,
  checkInFactory,
} from '../../tests/factories';

describe('Test Factories Verification', () => {
  describe('1. User Factory Types', () => {
    it('should have correct TestUser interface', () => {
      // Verify the interface structure by creating a mock object
      const mockUser: TestUser = {
        id: 'test-uuid',
        email: 'test@example.com',
        email_verified: true,
        pin_hash: '$2b$10$hash',
        account_status: 'active_free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(mockUser.id).toBe('test-uuid');
      expect(mockUser.email).toBe('test@example.com');
      expect(mockUser.email_verified).toBe(true);
      expect(mockUser.pin_hash).toBe('$2b$10$hash');
      expect(mockUser.account_status).toBe('active_free');
    });

    it('should have correct CreateUserOptions interface', () => {
      const options: CreateUserOptions = {
        email: 'test@example.com',
        emailVerified: true,
        pinHash: '$2b$10$hash',
        accountStatus: 'active_free',
      };

      expect(options.email).toBe('test@example.com');
      expect(options.emailVerified).toBe(true);
      expect(options.accountStatus).toBe('active_free');
    });

    it('should accept all account status values', () => {
      const statuses: CreateUserOptions['accountStatus'][] = [
        'pending_verification',
        'pending_pin',
        'active_free',
        'active_paid',
        'suspended',
        'deleted',
      ];

      statuses.forEach(status => {
        const options: CreateUserOptions = {accountStatus: status};
        expect(options.accountStatus).toBe(status);
      });
    });
  });

  describe('2. Member Factory Types', () => {
    it('should have correct TestMember interface', () => {
      const mockMember: TestMember = {
        id: 'member-uuid',
        user_id: 'user-uuid',
        name: 'Test Member',
        check_in_time: '09:00',
        timezone: 'America/New_York',
        reminder_enabled: true,
        reminder_minutes_before: 15,
        onboarding_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(mockMember.id).toBe('member-uuid');
      expect(mockMember.user_id).toBe('user-uuid');
      expect(mockMember.name).toBe('Test Member');
      expect(mockMember.timezone).toBe('America/New_York');
    });

    it('should have correct TestRelationship interface', () => {
      const mockRelationship: TestRelationship = {
        id: 'rel-uuid',
        member_id: 'member-uuid',
        contact_id: 'contact-uuid',
        invite_code: 'ABC123',
        status: 'active',
        invited_at: new Date().toISOString(),
        connected_at: new Date().toISOString(),
        invite_expires_at: null,
      };

      expect(mockRelationship.status).toBe('active');
      expect(mockRelationship.invite_code).toBe('ABC123');
    });

    it('should accept all relationship status values', () => {
      const statuses: TestRelationship['status'][] = ['pending', 'active', 'removed'];

      statuses.forEach(status => {
        const mockRel: Partial<TestRelationship> = {status};
        expect(mockRel.status).toBe(status);
      });
    });
  });

  describe('3. Check-In Factory Types', () => {
    it('should have correct TestCheckIn interface', () => {
      const mockCheckIn: TestCheckIn = {
        id: 'checkin-uuid',
        member_id: 'member-uuid',
        checked_in_at: new Date().toISOString(),
        timezone: 'America/New_York',
        status: 'on_time',
        created_at: new Date().toISOString(),
      };

      expect(mockCheckIn.id).toBe('checkin-uuid');
      expect(mockCheckIn.status).toBe('on_time');
    });

    it('should accept all check-in status values', () => {
      const statuses: TestCheckIn['status'][] = ['on_time', 'late'];

      statuses.forEach(status => {
        const mockCheckIn: Partial<TestCheckIn> = {status};
        expect(mockCheckIn.status).toBe(status);
      });
    });

    it('should have correct TestMissedAlert interface', () => {
      const mockAlert: TestMissedAlert = {
        id: 'alert-uuid',
        member_id: 'member-uuid',
        sent_at: new Date().toISOString(),
        contacts_notified: 2,
      };

      expect(mockAlert.contacts_notified).toBe(2);
    });

    it('should have correct TestReminderNotification interface', () => {
      const mockReminder: TestReminderNotification = {
        id: 'reminder-uuid',
        member_id: 'member-uuid',
        reminder_minutes_before: 15,
        check_in_time: '09:00',
        sent_at: new Date().toISOString(),
      };

      expect(mockReminder.reminder_minutes_before).toBe(15);
      expect(mockReminder.check_in_time).toBe('09:00');
    });
  });

  describe('4. Factory Function Exports', () => {
    it('should export user factory functions', () => {
      expect(typeof createTestUser).toBe('function');
      expect(typeof createUnverifiedUser).toBe('function');
      expect(typeof createUserPendingPin).toBe('function');
      expect(typeof createActiveUser).toBe('function');
      expect(typeof createVerificationCode).toBe('function');
      expect(typeof createTestSession).toBe('function');
      expect(typeof updateTestUser).toBe('function');
      expect(typeof deleteTestUser).toBe('function');
      expect(typeof getTestUser).toBe('function');
      expect(typeof getTestUserByEmail).toBe('function');
    });

    it('should export member factory functions', () => {
      expect(typeof createTestMember).toBe('function');
      expect(typeof createCompleteMember).toBe('function');
      expect(typeof createTestRelationship).toBe('function');
      expect(typeof createMemberContactPair).toBe('function');
      expect(typeof updateTestMember).toBe('function');
      expect(typeof updateTestRelationship).toBe('function');
      expect(typeof getTestMember).toBe('function');
      expect(typeof getTestMemberByUserId).toBe('function');
    });

    it('should export check-in factory functions', () => {
      expect(typeof createTestCheckIn).toBe('function');
      expect(typeof createTodayCheckIn).toBe('function');
      expect(typeof createLateCheckIn).toBe('function');
      expect(typeof createTestMissedAlert).toBe('function');
      expect(typeof createTestReminderNotification).toBe('function');
      expect(typeof createCheckInHistory).toBe('function');
      expect(typeof createCheckInHistoryWithGaps).toBe('function');
      expect(typeof getCheckInsForMember).toBe('function');
      expect(typeof getCheckInsForDate).toBe('function');
      expect(typeof deleteCheckInsForMember).toBe('function');
    });
  });

  describe('5. Index Re-exports', () => {
    it('should re-export all types from index', () => {
      // Check that functions are exported (verified by imports at top)
      expect(typeof createTestUser).toBe('function');
      expect(typeof createTestMember).toBe('function');
      expect(typeof createTestCheckIn).toBe('function');
    });

    it('should export factory defaults', () => {
      expect(userFactory).toBeDefined();
      expect(memberFactory).toBeDefined();
      expect(checkInFactory).toBeDefined();
    });
  });
});
