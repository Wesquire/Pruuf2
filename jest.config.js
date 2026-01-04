module.exports = {
  // Using react-native preset instead of jest-expo due to compatibility issue:
  // jest-expo 54.x setup.js calls Object.defineProperty on NativeModules.default
  // which is undefined in React Native 0.78 (TypeError: Object.defineProperty called on non-object)
  // All Expo-specific mocks are configured manually in jest.setup.js instead
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Include src for component/unit tests and tests/smoke for smoke tests
  roots: ['<rootDir>/src', '<rootDir>/tests/smoke'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@supabase|@tanstack|react-redux|@reduxjs|immer|react-native-reanimated|react-native-screens|react-native-safe-area-context|react-native-gesture-handler|react-native-worklets|@expo/vector-icons|expo-.*)/)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/tests/integration/', // Integration tests - require running Supabase instance
    '/tests/backend/', // Backend tests - require Deno runtime
    '/tests/database/', // Database tests - require service role key
    '/tests/e2e/', // E2E tests - require Detox/Maestro
    'tests/integration/', // Also match without leading slash
    'tests/backend/', // Also match without leading slash
    'tests/database/', // Also match without leading slash
    'tests/e2e/', // Also match without leading slash
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/__tests__/**',
  ],
  // Coverage thresholds - baseline after Expo migration
  // Current coverage: ~32% (statements/lines), ~28% (branches), ~30% (functions)
  // Set at 25% to prevent regressions; increase as test coverage improves
  // Target: Incrementally improve to 50% over time
  coverageThreshold: {
    global: {
      branches: 25,
      functions: 25,
      lines: 25,
      statements: 25,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // React 19 + React Native 0.78 configurations
  // Note: fakeTimers removed as it can interfere with async renders
  // Increase timeout for React 19 concurrent rendering
  testTimeout: 30000,
  // Run tests in band to avoid concurrent rendering issues with React 19
  maxWorkers: 1,
  // Use legacy fake timers to avoid timing issues
  fakeTimers: {
    enableGlobally: false,
  },
};
