/**
 * Member Slice
 * Manages member, contact, and check-in state
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { memberAPI, contactAPI } from '../../services/api';

interface Member {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  checkInTime: string;
  timezone: string;
  lastCheckIn?: string;
  status: 'active' | 'pending' | 'late' | 'missed';
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  status: 'active' | 'pending';
}

interface CheckIn {
  id: string;
  memberId: string;
  timestamp: string;
  status: 'on_time' | 'late' | 'missed';
  timezone: string;
}

interface MemberState {
  members: Member[];
  contacts: Contact[];
  checkIns: CheckIn[];
  selectedMember: Member | null;
  selectedContact: Contact | null;
  isLoading: boolean;
  error: string | null;
  checkInHistory: CheckIn[];
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
  isLoadingHistory: false,
};

// Async thunks
export const fetchMembers = createAsyncThunk(
  'member/fetchMembers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await memberAPI.getMembers();
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to fetch members');
      }
      return response.members || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchContacts = createAsyncThunk(
  'member/fetchContacts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await contactAPI.getContacts();
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to fetch contacts');
      }
      return response.contacts || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const addMember = createAsyncThunk(
  'member/addMember',
  async (
    memberData: {
      name: string;
      phone: string;
      relationship: string;
      checkInTime: string;
      timezone: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await memberAPI.inviteMember(memberData);
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to add member');
      }
      return response.member;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateCheckInTime = createAsyncThunk(
  'member/updateCheckInTime',
  async (
    { memberId, checkInTime }: { memberId: string; checkInTime: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await memberAPI.updateCheckInTime(memberId, checkInTime);
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to update check-in time');
      }
      return { memberId, checkInTime };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const performCheckIn = createAsyncThunk(
  'member/performCheckIn',
  async (memberId: string, { rejectWithValue }) => {
    try {
      const response = await memberAPI.checkIn(memberId);
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to check in');
      }
      return response.checkIn;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCheckInHistory = createAsyncThunk(
  'member/fetchCheckInHistory',
  async (memberId: string, { rejectWithValue }) => {
    try {
      const response = await memberAPI.getCheckInHistory(memberId);
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to fetch check-in history');
      }
      return response.checkIns || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeRelationship = createAsyncThunk(
  'member/removeRelationship',
  async (relationshipId: string, { rejectWithValue }) => {
    try {
      const response = await memberAPI.removeRelationship(relationshipId);
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to remove relationship');
      }
      return relationshipId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const memberSlice = createSlice({
  name: 'member',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    setSelectedMember: (state, action: PayloadAction<Member | null>) => {
      state.selectedMember = action.payload;
    },
    setSelectedContact: (state, action: PayloadAction<Contact | null>) => {
      state.selectedContact = action.payload;
    },
    clearCheckInHistory: state => {
      state.checkInHistory = [];
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
      const { memberId, checkInTime } = action.payload;
      const member = state.members.find(m => m.id === memberId);
      if (member) {
        member.checkInTime = checkInTime;
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
        state.checkIns.push(action.payload);
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
      state.checkInHistory = action.payload;
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

export const { clearError, setSelectedMember, setSelectedContact, clearCheckInHistory } =
  memberSlice.actions;
export default memberSlice.reducer;
