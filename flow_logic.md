## Roles at a Glance
- **Contact (default for new accounts):** Sets up members to monitor. Lives primarily in `ContactDashboard` and `ContactSettings` tabs.
- **Member:** Invited person who checks in daily. Lives in `MemberDashboard`, `MemberContacts`, and `MemberSettings` tabs. Members send “I’m OK” confirmations that notify their contacts.

## Shared Auth & Account Creation
- **Welcome** → CTA “Get Started” drops everyone into the email flow.
- **EmailEntry (Step 1/6):** Collects email, validates format, dispatches `sendVerificationCode`. Errors surface inline and via alert when the email already has an account (offers login).
- **VerificationCode (Step 2/6):** Six-digit code entry with resend timer. On success, the API response decides the branch: `user_exists` → **EnterPin** (login); new user → **CreatePin**.
- **CreatePin / ConfirmPin (Step 3/6 shown on-screen):** Two screens of 4-digit PIN entry. Confirm screen calls `createAccount` with the verification session token; failures show inline error.
- **FontSize (Step 4/6):** Selects text size, persists locally and via `usersAPI.updateFontSize`. If `isOnboarding` is true (new account), navigation continues into Contact onboarding; otherwise it returns to the previous screen.
- **EnterPin (returning users):** 4-digit PIN unlock; dispatches `login`, resets nav to `MainTabs` on success. Offers “Forgot PIN?” branch back to email verification.

## Contact Onboarding & Experience (monitoring others)
- **AddMember:** Collects member name + email with basic validation; “Continue” navigates to **ReviewMember** when inputs are valid.
- **ReviewMember:** Summarizes the invite; “Send Invite” calls `membersAPI.invite` and passes the generated `invite_code`.
- **InviteSent:** Confirms delivery, surfaces the invite code, and suggests notifying the member manually; CTA goes to `MainTabs`.
- **Tabs for Contacts (`MainTabs` when `user.is_member` is false):**
  - **ContactDashboard:** Fetches members via `fetchMembers`. Each card shows name, last check-in, daily deadline (`formatted_time`/`check_in_time`), and a status badge (`active` if checked in today, `late` if today but late, `pending` if never/ not today). Actions: open **MemberDetail** or **CheckInHistory**. Pull-to-refresh re-fetches members. Header + button to add more members.
  - **MemberDetail:** Loads `/api/contacts/members/:id` and check-in history. Surfaces status (pending vs active with lateness), check-in time, timezone, connected dates. Actions: resend invite (pending only) or remove the relationship (with confirm dialog).
  - **CheckInHistory:** Filter (7d/30d/all), search by date/time/status, grouped list with on-time/late badges, summary stats (total/on-time/late/missed and on-time %). Pull-to-refresh re-fetches via `fetchCheckInHistory`.
  - **ContactSettings:** Links to Notification settings, Help, text size, Log Out (`logout` thunk), and Delete Account (direct API delete).

## Member Onboarding & Experience (performing daily check-ins)
- **MemberWelcome:** Short primer that {contactName} invited them; explains the only job is to tap “I’m OK” daily. CTA continues to invite entry.
- **EnterInviteCode:** 6-digit invite code entry (UI only; hook up to `membersAPI.acceptInvite` when wired). Back button present.
- **SetCheckInTime:** Allows picking a preferred check-in reminder time (currently static 10:00 AM display); “Continue” routes to `MainTabs`.
- **Tabs for Members (`MainTabs` when `user.is_member` is true):**
  - **MemberDashboard:** Hero “I’m OK” button with breathing animation. On press, dispatches `performCheckIn` with timezone; success sets `hasCheckedIn` and alerts that contacts were notified. Banner shows next check-in time placeholder; status card appears after checking in. Loads contacts for this member via `fetchContacts(user.id)` and links to **ContactDetail**.
  - **MemberContacts:** List of contacts (currently static sample data) with name/email/status and quick mail action; CTA to invite another contact (not yet wired).
  - **MemberSettings:** Quick links for check-in time, daily reminder toggle, Notification Settings, text size, contacts, help, and destructive delete-account flow (API `/api/account`). Notification Settings screen itself manages push/email/reminder toggles, requests OS permissions when needed, and syncs reminder scheduling via `updateCheckInReminder` when check-in time/timezone are known.
  - **ContactDetail (member view):** Shows the contact’s email, status (pending/active), invite timestamps, and allows removing the relationship with confirmation.

## Data/State Notes
- Auth state (`authSlice`) holds `user`, `accessToken`, `is_member`, and login status; tokens stored via `storage`.
- Member/contact lists and check-in history live in `memberSlice` (`fetchMembers`, `fetchContacts`, `performCheckIn`, `fetchCheckInHistory`, `removeRelationship`).
- Navigation gating: `RootNavigator` renders the auth stack when `!isLoggedIn`; once logged in it exposes onboarding screens and `MainTabs`. The tab set switches based on `user.is_member`.
