/**
 * Pruuf - Daily Check-in Safety App
 * Main application entry point
 */

import React, {useEffect} from 'react';
import {StatusBar, LogBox, StyleSheet} from 'react-native';
import {Provider} from 'react-redux';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import Purchases from 'react-native-purchases';
import {Platform} from 'react-native';

import {store, useAppDispatch} from './src/store';
import {initializeAuth} from './src/store/slices/authSlice';
import {RootNavigator} from './src/navigation/RootNavigator';
import {ErrorBoundary} from './src/components/common/ErrorBoundary';
import {colors} from './src/theme';
import {
  initializeNotifications,
  requestNotificationPermissions,
} from './src/services/notificationService';
import {initializeDeepLinking} from './src/services/deepLinkService';
import {initializeAnalytics} from './src/services/analyticsService';

// RevenueCat API keys (replace with your actual keys from RevenueCat dashboard)
const REVENUECAT_IOS_API_KEY = __DEV__
  ? 'appl_test_your_ios_key_here'
  : 'appl_live_your_ios_key_here';

const REVENUECAT_ANDROID_API_KEY = __DEV__
  ? 'goog_test_your_android_key_here'
  : 'goog_live_your_android_key_here';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// App initialization component
const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigationRef = React.useRef<any>(null);

  useEffect(() => {
    // Initialize RevenueCat
    const apiKey =
      Platform.OS === 'ios'
        ? REVENUECAT_IOS_API_KEY
        : REVENUECAT_ANDROID_API_KEY;

    Purchases.configure({apiKey});

    if (__DEV__) {
      // Enable debug logs in development
      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    }

    console.log('RevenueCat initialized successfully');

    // Initialize authentication state from storage
    dispatch(initializeAuth());

    // Initialize notification service
    initializeNotifications();
    requestNotificationPermissions().then(granted => {
      console.log('Notification permissions granted:', granted);
    });

    // Initialize analytics service
    initializeAnalytics();

    console.log('App services initialized successfully');
  }, [dispatch]);

  useEffect(() => {
    // Initialize deep linking (requires navigation ref)
    const cleanup = initializeDeepLinking(navigationRef);
    return cleanup;
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <RootNavigator ref={navigationRef} />
    </>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.container}>
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <SafeAreaProvider>
              <AppContent />
            </SafeAreaProvider>
          </QueryClientProvider>
        </Provider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
