# Pruuf Workflow Test Audit Suite

## Test Environment
- **Date**: 2026-01-04
- **Backend**: Supabase (ivnstzpolgjzfqduhlvw.supabase.co)
- **Platform**: iOS Simulator / React Native Expo

---

## Test Users Created in Supabase

### Contact User
- **Email**: testcontact@pruuf.me
- **PIN**: 1234
- **User ID**: a420dd30-563e-4cbc-934b-5c8511bd727e
- **Role**: Contact (monitors Members)

### Member User
- **Email**: testmember@pruuf.me
- **PIN**: 5678
- **User ID**: b799d60d-7e58-47a0-9d1c-c450761ba40b
- **Role**: Member (checks in daily)
- **Check-in Time**: 09:00:00 America/New_York

---

## CONTACT WORKFLOW TESTS

### CW-1: New Contact Registration Flow
| Step | Screen | Action | Expected Result | Status |
|------|--------|--------|-----------------|--------|
| CW-1.1 | WelcomeScreen | Tap "Get Started" | Navigate to EmailEntryScreen | [ ] |
| CW-1.2 | EmailEntryScreen | Enter email, tap "Continue" | Navigate to VerificationCodeScreen | [ ] |
| CW-1.3 | VerificationCodeScreen | Enter 6-digit code | Navigate to CreatePinScreen | [ ] |
| CW-1.4 | CreatePinScreen | Enter 4-digit PIN | Navigate to ConfirmPinScreen | [ ] |
| CW-1.5 | ConfirmPinScreen | Confirm PIN | Navigate to FontSizeScreen | [ ] |
| CW-1.6 | FontSizeScreen | Select font size, tap "Continue" | Navigate to AddMemberScreen | [ ] |

### CW-2: Contact Adds Member (Onboarding)
| Step | Screen | Action | Expected Result | Status |
|------|--------|--------|-----------------|--------|
| CW-2.1 | AddMemberScreen | Enter member name and email | Form validates | [ ] |
| CW-2.2 | AddMemberScreen | Tap "Continue" | Navigate to ReviewMemberScreen | [ ] |
| CW-2.3 | ReviewMemberScreen | Tap "Send Invitation" | Navigate to InviteSentScreen | [ ] |
| CW-2.4 | InviteSentScreen | Display invite code | Show code for sharing | [ ] |
| CW-2.5 | InviteSentScreen | Tap "Continue" or "Add Another" | Navigate accordingly | [ ] |

### CW-3: Contact Login Flow
| Step | Screen | Action | Expected Result | Status |
|------|--------|--------|-----------------|--------|
| CW-3.1 | WelcomeScreen | Tap "I have an account" | Navigate to EmailEntryScreen | [ ] |
| CW-3.2 | EmailEntryScreen | Enter existing email | Navigate to EnterPinScreen | [ ] |
| CW-3.3 | EnterPinScreen | Enter PIN | Navigate to ContactDashboard | [ ] |

### CW-4: Contact Dashboard
| Step | Screen | Action | Expected Result | Status |
|------|--------|--------|-----------------|--------|
| CW-4.1 | ContactDashboard | View member cards | Show all Members with status | [ ] |
| CW-4.2 | ContactDashboard | Member status indicators | Green=checked in, Yellow=pending, Red=missed | [ ] |
| CW-4.3 | ContactDashboard | Tap member card | Navigate to MemberDetailScreen | [ ] |
| CW-4.4 | ContactDashboard | Pull to refresh | Refresh member statuses | [ ] |

### CW-5: Contact Settings
| Step | Screen | Action | Expected Result | Status |
|------|--------|--------|-----------------|--------|
| CW-5.1 | ContactSettings | Access via tab/menu | Display settings options | [ ] |
| CW-5.2 | ContactSettings | Toggle notifications | Update notification preferences | [ ] |
| CW-5.3 | ContactSettings | Change font size | Apply new font size | [ ] |
| CW-5.4 | ContactSettings | Manage Members | Show list of monitored Members | [ ] |

---

## MEMBER WORKFLOW TESTS

### MW-1: New Member Registration Flow
| Step | Screen | Action | Expected Result | Status |
|------|--------|--------|-----------------|--------|
| MW-1.1 | WelcomeScreen | Tap "Get Started" | Navigate to EmailEntryScreen | [ ] |
| MW-1.2 | EmailEntryScreen | Enter email, tap "Continue" | Navigate to VerificationCodeScreen | [ ] |
| MW-1.3 | VerificationCodeScreen | Enter 6-digit code | Navigate to CreatePinScreen | [ ] |
| MW-1.4 | CreatePinScreen | Enter 4-digit PIN | Navigate to ConfirmPinScreen | [ ] |
| MW-1.5 | ConfirmPinScreen | Confirm PIN | Navigate to FontSizeScreen | [ ] |
| MW-1.6 | FontSizeScreen | Select font size, tap "Continue" | Navigate to EnterInviteCodeScreen | [ ] |

### MW-2: Member Accepts Invite
| Step | Screen | Action | Expected Result | Status |
|------|--------|--------|-----------------|--------|
| MW-2.1 | EnterInviteCodeScreen | Enter 6-char invite code | Validate code | [ ] |
| MW-2.2 | EnterInviteCodeScreen | Tap "Accept" | Navigate to SetCheckInTimeScreen | [ ] |
| MW-2.3 | SetCheckInTimeScreen | Select check-in time | Time picker works | [ ] |
| MW-2.4 | SetCheckInTimeScreen | Toggle reminder | Enable/disable reminder | [ ] |
| MW-2.5 | SetCheckInTimeScreen | Tap "Continue" | Navigate to MemberDashboard | [ ] |

### MW-3: Member Login Flow
| Step | Screen | Action | Expected Result | Status |
|------|--------|--------|-----------------|--------|
| MW-3.1 | WelcomeScreen | Tap "I have an account" | Navigate to EmailEntryScreen | [ ] |
| MW-3.2 | EmailEntryScreen | Enter existing email | Navigate to EnterPinScreen | [ ] |
| MW-3.3 | EnterPinScreen | Enter PIN | Navigate to MemberDashboard | [ ] |

### MW-4: Member Dashboard (Check-In)
| Step | Screen | Action | Expected Result | Status |
|------|--------|--------|-----------------|--------|
| MW-4.1 | MemberDashboard | View "I'm OK" button | Large 120pt button visible | [ ] |
| MW-4.2 | MemberDashboard | Button breathing animation | Smooth scale animation | [ ] |
| MW-4.3 | MemberDashboard | Tap "I'm OK" button | Check-in recorded, contacts notified | [ ] |
| MW-4.4 | MemberDashboard | After check-in | Button shows "Checked In" state | [ ] |
| MW-4.5 | MemberDashboard | Check-in countdown | Time until next check-in | [ ] |

### MW-5: Member Settings
| Step | Screen | Action | Expected Result | Status |
|------|--------|--------|-----------------|--------|
| MW-5.1 | MemberSettings | Access via tab/menu | Display settings options | [ ] |
| MW-5.2 | MemberSettings | Change check-in time | Update saved time | [ ] |
| MW-5.3 | MemberSettings | Toggle reminders | Enable/disable reminder | [ ] |
| MW-5.4 | MemberSettings | Change font size | Apply new font size | [ ] |
| MW-5.5 | MemberSettings | View Contacts list | Show monitoring Contacts | [ ] |

---

## SHARED WORKFLOW TESTS

### SW-1: Check-In History
| Step | Screen | Action | Expected Result | Status |
|------|--------|--------|-----------------|--------|
| SW-1.1 | CheckInHistoryScreen | Access from dashboard/settings | Display calendar view | [ ] |
| SW-1.2 | CheckInHistoryScreen | View past check-ins | Show dates with check-in status | [ ] |
| SW-1.3 | CheckInHistoryScreen | Tap on date | Show check-in details | [ ] |

### SW-2: Help Screen
| Step | Screen | Action | Expected Result | Status |
|------|--------|--------|-----------------|--------|
| SW-2.1 | HelpScreen | Access from settings | Display FAQ and support | [ ] |
| SW-2.2 | HelpScreen | Expand FAQ items | Show/hide answers | [ ] |
| SW-2.3 | HelpScreen | Contact support link | Open email/support method | [ ] |

### SW-3: Notification Settings
| Step | Screen | Action | Expected Result | Status |
|------|--------|--------|-----------------|--------|
| SW-3.1 | NotificationSettingsScreen | Access from settings | Show notification options | [ ] |
| SW-3.2 | NotificationSettingsScreen | Toggle push notifications | Update preference | [ ] |
| SW-3.3 | NotificationSettingsScreen | Toggle email notifications | Update preference | [ ] |

### SW-4: Biometric Authentication
| Step | Screen | Action | Expected Result | Status |
|------|--------|--------|-----------------|--------|
| SW-4.1 | Settings | Enable biometrics | Prompt for Face ID/Touch ID | [ ] |
| SW-4.2 | Login | Use biometrics | Authenticate without PIN | [ ] |

---

## API ENDPOINT TESTS

### API-1: Authentication Endpoints
| Endpoint | Method | Test | Status |
|----------|--------|------|--------|
| /auth/send-verification-code | POST | Send code to email | [x] PASS |
| /auth/verify-code | POST | Verify 6-digit code | [x] PASS |
| /auth/create-account | POST | Create new account | [x] PASS |
| /auth/login | POST | Login with PIN | [x] PASS |

### API-2: Member Endpoints
| Endpoint | Method | Test | Status |
|----------|--------|------|--------|
| /members/invite | POST | Send invitation | [x] PASS |
| /members/accept-invite | POST | Accept invite code | [x] PASS |
| /members/complete-onboarding | POST | Complete onboarding | [x] PASS |
| /members/me/check-in | POST | Record check-in | [x] PASS |

### API-3: Contact Endpoints
| Endpoint | Method | Test | Status |
|----------|--------|------|--------|
| /contacts/me/members | GET | Get monitored members | [x] PASS |

---

## DATABASE VERIFICATION

### Tables with Test Data
| Table | Records | Verified |
|-------|---------|----------|
| users | 2 (testcontact, testmember) | [x] |
| members | 1 (Test Member) | [x] |
| member_contact_relationships | 1 (active) | [x] |
| check_ins | 1 (today's check-in) | [x] |

---

## ISSUES FOUND & FIXED

| Issue ID | Description | Status | Fix Applied |
|----------|-------------|--------|-------------|
| ISS-001 | accept-invite used wrong column `accepted_at` | FIXED | Changed to `connected_at` |
| ISS-002 | complete-onboarding used `onboarding_complete` | FIXED | Changed to `onboarding_completed` |
| ISS-003 | check-in endpoint path required `/me/` | FIXED | Documented correct path |

---

## NEXT STEPS

1. [ ] Start iOS Simulator
2. [ ] Test Contact workflow end-to-end
3. [ ] Test Member workflow end-to-end
4. [ ] Document any UI/UX issues
5. [ ] Fix issues and retest
6. [ ] Final verification of all data in Supabase
