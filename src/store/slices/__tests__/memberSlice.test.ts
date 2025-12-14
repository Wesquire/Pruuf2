/**
 * Member Slice Tests
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
import {membersAPI, contactsAPI} from '../../../services/api';

// Mock API
jest.mock('../../../services/api');

const mockedMembersAPI = membersAPI as jest.Mocked<typeof membersAPI>;
const mockedContactsAPI = contactsAPI as jest.Mocked<typeof contactsAPI>;

describe('memberSlice', () => {
  const initialState = {
    members: [],
    contacts: [],
    checkIns: [],
    selectedMember: null,
    selectedContact: null,
    isLoading: false,
    error: null,
    checkInHistory: [],
    isLoadingHistory: false,
  };

  describe('reducers', () => {
    it('should handle clearError', () => {
      const state = {...initialState, error: 'Test error'};
      expect(memberReducer(state, clearError())).toEqual({
        ...state,
        error: null,
      });
    });

    it('should handle setSelectedMember', () => {
      const member = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        relationship: 'parent',
        checkInTime: '09:00',
        timezone: 'America/New_York',
        status: 'active' as const,
      };

      expect(memberReducer(initialState, setSelectedMember(member))).toEqual({
        ...initialState,
        selectedMember: member,
      });
    });

    it('should handle setSelectedContact', () => {
      const contact = {
        id: '1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        relationship: 'child',
        status: 'active' as const,
      };

      expect(memberReducer(initialState, setSelectedContact(contact))).toEqual({
        ...initialState,
        selectedContact: contact,
      });
    });

    it('should handle clearCheckInHistory', () => {
      const state = {
        ...initialState,
        checkInHistory: [
          {
            id: '1',
            memberId: '1',
            timestamp: '2024-01-01T09:00:00Z',
            status: 'on_time' as const,
            timezone: 'America/New_York',
          },
        ],
      };

      expect(memberReducer(state, clearCheckInHistory())).toEqual({
        ...state,
        checkInHistory: [],
      });
    });
  });

  describe('fetchMembers', () => {
    it('should set loading state on pending', () => {
      const action = {type: fetchMembers.pending.type};
      expect(memberReducer(initialState, action)).toEqual({
        ...initialState,
        isLoading: true,
        error: null,
      });
    });

    it('should set members on fulfilled', () => {
      const members = [
        {
          id: '1',
          name: 'John Doe',
          email: 'test@example.com',
          relationship: 'parent',
          checkInTime: '09:00',
          timezone: 'America/New_York',
          status: 'active' as const,
        },
      ];

      const action = {type: fetchMembers.fulfilled.type, payload: members};
      expect(memberReducer(initialState, action)).toEqual({
        ...initialState,
        isLoading: false,
        members,
      });
    });

    it('should set error on rejected', () => {
      const action = {
        type: fetchMembers.rejected.type,
        payload: 'Error message',
      };
      expect(memberReducer(initialState, action)).toEqual({
        ...initialState,
        isLoading: false,
        error: 'Error message',
      });
    });
  });

  describe('fetchContacts', () => {
    it('should set contacts on fulfilled', () => {
      const contacts = [
        {
          id: '1',
          name: 'Jane Doe',
          email: 'test@example.com',
          relationship: 'child',
          status: 'active' as const,
        },
      ];

      const action = {type: fetchContacts.fulfilled.type, payload: contacts};
      expect(memberReducer(initialState, action)).toEqual({
        ...initialState,
        isLoading: false,
        contacts,
      });
    });
  });

  describe('addMember', () => {
    it('should add member on fulfilled', () => {
      const newMember = {
        id: '1',
        name: 'John Doe',
        email: 'test@example.com',
        relationship: 'parent',
        checkInTime: '09:00',
        timezone: 'America/New_York',
        status: 'pending' as const,
      };

      const action = {type: addMember.fulfilled.type, payload: newMember};
      expect(memberReducer(initialState, action)).toEqual({
        ...initialState,
        isLoading: false,
        members: [newMember],
      });
    });
  });

  describe('updateCheckInTime', () => {
    it('should update member check-in time on fulfilled', () => {
      const state = {
        ...initialState,
        members: [
          {
            id: '1',
            name: 'John Doe',
            email: 'test@example.com',
            relationship: 'parent',
            checkInTime: '09:00',
            timezone: 'America/New_York',
            status: 'active' as const,
          },
        ],
      };

      const action = {
        type: updateCheckInTime.fulfilled.type,
        payload: {memberId: '1', checkInTime: '10:00'},
      };

      const result = memberReducer(state, action);
      expect(result.members[0].checkInTime).toBe('10:00');
    });
  });

  describe('performCheckIn', () => {
    it('should add check-in on fulfilled', () => {
      const checkIn = {
        id: '1',
        memberId: '1',
        timestamp: '2024-01-01T09:00:00Z',
        status: 'on_time' as const,
        timezone: 'America/New_York',
      };

      const action = {type: performCheckIn.fulfilled.type, payload: checkIn};
      expect(memberReducer(initialState, action)).toEqual({
        ...initialState,
        isLoading: false,
        checkIns: [checkIn],
      });
    });
  });

  describe('fetchCheckInHistory', () => {
    it('should set check-in history on fulfilled', () => {
      const checkIns = [
        {
          id: '1',
          memberId: '1',
          timestamp: '2024-01-01T09:00:00Z',
          status: 'on_time' as const,
          timezone: 'America/New_York',
        },
      ];

      const action = {
        type: fetchCheckInHistory.fulfilled.type,
        payload: checkIns,
      };
      expect(memberReducer(initialState, action)).toEqual({
        ...initialState,
        isLoadingHistory: false,
        checkInHistory: checkIns,
      });
    });
  });

  describe('removeRelationship', () => {
    it('should remove member and contact on fulfilled', () => {
      const state = {
        ...initialState,
        members: [
          {
            id: '1',
            name: 'John Doe',
            email: 'test@example.com',
            relationship: 'parent',
            checkInTime: '09:00',
            timezone: 'America/New_York',
            status: 'active' as const,
          },
        ],
        contacts: [
          {
            id: '2',
            name: 'Jane Doe',
            email: 'test@example.com',
            relationship: 'child',
            status: 'active' as const,
          },
        ],
      };

      const action = {type: removeRelationship.fulfilled.type, payload: '1'};
      const result = memberReducer(state, action);

      expect(result.members).toHaveLength(0);
      expect(result.contacts).toHaveLength(1);
    });
  });
});
