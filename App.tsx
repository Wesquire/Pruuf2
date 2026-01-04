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

import {store, useAppDispatch} from './src/store';
import {initializeAuth} from './src/store/slices/authSlice';
import {RootNavigator} from './src/navigation/RootNavigator';
import {ErrorBoundary} from './src/components/common/ErrorBoundary';
import {colors} from './src/theme';
import {
  initializeNotifications,
  requestNotificationPermissions,
} from './src/services/notificationService';
import {
  setupNotificationListeners,
  getLastNotificationResponse,
} from './src/services/notifications';
import {
  setNavigationRef,
  handleNotificationNavigation,
} from './src/services/navigationService';
import {initializeDeepLinking} from './src/services/deepLinkService';
import {initializeAnalytics} from './src/services/analyticsService';

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
    // Initialize authentication state from storage
    dispatch(initializeAuth());

    // Initialize notification service (sets up foreground handler and Android channels)
    initializeNotifications();

    // Request notification permissions
    requestNotificationPermissions().then(granted => {
      console.log('Notification permissions granted:', granted);
    });

    // Set navigation ref for notification navigation
    setNavigationRef(navigationRef);

    // Setup notification listeners for foreground notifications and user responses
    const cleanupNotificationListeners = setupNotificationListeners();

    // Check for initial notification (app was launched by tapping a notification)
    getLastNotificationResponse().then(response => {
      if (response) {
        console.log('App launched from notification:', response);
        const data = response.notification.request.content.data as {
          type?: string;
          member_id?: string;
          invite_code?: string;
          [key: string]: string | undefined;
        };
        // Small delay to ensure navigation is ready
        setTimeout(() => {
          handleNotificationNavigation(data);
        }, 500);
      }
    });

    // Initialize analytics service
    initializeAnalytics();

    console.log('App services initialized successfully');

    // Cleanup notification listeners on unmount
    return () => {
      cleanupNotificationListeners();
    };
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
