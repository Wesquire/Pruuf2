# iOS Deployment Guide

Complete guide for deploying the Pruuf React Native app to the Apple App Store.

## Prerequisites

- macOS computer (required for iOS development)
- Xcode 14+ installed
- Apple Developer Account ($99/year)
- CocoaPods installed (`sudo gem install cocoapods`)
- Node.js 18+ installed

## Initial Setup

### 1. Install Dependencies

```bash
# Install Node dependencies
npm install

# Install iOS dependencies (CocoaPods)
cd ios
pod install
cd ..
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# Stripe
STRIPE_PUBLISHABLE_KEY_DEV=pk_test_your_test_key
STRIPE_PUBLISHABLE_KEY_PROD=pk_live_your_live_key

# API
API_BASE_URL_DEV=http://localhost:3000
API_BASE_URL_PROD=https://api.pruuf.me
```

### 3. Configure Xcode Project

1. Open the workspace (not the project):
   ```bash
   cd ios
   open Pruuf.xcworkspace
   ```

2. **Set Bundle Identifier**:
   - Select "Pruuf" project in the left sidebar
   - Under "Targets" → "Pruuf" → "Signing & Capabilities"
   - Set Bundle Identifier: `com.pruuf.me` (or your custom identifier)

3. **Configure Signing**:
   - Select your Development Team
   - Enable "Automatically manage signing"

4. **Add Capabilities**:
   - Push Notifications (already added via entitlements)
   - Background Modes → Enable "Remote notifications"

5. **Update Display Name & Version**:
   - General → Display Name: "Pruuf"
   - General → Version: 1.0.0
   - General → Build: 1

## Firebase Cloud Messaging Setup

Follow the Firebase setup guide: `docs/FIREBASE_SETUP.md`

Key steps:
1. Create Firebase project
2. Add iOS app to Firebase
3. Download `GoogleService-Info.plist`
4. Add to Xcode project
5. Upload APNs key to Firebase Console

## Stripe Configuration

1. **Update Stripe Key** in `App.tsx`:
   ```typescript
   const STRIPE_PUBLISHABLE_KEY = __DEV__
     ? 'pk_test_your_test_key_here'
     : 'pk_live_your_live_key_here';
   ```

2. **Test Mode**: Use test keys during development
3. **Production**: Switch to live keys before App Store submission

## Supabase Configuration

1. **Update Supabase Config** in `src/services/supabase.ts`:
   - Already configured to read from environment variables
   - Make sure `.env` file has correct values

2. **Run Database Migrations**:
   ```bash
   # Using Supabase CLI
   supabase db push

   # Or manually in Supabase dashboard:
   # - Navigate to SQL Editor
   # - Run supabase/migrations/001_initial_schema.sql
   # - Run supabase/migrations/002_rls_policies.sql
   ```

## App Icons & Splash Screen

### App Icons

1. Create app icons using your design:
   - Use a tool like [App Icon Generator](https://appicon.co/)
   - Required sizes: 20px, 29px, 40px, 58px, 60px, 76px, 80px, 87px, 120px, 152px, 167px, 180px, 1024px

2. Add to Xcode:
   - Open `ios/Pruuf/Images.xcassets/AppIcon.appiconset`
   - Drag and drop icon files

### Splash Screen

1. Open `ios/Pruuf/LaunchScreen.storyboard` in Xcode
2. Customize the launch screen design
3. Or replace with an image-based splash screen

## Testing on Simulator

```bash
# Run on iOS Simulator
npx react-native run-ios

# Run on specific simulator
npx react-native run-ios --simulator="iPhone 15 Pro"

# Run on physical device
npx react-native run-ios --device
```

## Testing on Physical Device

### Requirements
- iPhone running iOS 13+
- Device registered in Apple Developer Portal

### Steps

1. **Register Device**:
   - Get device UDID: Connect to Mac → Finder → Select Device → Click serial number
   - Add to Apple Developer Portal → Devices

2. **Configure Provisioning**:
   - Xcode will handle automatically with "Automatically manage signing"

3. **Build & Run**:
   ```bash
   npx react-native run-ios --device="Your iPhone Name"
   ```

## Building for TestFlight

### 1. Archive the App

1. In Xcode: Product → Scheme → Edit Scheme
2. Set Build Configuration to "Release"
3. Product → Archive
4. Wait for archive to complete

### 2. Upload to App Store Connect

1. After archive completes, Organizer window opens
2. Select the archive → "Distribute App"
3. Choose "App Store Connect"
4. Select "Upload"
5. Follow the wizard

### 3. Configure in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. My Apps → Create New App
3. Fill in app information:
   - Platform: iOS
   - Name: Pruuf
   - Primary Language: English (U.S.)
   - Bundle ID: com.pruuf.me
   - SKU: pruuf-ios

4. **App Information**:
   - Category: Health & Fitness
   - Subcategory: Healthcare & Fitness
   - Age Rating: 4+ (or as appropriate)

5. **Pricing**:
   - Price: Free
   - In-App Purchases: Setup Stripe webhook (server-side)

### 4. Add to TestFlight

1. Select your uploaded build
2. TestFlight → Internal Testing
3. Add internal testers (up to 100)
4. External Testing (optional, requires App Review)

## Building for Production

### Pre-Submission Checklist

- [ ] All features tested on physical device
- [ ] Push notifications working
- [ ] Stripe payments tested in test mode
- [ ] All API endpoints functional
- [ ] Analytics integrated (if using)
- [ ] Crash reporting setup (if using Sentry)
- [ ] Privacy policy URL added
- [ ] Terms of service URL added
- [ ] Support URL added
- [ ] App icons added (all sizes)
- [ ] Splash screen designed
- [ ] Screenshots prepared (all required sizes)
- [ ] App description written
- [ ] Keywords optimized
- [ ] Accessibility features tested with VoiceOver

### Required Screenshots

Prepare screenshots for:
- 6.7" Display (iPhone 15 Pro Max): 1290 x 2796 pixels
- 6.5" Display (iPhone 11 Pro Max): 1242 x 2688 pixels
- 5.5" Display (iPhone 8 Plus): 1242 x 2208 pixels

Minimum 3 screenshots, maximum 10 per size.

### App Privacy Details

Required for App Store submission:

1. **Data Collection**:
   - Contact Info: Phone number
   - User Content: Names, check-in data
   - Usage Data: Analytics (if implemented)

2. **Data Usage**:
   - App Functionality
   - Analytics (if applicable)

3. **Data Linked to User**: Yes
   - All collected data is linked to user identity

4. **Tracking**: No (unless you add third-party analytics)

### Submit for Review

1. Complete all app information in App Store Connect
2. Add screenshots for all required device sizes
3. Write app description and keywords
4. Set pricing and availability
5. Complete privacy questionnaire
6. Add age rating
7. Submit for Review

### Review Process

- **Timeline**: Typically 24-48 hours
- **Common Rejection Reasons**:
  - Incomplete information
  - Privacy policy missing or incomplete
  - Crashes during review
  - Missing features described in screenshots
  - Stripe/payment issues

## Post-Launch

### Monitoring

1. **Crash Reporting**: Integrate Sentry or Crashlytics
2. **Analytics**: Add Firebase Analytics or Mixpanel
3. **User Feedback**: Monitor App Store reviews
4. **Performance**: Use Xcode Instruments

### Updates

1. Increment version number
2. Test thoroughly
3. Archive and upload
4. Add "What's New" description
5. Submit for review

## Troubleshooting

### Common Issues

**Build fails with "Command PhaseScriptExecution failed"**
- Clean build folder: Cmd+Shift+K
- Delete `ios/build` and `ios/Pods`
- Run `pod install` again

**Push notifications not working**
- Verify APNs key uploaded to Firebase
- Check entitlements file exists
- Ensure testing on physical device (not simulator)

**Stripe integration errors**
- Verify publishable key is correct
- Check network connectivity
- Ensure backend endpoint is accessible

**Supabase connection fails**
- Verify Supabase URL and anon key
- Check network configuration
- Ensure RLS policies are configured

## Resources

- [React Native Documentation](https://reactnative.dev)
- [Apple Developer Portal](https://developer.apple.com)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Stripe iOS Documentation](https://stripe.com/docs/mobile/ios)
- [Firebase iOS Setup](https://firebase.google.com/docs/ios/setup)
- [Supabase Documentation](https://supabase.com/docs)
