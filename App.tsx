/**
 * Pruuf - Daily Check-in Safety App
 * Main application entry point
 */

import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';

import { store, useAppDispatch } from './src/store';
import { initializeAuth } from './src/store/slices/authSlice';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { colors } from './src/theme';

// Stripe publishable key (replace with your actual key)
const STRIPE_PUBLISHABLE_KEY = __DEV__
  ? 'pk_test_your_test_key_here'
  : 'pk_live_your_live_key_here';

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

  useEffect(() => {
    // Initialize authentication state from storage
    dispatch(initializeAuth());
  }, [dispatch]);

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.background}
      />
      <RootNavigator />
    </>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
              <SafeAreaProvider>
                <AppContent />
              </SafeAreaProvider>
            </StripeProvider>
          </QueryClientProvider>
        </Provider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

export default App;
