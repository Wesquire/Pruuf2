/**
 * Member Slice Tests
 * Updated to match Phase 4.1 & 4.2 types (MemberInfo, ContactInfo, CheckInStats)
 */

import memberReducer, {
  fetchMembers,
  fetchContacts,
  addMember,
  updateCheckInTime,
  performCheckIn,
  fetchCheckInHistory,
  removeRelationship,
  clearError,
  setSelectedMember,
  setSelectedContact,
  clearCheckInHistory,
} from '../memberSlice';
import type {MemberInfo, ContactInfo} from '../../../types/api';

// Mock API
jest.mock('../../../services/api');

// Type-safe initial state matching MemberState
const initialState = {
  members: [] as MemberInfo[],
  contacts: [] as ContactInfo[],
  checkIns: [] as any[],
  selectedMember: null as MemberInfo | null,
  selectedContact: null as ContactInfo | null,
  isLoading: false,
  error: null as string | null,
  checkInHistory: [] as any[],
  checkInStats: null as any,
  isLoadingHistory: false,
};

// Sample test data matching API types
const sampleMember: MemberInfo = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  email_masked: 'j***@example.com',
  status: 'active',
  check_in_time: '09:00',
  timezone: 'America/New_York',
  formatted_time: '9:00 AM',
  last_check_in: {
    checked_in_at: '2024-01-01T09:00:00Z',
    local_time: '9:00 AM',
    minutes_early: 0,
  },
  connected_at: '2024-01-01T00:00:00Z',
};

const sampleContact: ContactInfo = {
  id: '2',
  name: 'Jane Doe',
  email: 'jane@example.com',
  email_masked: 'j***@example.com',
  status: 'active',
  connected_at: '2024-01-01T00:00:00Z',
};

const sampleCheckIn = {
  id: '1',
  checked_in_at: '2024-01-01T09:00:00Z',
  timezone: 'America/New_York',
  was_late: false,
  minutes_late: null,
};

const sampleCheckInStats = {
  total_check_ins: 10,
  on_time_check_ins: 8,
  late_check_ins: 1,
  missed_check_ins: 1,
  on_time_percentage: 80,
};

describe('memberSlice', () => {
  describe('reducers', () => {
    it('should return initial state', () => {
      const result = memberReducer(undefined, {type: 'unknown'});
      expect(result.members).toEqual([]);
      expect(result.contacts).toEqual([]);
      expect(result.isLoading).toBe(false);
      expect(result.error).toBeNull();
    });

    it('should handle clearError', () => {
      const state = {...initialState, error: 'Test error'};
      expect(memberReducer(state, clearError())).toEqual({
        ...state,
        error: null,
      });
    });

    it('should handle setSelectedMember', () => {
      const result = memberReducer(initialState, setSelectedMember(sampleMember));
      expect(result.selectedMember).toEqual(sampleMember);
    });

    it('should handle setSelectedMember with null', () => {
      const stateWithMember = {...initialState, selectedMember: sampleMember};
      const result = memberReducer(stateWithMember, setSelectedMember(null));
      expect(result.selectedMember).toBeNull();
    });

    it('should handle setSelectedContact', () => {
      const result = memberReducer(initialState, setSelectedContact(sampleContact));
      expect(result.selectedContact).toEqual(sampleContact);
    });

    it('should handle setSelectedContact with null', () => {
      const stateWithContact = {...initialState, selectedContact: sampleContact};
      const result = memberReducer(stateWithContact, setSelectedContact(null));
      expect(result.selectedContact).toBeNull();
    });

    it('should handle clearCheckInHistory', () => {
      const state = {
        ...initialState,
        checkInHistory: [sampleCheckIn],
        checkInStats: sampleCheckInStats,
      };

      const result = memberReducer(state, clearCheckInHistory());
      expect(result.checkInHistory).toEqual([]);
    });
  });

  describe('fetchMembers async thunk', () => {
    it('should set loading state on pending', () => {
      const action = {type: fetchMembers.pending.type};
      const result = memberReducer(initialState, action);
      expect(result.isLoading).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should set members on fulfilled', () => {
      const members = [sampleMember];
      const action = {type: fetchMembers.fulfilled.type, payload: members};
      const result = memberReducer(initialState, action);
      expect(result.isLoading).toBe(false);
      expect(result.members).toEqual(members);
    });

    it('should handle empty members array', () => {
      const action = {type: fetchMembers.fulfilled.type, payload: []};
      const result = memberReducer(initialState, action);
      expect(result.members).toEqual([]);
    });

    it('should set error on rejected', () => {
      const action = {
        type: fetchMembers.rejected.type,
        payload: 'Failed to fetch members',
      };
      const result = memberReducer(initialState, action);
      expect(result.isLoading).toBe(false);
      expect(result.error).toBe('Failed to fetch members');
    });

    it('should replace existing members on fulfilled', () => {
      const existingState = {...initialState, members: [sampleMember]};
      const newMember = {...sampleMember, id: '2', name: 'New Member'};
      const action = {type: fetchMembers.fulfilled.type, payload: [newMember]};

      const result = memberReducer(existingState, action);
      expect(result.members).toHaveLength(1);
      expect(result.members[0].id).toBe('2');
    });
  });

  describe('fetchContacts async thunk', () => {
    it('should set loading state on pending', () => {
      const action = {type: fetchContacts.pending.type};
      const result = memberReducer(initialState, action);
      expect(result.isLoading).toBe(true);
    });

    it('should set contacts on fulfilled', () => {
      const contacts = [sampleContact];
      const action = {type: fetchContacts.fulfilled.type, payload: contacts};
      const result = memberReducer(initialState, action);
      expect(result.isLoading).toBe(false);
      expect(result.contacts).toEqual(contacts);
    });

    it('should handle empty contacts array', () => {
      const action = {type: fetchContacts.fulfilled.type, payload: []};
      const result = memberReducer(initialState, action);
      expect(result.contacts).toEqual([]);
    });

    it('should set error on rejected', () => {
      const action = {
        type: fetchContacts.rejected.type,
        payload: 'Failed to fetch contacts',
      };
      const result = memberReducer(initialState, action);
      expect(result.error).toBe('Failed to fetch contacts');
    });
  });

  describe('addMember async thunk', () => {
    it('should set loading state on pending', () => {
      const action = {type: addMember.pending.type};
      const result = memberReducer(initialState, action);
      expect(result.isLoading).toBe(true);
    });

    it('should add member to list on fulfilled', () => {
      const newMember = {...sampleMember, status: 'pending' as const};
      const action = {type: addMember.fulfilled.type, payload: newMember};
      const result = memberReducer(initialState, action);
      expect(result.isLoading).toBe(false);
      expect(result.members).toContainEqual(newMember);
    });

    it('should append to existing members on fulfilled', () => {
      const existingState = {...initialState, members: [sampleMember]};
      const newMember = {...sampleMember, id: '2', name: 'New Member'};
      const action = {type: addMember.fulfilled.type, payload: newMember};

      const result = memberReducer(existingState, action);
      expect(result.members).toHaveLength(2);
    });

    it('should set error on rejected', () => {
      const action = {
        type: addMember.rejected.type,
        payload: 'Failed to add member',
      };
      const result = memberReducer(initialState, action);
      expect(result.error).toBe('Failed to add member');
    });
  });

  describe('updateCheckInTime async thunk', () => {
    it('should set loading state on pending', () => {
      const action = {type: updateCheckInTime.pending.type};
      const result = memberReducer(initialState, action);
      expect(result.isLoading).toBe(true);
    });

    it('should update member check-in time on fulfilled', () => {
      const state = {...initialState, members: [sampleMember]};
      const action = {
        type: updateCheckInTime.fulfilled.type,
        payload: {memberId: '1', checkInTime: '10:00'},
      };

      const result = memberReducer(state, action);
      expect(result.members[0].check_in_time).toBe('10:00');
      expect(result.isLoading).toBe(false);
    });

    it('should not modify non-matching members', () => {
      const otherMember = {...sampleMember, id: '2'};
      const state = {...initialState, members: [sampleMember, otherMember]};
      const action = {
        type: updateCheckInTime.fulfilled.type,
        payload: {memberId: '1', checkInTime: '10:00'},
      };

      const result = memberReducer(state, action);
      expect(result.members[0].check_in_time).toBe('10:00');
      expect(result.members[1].check_in_time).toBe('09:00');
    });

    it('should set error on rejected', () => {
      const action = {
        type: updateCheckInTime.rejected.type,
        payload: 'Failed to update check-in time',
      };
      const result = memberReducer(initialState, action);
      expect(result.error).toBe('Failed to update check-in time');
    });
  });

  describe('performCheckIn async thunk', () => {
    it('should set loading state on pending', () => {
      const action = {type: performCheckIn.pending.type};
      const result = memberReducer(initialState, action);
      expect(result.isLoading).toBe(true);
    });

    it('should add check-in to list on fulfilled', () => {
      const action = {type: performCheckIn.fulfilled.type, payload: sampleCheckIn};
      const result = memberReducer(initialState, action);
      expect(result.isLoading).toBe(false);
      expect(result.checkIns).toContainEqual(sampleCheckIn);
    });

    it('should set error on rejected', () => {
      const action = {
        type: performCheckIn.rejected.type,
        payload: 'Failed to check in',
      };
      const result = memberReducer(initialState, action);
      expect(result.error).toBe('Failed to check in');
    });
  });

  describe('fetchCheckInHistory async thunk', () => {
    it('should set loading history state on pending', () => {
      const action = {type: fetchCheckInHistory.pending.type};
      const result = memberReducer(initialState, action);
      expect(result.isLoadingHistory).toBe(true);
    });

    it('should set check-in history and stats on fulfilled', () => {
      const payload = {
        check_ins: [sampleCheckIn],
        stats: sampleCheckInStats,
      };
      const action = {type: fetchCheckInHistory.fulfilled.type, payload};
      const result = memberReducer(initialState, action);
      expect(result.isLoadingHistory).toBe(false);
      expect(result.checkInHistory).toEqual([sampleCheckIn]);
      expect(result.checkInStats).toEqual(sampleCheckInStats);
    });

    it('should handle empty check-in history', () => {
      const payload = {
        check_ins: [],
        stats: {
          total_check_ins: 0,
          on_time_check_ins: 0,
          late_check_ins: 0,
          missed_check_ins: 0,
          on_time_percentage: 0,
        },
      };
      const action = {type: fetchCheckInHistory.fulfilled.type, payload};
      const result = memberReducer(initialState, action);
      expect(result.checkInHistory).toEqual([]);
      expect(result.checkInStats?.total_check_ins).toBe(0);
    });

    it('should replace existing history on fulfilled', () => {
      const existingState = {
        ...initialState,
        checkInHistory: [{...sampleCheckIn, id: 'old'}],
        checkInStats: {...sampleCheckInStats, total_check_ins: 5},
      };
      const payload = {
        check_ins: [sampleCheckIn],
        stats: sampleCheckInStats,
      };
      const action = {type: fetchCheckInHistory.fulfilled.type, payload};

      const result = memberReducer(existingState, action);
      expect(result.checkInHistory).toHaveLength(1);
      expect(result.checkInHistory[0].id).toBe('1');
      expect(result.checkInStats?.total_check_ins).toBe(10);
    });

    it('should set error on rejected', () => {
      const action = {
        type: fetchCheckInHistory.rejected.type,
        payload: 'Failed to fetch check-in history',
      };
      const result = memberReducer(initialState, action);
      expect(result.isLoadingHistory).toBe(false);
      expect(result.error).toBe('Failed to fetch check-in history');
    });
  });

  describe('removeRelationship async thunk', () => {
    it('should set loading state on pending', () => {
      const action = {type: removeRelationship.pending.type};
      const result = memberReducer(initialState, action);
      expect(result.isLoading).toBe(true);
    });

    it('should remove member from list on fulfilled', () => {
      const state = {...initialState, members: [sampleMember]};
      const action = {type: removeRelationship.fulfilled.type, payload: '1'};

      const result = memberReducer(state, action);
      expect(result.members).toHaveLength(0);
      expect(result.isLoading).toBe(false);
    });

    it('should remove contact from list on fulfilled', () => {
      const state = {...initialState, contacts: [sampleContact]};
      const action = {type: removeRelationship.fulfilled.type, payload: '2'};

      const result = memberReducer(state, action);
      expect(result.contacts).toHaveLength(0);
    });

    it('should only remove matching member/contact', () => {
      const otherMember = {...sampleMember, id: '3'};
      const state = {...initialState, members: [sampleMember, otherMember]};
      const action = {type: removeRelationship.fulfilled.type, payload: '1'};

      const result = memberReducer(state, action);
      expect(result.members).toHaveLength(1);
      expect(result.members[0].id).toBe('3');
    });

    it('should set error on rejected', () => {
      const action = {
        type: removeRelationship.rejected.type,
        payload: 'Failed to remove relationship',
      };
      const result = memberReducer(initialState, action);
      expect(result.error).toBe('Failed to remove relationship');
    });
  });

  describe('state consistency', () => {
    it('should preserve unrelated state on updates', () => {
      const state = {
        ...initialState,
        members: [sampleMember],
        contacts: [sampleContact],
        selectedMember: sampleMember,
        error: 'previous error',
      };

      const action = {type: fetchMembers.pending.type};
      const result = memberReducer(state, action);

      // contacts and selectedMember should be preserved
      expect(result.contacts).toEqual(state.contacts);
      expect(result.selectedMember).toEqual(state.selectedMember);
      // error should be cleared on pending
      expect(result.error).toBeNull();
    });

    it('should clear error on new pending action', () => {
      const state = {...initialState, error: 'Some error'};
      const actions = [
        {type: fetchMembers.pending.type},
        {type: fetchContacts.pending.type},
        {type: addMember.pending.type},
        {type: performCheckIn.pending.type},
      ];

      actions.forEach(action => {
        const result = memberReducer(state, action);
        expect(result.error).toBeNull();
      });
    });
  });
});
