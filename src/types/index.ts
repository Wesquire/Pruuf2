/**
 * Pruuf Type Definitions
 */

export * from './database';
export * from './api';

// Navigation types
export type RootStackParamList = {
  // Auth
<<<<<<< Updated upstream
  Welcome: undefined;
  PhoneEntry: undefined;
  VerificationCode: { phone: string };
  CreatePin: { phone: string; sessionToken: string };
  ConfirmPin: { phone: string; sessionToken: string; pin: string };
=======
  Welcome: { inviteCode?: string };
  EmailEntry: undefined;
  EmailVerification: { email: string };
  CreatePin: { email: string; sessionToken: string };
  ConfirmPin: { email: string; sessionToken: string; pin: string };
>>>>>>> Stashed changes
  FontSize: { isOnboarding: boolean };

  // Contact Onboarding
  TrialWelcome: undefined;
  AddMember: undefined;
  ManualMemberEntry: undefined;
  ReviewMember: { name: string; email: string };
  InviteSent: { name: string; email: string; inviteCode: string };

  // Member Onboarding
  MemberWelcome: { contactName: string };
  EnterInviteCode: undefined;
  SetCheckInTime: undefined;
  ReviewSetup: { checkInTime: string; timezone: string; reminderEnabled: boolean };

  // Main App
  MainTabs: undefined;
  MemberDetail: { memberId: string };
  ContactDetail: { contactId: string };

  // Settings
  Settings: undefined;
  CheckInTimeSettings: undefined;
  FontSizeSettings: undefined;
  ContactsSettings: undefined;
  PaymentSettings: undefined;
  AddPayment: undefined;
  AccountSettings: undefined;
  HelpSupport: undefined;
  DeleteAccount: undefined;
};

export type MemberTabParamList = {
  MemberDashboard: undefined;
  MemberContacts: undefined;
  MemberSettings: undefined;
};

export type ContactTabParamList = {
  ContactDashboard: undefined;
  ContactSettings: undefined;
};

// App state types
export interface AuthState {
  isLoggedIn: boolean;
  user: import('./api').UserProfile | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface UserPreferences {
  fontSizePreference: import('./database').FontSizePreference;
  notificationsEnabled: boolean;
}
