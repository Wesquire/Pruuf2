module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Explicitly set roots to src to avoid scanning node_modules_backup or other dirs
  roots: ['<rootDir>/src'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@stripe/stripe-react-native|@supabase|@tanstack|react-redux|@reduxjs|immer|@expo/vector-icons|react-native-reanimated|react-native-screens|react-native-safe-area-context|react-native-gesture-handler|react-native-worklets)/)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/tests/integration/', // Deno integration tests - run separately with Deno runtime
    '/tests/backend/', // Deno backend tests - run separately with Deno runtime
    'tests/integration/', // Also match without leading slash
    'tests/backend/', // Also match without leading slash
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
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
