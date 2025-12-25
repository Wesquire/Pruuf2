/**
 * Member Slice
 * Manages member, contact, and check-in state
 */

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {membersAPI, contactsAPI} from '../../services/api';
import type {MemberInfo, ContactInfo} from '../../types/api';

/**
 * Check-in record from API
 */
interface CheckIn {
  id: string;
  checked_in_at: string;
  timezone: string;
  was_late: boolean;
  minutes_late: number | null;
}

/**
 * Check-in history statistics
 */
interface CheckInStats {
  total_check_ins: number;
  on_time_check_ins: number;
  late_check_ins: number;
  missed_check_ins: number;
  on_time_percentage: number;
}

/**
 * Check-in history response structure
 */
interface CheckInHistoryResponse {
  check_ins: CheckIn[];
  stats: CheckInStats;
}

interface MemberState {
  members: MemberInfo[];
  contacts: ContactInfo[];
  checkIns: CheckIn[];
  selectedMember: MemberInfo | null;
  selectedContact: ContactInfo | null;
  isLoading: boolean;
  error: string | null;
  checkInHistory: CheckIn[];
  checkInStats: CheckInStats | null;
  isLoadingHistory: boolean;
}

const initialState: MemberState = {
  members: [],
  contacts: [],
  checkIns: [],
  selectedMember: null,
  selectedContact: null,
  isLoading: false,
  error: null,
  checkInHistory: [],
  checkInStats: null,
  isLoadingHistory: false,
};

// Async thunks
export const fetchMembers = createAsyncThunk<MemberInfo[], void, {rejectValue: string}>(
  'member/fetchMembers',
  async (_, {rejectWithValue}) => {
    try {
      const response = await contactsAPI.getMembers();
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to fetch members');
      }
      return response.members || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchContacts = createAsyncThunk<ContactInfo[], string, {rejectValue: string}>(
  'member/fetchContacts',
  async (memberId: string, {rejectWithValue}) => {
    try {
      const response = await membersAPI.getContacts(memberId);
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to fetch contacts');
      }
      return response.contacts || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const addMember = createAsyncThunk<
  MemberInfo | undefined,
  {name: string; email: string},
  {rejectValue: string}
>(
  'member/addMember',
  async (memberData, {rejectWithValue}) => {
    try {
      const response = await membersAPI.invite(
        memberData.name,
        memberData.email,
      );
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to add member');
      }
      return response.member;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateCheckInTime = createAsyncThunk(
  'member/updateCheckInTime',
  async (
    {
      memberId,
      checkInTime,
      timezone,
    }: {memberId: string; checkInTime: string; timezone: string},
    {rejectWithValue},
  ) => {
    try {
      const response = await membersAPI.updateCheckInTime(
        memberId,
        checkInTime,
        timezone,
      );
      if (!response.success) {
        return rejectWithValue(
          response.error || 'Failed to update check-in time',
        );
      }
      return {memberId, checkInTime};
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const performCheckIn = createAsyncThunk(
  'member/performCheckIn',
  async (
    {memberId, timezone}: {memberId: string; timezone: string},
    {rejectWithValue},
  ) => {
    try {
      const response = await membersAPI.checkIn(memberId, timezone);
      if (!response.success) {
        return rejectWithValue('Failed to check in');
      }
      return response.check_in;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchCheckInHistory = createAsyncThunk<
  CheckInHistoryResponse,
  {memberId: string; filter?: '7days' | '30days' | 'all'},
  {rejectValue: string}
>(
  'member/fetchCheckInHistory',
  async ({memberId, filter = '30days'}, {rejectWithValue}) => {
    try {
      const response = await contactsAPI.getMemberCheckInHistory(memberId, filter);
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to fetch check-in history');
      }
      return {
        check_ins: response.check_ins || [],
        stats: response.stats || {
          total_check_ins: 0,
          on_time_check_ins: 0,
          late_check_ins: 0,
          missed_check_ins: 0,
          on_time_percentage: 0,
        },
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const removeRelationship = createAsyncThunk(
  'member/removeRelationship',
  async (relationshipId: string, {rejectWithValue}) => {
    try {
      const response = await contactsAPI.removeRelationship(relationshipId);
      if (!response.success) {
        return rejectWithValue(
          response.error || 'Failed to remove relationship',
        );
      }
      return relationshipId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

// Slice
const memberSlice = createSlice({
  name: 'member',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    setSelectedMember: (state, action: PayloadAction<MemberInfo | null>) => {
      state.selectedMember = action.payload;
    },
    setSelectedContact: (state, action: PayloadAction<ContactInfo | null>) => {
      state.selectedContact = action.payload;
    },
    clearCheckInHistory: state => {
      state.checkInHistory = [];
      state.checkInStats = null;
    },
  },
  extraReducers: builder => {
    // Fetch members
    builder.addCase(fetchMembers.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchMembers.fulfilled, (state, action) => {
      state.isLoading = false;
      state.members = action.payload;
    });
    builder.addCase(fetchMembers.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch contacts
    builder.addCase(fetchContacts.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchContacts.fulfilled, (state, action) => {
      state.isLoading = false;
      state.contacts = action.payload;
    });
    builder.addCase(fetchContacts.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Add member
    builder.addCase(addMember.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(addMember.fulfilled, (state, action) => {
      state.isLoading = false;
      if (action.payload) {
        state.members.push(action.payload);
      }
    });
    builder.addCase(addMember.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Update check-in time
    builder.addCase(updateCheckInTime.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateCheckInTime.fulfilled, (state, action) => {
      state.isLoading = false;
      const {memberId, checkInTime} = action.payload;
      const member = state.members.find(m => m.id === memberId);
      if (member) {
        member.check_in_time = checkInTime;
      }
    });
    builder.addCase(updateCheckInTime.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Perform check-in
    builder.addCase(performCheckIn.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(performCheckIn.fulfilled, (state, action) => {
      state.isLoading = false;
      if (action.payload) {
        // Convert API response to CheckIn format
        const checkIn: CheckIn = {
          id: action.payload.id,
          checked_in_at: action.payload.checked_in_at,
          timezone: action.payload.timezone,
          was_late: false,
          minutes_late: null,
        };
        state.checkIns.push(checkIn);
      }
    });
    builder.addCase(performCheckIn.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch check-in history
    builder.addCase(fetchCheckInHistory.pending, state => {
      state.isLoadingHistory = true;
      state.error = null;
    });
    builder.addCase(fetchCheckInHistory.fulfilled, (state, action) => {
      state.isLoadingHistory = false;
      state.checkInHistory = action.payload.check_ins;
      state.checkInStats = action.payload.stats;
    });
    builder.addCase(fetchCheckInHistory.rejected, (state, action) => {
      state.isLoadingHistory = false;
      state.error = action.payload as string;
    });

    // Remove relationship
    builder.addCase(removeRelationship.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(removeRelationship.fulfilled, (state, action) => {
      state.isLoading = false;
      state.members = state.members.filter(m => m.id !== action.payload);
      state.contacts = state.contacts.filter(c => c.id !== action.payload);
    });
    builder.addCase(removeRelationship.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const {
  clearError,
  setSelectedMember,
  setSelectedContact,
  clearCheckInHistory,
} = memberSlice.actions;
export default memberSlice.reducer;
