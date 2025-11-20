/**
 * Root Navigator
 * Main navigation structure for the app
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector } from '../store';
import { RootStackParamList } from '../types';

// Auth Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import PhoneEntryScreen from '../screens/auth/PhoneEntryScreen';
import VerificationCodeScreen from '../screens/auth/VerificationCodeScreen';
import CreatePinScreen from '../screens/auth/CreatePinScreen';
import ConfirmPinScreen from '../screens/auth/ConfirmPinScreen';
import FontSizeScreen from '../screens/auth/FontSizeScreen';

// Onboarding Screens
import TrialWelcomeScreen from '../screens/onboarding/TrialWelcomeScreen';
import AddMemberScreen from '../screens/onboarding/AddMemberScreen';
import ReviewMemberScreen from '../screens/onboarding/ReviewMemberScreen';
import InviteSentScreen from '../screens/onboarding/InviteSentScreen';
import MemberWelcomeScreen from '../screens/onboarding/MemberWelcomeScreen';
import EnterInviteCodeScreen from '../screens/onboarding/EnterInviteCodeScreen';
import SetCheckInTimeScreen from '../screens/onboarding/SetCheckInTimeScreen';

// Payment Screens
import { PaymentMethodScreen } from '../screens/payment';
import { PaymentSettingsScreen } from '../screens/settings';

// Main App
import MainTabNavigator from './MainTabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isLoggedIn, isInitialized } = useAppSelector(state => state.auth);

  if (!isInitialized) {
    // Show loading screen while initializing
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {!isLoggedIn ? (
          // Auth Stack
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
            <Stack.Screen
              name="VerificationCode"
              component={VerificationCodeScreen}
            />
            <Stack.Screen name="CreatePin" component={CreatePinScreen} />
            <Stack.Screen name="ConfirmPin" component={ConfirmPinScreen} />
            <Stack.Screen name="FontSize" component={FontSizeScreen} />
          </>
        ) : (
          // Main App Stack
          <>
            {/* Onboarding screens that appear after login */}
            <Stack.Screen
              name="TrialWelcome"
              component={TrialWelcomeScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen name="AddMember" component={AddMemberScreen} />
            <Stack.Screen name="ReviewMember" component={ReviewMemberScreen} />
            <Stack.Screen name="InviteSent" component={InviteSentScreen} />
            <Stack.Screen
              name="MemberWelcome"
              component={MemberWelcomeScreen}
            />
            <Stack.Screen
              name="EnterInviteCode"
              component={EnterInviteCodeScreen}
            />
            <Stack.Screen
              name="SetCheckInTime"
              component={SetCheckInTimeScreen}
            />

            {/* Payment Screens */}
            <Stack.Screen
              name="PaymentSettings"
              component={PaymentSettingsScreen}
            />
            <Stack.Screen
              name="AddPayment"
              component={PaymentMethodScreen}
            />

            {/* Main Tab Navigator */}
            <Stack.Screen
              name="MainTabs"
              component={MainTabNavigator}
              options={{ gestureEnabled: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
