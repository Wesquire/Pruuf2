# Firebase Cloud Messaging Setup Guide

This guide will help you set up Firebase Cloud Messaging (FCM) for push notifications in the Pruuf app.

## Prerequisites

- Firebase account (create one at [firebase.google.com](https://firebase.google.com))
- Xcode 14+ (for iOS)
- Android Studio (for Android)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name: "Pruuf"
4. Follow the setup wizard

## Step 2: Add iOS App

1. In Firebase Console, click "Add app" → iOS
2. Enter iOS bundle ID: `com.pruuf.app`
3. Download `GoogleService-Info.plist`
4. Move the file to `ios/` directory:
   ```bash
   mv ~/Downloads/GoogleService-Info.plist ios/GoogleService-Info.plist
   ```
5. Open Xcode project:
   ```bash
   cd ios && open Pruuf.xcworkspace
   ```
6. Drag `GoogleService-Info.plist` into the Xcode project (under Pruuf folder)
7. Ensure "Copy items if needed" is checked

## Step 3: Configure iOS for Push Notifications

1. In Xcode, select Pruuf project → Signing & Capabilities
2. Click "+ Capability" → Add "Push Notifications"
3. Click "+ Capability" → Add "Background Modes"
4. Enable "Remote notifications" under Background Modes
5. The `Pruuf.entitlements` file has already been created

## Step 4: Add APNs Authentication Key

1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/authkeys/list)
2. Create a new key with "Apple Push Notifications service (APNs)" enabled
3. Download the `.p8` file
4. In Firebase Console → Project Settings → Cloud Messaging → iOS app configuration
5. Upload the APNs Authentication Key:
   - Upload the `.p8` file
   - Enter Key ID
   - Enter Team ID (found in Apple Developer account)

## Step 5: Add Android App

1. In Firebase Console, click "Add app" → Android
2. Enter Android package name: `com.pruuf.app`
3. Download `google-services.json`
4. Move the file to Android app directory:
   ```bash
   mv ~/Downloads/google-services.json android/app/google-services.json
   ```

## Step 6: Install iOS Dependencies

```bash
cd ios
pod install
cd ..
```

## Step 7: Test Push Notifications

### iOS Simulator
Note: Push notifications don't work on iOS Simulator. You need a physical device.

### Physical Device (iOS)

1. Build and run the app on a physical device:
   ```bash
   npx react-native run-ios --device
   ```
2. Grant notification permissions when prompted
3. Check the logs for the FCM token
4. Send a test notification from Firebase Console

### Android Emulator/Device

1. Build and run the app:
   ```bash
   npx react-native run-android
   ```
2. Grant notification permissions when prompted
3. Check the logs for the FCM token
4. Send a test notification from Firebase Console

## Troubleshooting

### iOS Issues

**"No APNs token specified"**
- Ensure you're testing on a physical device
- Check that Push Notifications capability is enabled
- Verify APNs key is uploaded to Firebase Console

**Build fails with Firebase errors**
- Run `pod install` in the ios directory
- Clean build: `cd ios && xcodebuild clean`
- Try removing and re-adding `GoogleService-Info.plist` to Xcode

### Android Issues

**"google-services.json not found"**
- Ensure the file is in `android/app/` directory
- Rebuild the app

**Token not generated**
- Check that Google Play Services is installed on the device/emulator
- Verify internet connection

## Environment Variables

Add these to your `.env` file:

```env
# Firebase (optional - auto-loaded from GoogleService-Info.plist and google-services.json)
FIREBASE_SENDER_ID=your_sender_id
```

## Security Notes

1. **Never commit** `GoogleService-Info.plist` or `google-services.json` to version control
2. Add them to `.gitignore`:
   ```
   ios/GoogleService-Info.plist
   android/app/google-services.json
   ```
3. Use example files for reference (`.example` extension)

## Resources

- [React Native Firebase Docs](https://rnfirebase.io)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [iOS Push Notification Guide](https://developer.apple.com/documentation/usernotifications)
