# Pruuf Testing Strategy

## Document Information

| Field | Value |
|-------|-------|
| Created | 2026-01-03 |
| Purpose | Comprehensive testing documentation for Pruuf application |
| Last Updated | 2026-01-03 |

---

## Table of Contents

1. [Overview](#overview)
2. [How to Run Tests](#how-to-run-tests)
3. [Test Environment Setup](#test-environment-setup)
4. [Test Structure](#test-structure)
5. [Creating Test Data](#creating-test-data)
6. [Cleaning Up Test Data](#cleaning-up-test-data)
7. [CI/CD Integration](#cicd-integration)
8. [Test Categories](#test-categories)
9. [Coverage Strategy](#coverage-strategy)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Pruuf testing infrastructure is built on Jest with React Native's testing utilities. The test suite covers:

- **Unit Tests**: Component rendering, utility functions, Redux slices
- **Integration Tests**: API endpoints, database operations (require Supabase)
- **Smoke Tests**: Infrastructure validation and critical path verification
- **Security Tests**: RLS policies, input validation, authentication

### Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Jest | 29.7.x | Test runner |
| React Test Renderer | 19.0.0 | Component testing |
| React Native | 0.81.5 | Mobile framework |
| React | 19.1.0 | UI library |
| Expo SDK | 54 | Managed workflow |

---

## How to Run Tests

### Basic Commands

```bash
# Run all unit/component tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Running Specific Tests

```bash
# Run a specific test file
npm test -- --testPathPattern="authSlice"

# Run tests matching a pattern
npm test -- --testNamePattern="should validate email"

# Run tests in a specific directory
npm test -- src/__tests__/

# Run with verbose output
npm test -- --verbose
```

### Test Categories

```bash
# Unit/Component tests only (default)
npm test

# Smoke tests are included in default run
# Located in tests/smoke/

# Integration tests (require Supabase environment)
# These are excluded from default run
# Run manually with environment variables set:
SUPABASE_SERVICE_ROLE_KEY=your_key npm test -- tests/integration/

# Security tests (require Supabase environment)
# Excluded from default run
SUPABASE_SERVICE_ROLE_KEY=your_key npm test -- tests/security/
```

### Coverage Report

```bash
# Generate coverage report
npm run test:coverage

# Coverage report is saved to:
# - coverage/lcov-report/index.html (HTML)
# - coverage/lcov.info (LCOV)
# - coverage/coverage-final.json (JSON)
```

---

## Test Environment Setup

### Prerequisites

1. **Node.js**: Version 18 or higher
2. **npm**: Comes with Node.js
3. **Dependencies**: Run `npm install`

### Environment Variables

Create a `.env.test` file for integration tests:

```bash
# Required for integration tests
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
API_BASE_URL=https://your-api.supabase.co/functions/v1
```

**Security Note**: Never commit `.env.test` to version control. It's already in `.gitignore`.

### Jest Configuration

The project uses `react-native` preset with manual Expo mocks. Key configuration in `jest.config.js`:

| Setting | Value | Notes |
|---------|-------|-------|
| preset | react-native | jest-expo incompatible with RN 0.78+ |
| testTimeout | 30000ms | React 19 concurrent rendering needs time |
| maxWorkers | 1 | Avoids concurrent rendering issues |
| coverageThreshold | 25% all | Baseline to prevent regressions |

### Mocked Expo Packages

All Expo packages are mocked in `jest.setup.js`:

| Package | Mock Status |
|---------|-------------|
| expo-notifications | Mocked |
| expo-device | Mocked |
| expo-constants | Mocked |
| expo-secure-store | Mocked |
| expo-haptics | Mocked |
| expo-local-authentication | Mocked |
| @expo/vector-icons | Mocked |

---

## Test Structure

### Directory Layout

```
Pruuf2/
├── src/
│   ├── __tests__/                    # Component and hook tests
│   │   ├── analytics.test.ts
│   │   ├── biometrics.test.ts
│   │   ├── deepLinking.test.ts
│   │   └── ...
│   ├── screens/
│   │   └── __tests__/                # Screen component tests
│   ├── store/
│   │   └── slices/
│   │       └── __tests__/            # Redux slice tests
│   └── utils/
│       └── __tests__/                # Utility function tests
├── tests/
│   ├── smoke/                        # Infrastructure smoke tests
│   │   └── smoke.test.ts
│   ├── integration/                  # API integration tests
│   │   ├── auth-email.integration.test.ts
│   │   ├── checkin.integration.test.ts
│   │   └── notifications-dual.integration.test.ts
│   ├── security/                     # Security audit tests
│   │   └── security-audit.test.ts
│   ├── e2e/                          # End-to-end tests
│   │   └── critical-paths.e2e.test.ts
│   ├── factories/                    # Test data factories
│   │   ├── index.ts
│   │   ├── userFactory.ts
│   │   ├── memberFactory.ts
│   │   └── checkInFactory.ts
│   ├── setup/                        # Test configuration
│   │   ├── testConfig.ts
│   │   └── testDatabase.ts
│   └── cleanup/                      # Data cleanup utilities
│       └── cleanupTestData.ts
├── jest.config.js                    # Jest configuration
└── jest.setup.js                     # Jest setup/mocks
```

### Test File Naming Conventions

| Pattern | Description |
|---------|-------------|
| `*.test.ts` | TypeScript tests |
| `*.test.tsx` | React component tests |
| `*.integration.test.ts` | Integration tests |
| `*.e2e.test.ts` | End-to-end tests |

---

## Creating Test Data

### Test Data Factories

Factories create consistent test data for integration tests. All test users use the pattern: `test+*@pruuf.me`

#### User Factory

```typescript
import {
  createTestUser,
  createActiveUser,
  createUnverifiedUser,
  createVerificationCode,
  createTestSession
} from '../factories/userFactory';

// Create a fully verified user
const user = await createActiveUser();
// Returns: { id, email: 'test+user_xxx@pruuf.me', ... }

// Create an unverified user
const unverified = await createUnverifiedUser();

// Create with custom options
const custom = await createTestUser({
  email: 'test+custom@pruuf.me',
  emailVerified: true,
  accountStatus: 'active_free'
});

// Create verification code for testing
const { code, expiresAt } = await createVerificationCode('test+user@pruuf.me');

// Create a session
const { sessionToken, expiresAt } = await createTestSession(user.id);
```

#### Member Factory

```typescript
import {
  createTestMember,
  createMemberWithCheckInTime
} from '../factories/memberFactory';

// Create a member profile for a user
const member = await createTestMember(userId, {
  name: 'Test Member',
  checkInTime: '09:00',
  timezone: 'America/New_York'
});
```

#### Check-In Factory

```typescript
import {
  createTestCheckIn,
  createMissedCheckIn
} from '../factories/checkInFactory';

// Create a successful check-in
const checkIn = await createTestCheckIn(memberId);

// Create a missed check-in
const missed = await createMissedCheckIn(memberId);
```

### Test Configuration

```typescript
import { TEST_CONFIG, generateTestEmail, generateTestId } from '../setup/testConfig';

// Generate unique test email
const email = generateTestEmail('signup'); // test+signup_1704307200000_a1b2c3@pruuf.me

// Generate unique ID
const id = generateTestId(); // test_1704307200000_a1b2c3

// Access configuration
const timeout = TEST_CONFIG.timeouts.api; // 10000ms
```

### Database Access

```typescript
import {
  getTestSupabaseClient,
  getUserByEmail,
  getVerificationCodes,
  getCheckInsForMember
} from '../setup/testDatabase';

// Get direct database access
const client = getTestSupabaseClient();

// Query helpers
const user = await getUserByEmail('test+user@pruuf.me');
const codes = await getVerificationCodes('test+user@pruuf.me');
const checkIns = await getCheckInsForMember(memberId);
```

---

## Cleaning Up Test Data

### Automatic Cleanup

Factories clean up automatically when tests use the cleanup utilities:

```typescript
import { cleanupTestUser, cleanupAllTestUsers } from '../setup/testDatabase';

// In afterEach or afterAll
afterAll(async () => {
  await cleanupTestUser(testUserId);
});

// Or clean up all test users
afterAll(async () => {
  const { deleted, errors } = await cleanupAllTestUsers();
  console.log(`Cleaned up ${deleted} test users`);
});
```

### Manual Cleanup Utility

Run the standalone cleanup utility:

```bash
# Set environment variable
export SUPABASE_SERVICE_ROLE_KEY=your_key

# Run cleanup
npx ts-node tests/cleanup/cleanupTestData.ts
```

The cleanup utility:
1. Finds all users matching `test+*@pruuf.me`
2. Deletes related data in dependency order (15 tables)
3. Verifies no test users remain
4. Reports results with timing

#### Tables Cleaned (in order)

1. push_notification_logs
2. push_notification_tokens
3. email_notification_logs
4. audit_logs
5. check_ins
6. reminder_notifications
7. missed_check_in_alerts
8. member_contact_relationships
9. members
10. email_verification_codes
11. user_sessions
12. app_notifications
13. idempotency_keys
14. rate_limit_buckets
15. users

### Programmatic Cleanup

```typescript
import { cleanupTestData, verifyCleanup } from '../cleanup/cleanupTestData';

// Run cleanup
const result = await cleanupTestData();
// Returns: { success, testUsersFound, testUsersDeleted, tablesProcessed, errors, duration }

// Verify cleanup
const verified = await verifyCleanup();
// Returns: true if no test users remain
```

---

## CI/CD Integration

### GitHub Actions Configuration

Create `.github/workflows/test.yml`:

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test -- --coverage --ci

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: false

  integration-tests:
    runs-on: ubuntu-latest
    needs: test

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run integration tests
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: npm test -- tests/integration/ --ci

      - name: Cleanup test data
        env:
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: npx ts-node tests/cleanup/cleanupTestData.ts
```

### Required Secrets

Configure these in GitHub repository settings:

| Secret | Description |
|--------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (for test database access) |

### EAS Build Integration

For Expo EAS builds, add test step in `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "RUN_TESTS": "true"
      }
    },
    "production": {
      "env": {
        "RUN_TESTS": "false"
      }
    }
  }
}
```

---

## Test Categories

### 1. Unit Tests (Included in Default Run)

Test individual functions, utilities, and Redux slices in isolation.

**Location**: `src/__tests__/`, `src/utils/__tests__/`, `src/store/slices/__tests__/`

**Examples**:
- `validation.test.ts` - Input validation utilities
- `authSlice.test.ts` - Authentication Redux slice
- `biometrics.test.ts` - Biometric authentication

### 2. Component Tests (Included in Default Run)

Test React components with react-test-renderer.

**Location**: `src/screens/__tests__/`, `src/components/__tests__/`

**Examples**:
- `MemberDashboard.test.tsx` - Member dashboard screen
- `ContactSettings.test.tsx` - Contact settings screen

### 3. Smoke Tests (Included in Default Run)

Infrastructure validation and critical path verification.

**Location**: `tests/smoke/`

**Purpose**:
- Verify test infrastructure works
- Document integration test requirements
- Catch configuration issues early

### 4. Integration Tests (Excluded from Default Run)

Test API endpoints and database operations with real Supabase.

**Location**: `tests/integration/`

**Requires**: `SUPABASE_SERVICE_ROLE_KEY` environment variable

**Run**:
```bash
SUPABASE_SERVICE_ROLE_KEY=your_key npm test -- tests/integration/
```

### 5. Security Tests (Excluded from Default Run)

Test RLS policies, input validation, and authentication security.

**Location**: `tests/security/`

**Requires**: `SUPABASE_SERVICE_ROLE_KEY` environment variable

### 6. E2E Tests (Excluded from Default Run)

Full application flow tests with Detox/Maestro.

**Location**: `tests/e2e/`

**Requires**: Device/simulator and E2E framework setup

---

## Coverage Strategy

### Current Thresholds

| Metric | Current | Threshold |
|--------|---------|-----------|
| Statements | ~32% | 25% |
| Branches | ~28% | 25% |
| Lines | ~32% | 25% |
| Functions | ~30% | 25% |

### Coverage Goals

1. **Phase 1 (Current)**: Maintain 25% baseline to prevent regressions
2. **Phase 2 (Target)**: Increase to 40% with focused component testing
3. **Phase 3 (Long-term)**: Reach 50% with comprehensive integration tests

### Improving Coverage

Focus areas for coverage improvement:
1. Screen components (currently lowest coverage)
2. Service layer functions
3. Redux thunk actions
4. Error handling paths

---

## Troubleshooting

### Common Issues

#### 1. Tests Timeout

**Symptom**: Tests fail with "Exceeded timeout of 30000 ms"

**Solutions**:
- Ensure `maxWorkers: 1` in jest.config.js
- Check for unresolved promises in tests
- Increase timeout for specific slow tests:
  ```typescript
  jest.setTimeout(60000);
  ```

#### 2. React 19 Concurrent Rendering Errors

**Symptom**: "ReferenceError" during test teardown

**Solutions**:
- These are non-blocking warnings
- Ensure `global.IS_REACT_ACT_ENVIRONMENT = true` in jest.setup.js
- Use `act()` wrapper for state updates:
  ```typescript
  await act(async () => {
    fireEvent.press(button);
  });
  ```

#### 3. Expo Module Not Found

**Symptom**: "Cannot find module 'expo-*'"

**Solutions**:
- Verify mock exists in jest.setup.js
- Check transformIgnorePatterns includes the package
- Run `npm install` to ensure dependencies are installed

#### 4. Integration Tests Fail

**Symptom**: "SUPABASE_SERVICE_ROLE_KEY is required"

**Solutions**:
- Set environment variable before running tests
- Create `.env.test` file
- Verify key is valid in Supabase dashboard

#### 5. Modal/Dialog Test Failures

**Symptom**: Modal content not found in test

**Solutions**:
- Modal mock in jest.setup.js returns View with testID
- Use `testID="modal-visible"` to find visible modals
- Check `visible` prop is being set correctly

### Debug Tips

```bash
# Run single test file with debugging
node --inspect-brk node_modules/.bin/jest --runInBand --testPathPattern="authSlice"

# Run with verbose output
npm test -- --verbose

# Run without cache
npm test -- --no-cache

# Show test configuration
npm test -- --showConfig
```

---

## Summary

| Test Type | Location | Default Run | Requirements |
|-----------|----------|-------------|--------------|
| Unit | `src/__tests__/` | Yes | None |
| Component | `src/screens/__tests__/` | Yes | None |
| Smoke | `tests/smoke/` | Yes | None |
| Integration | `tests/integration/` | No | SUPABASE_SERVICE_ROLE_KEY |
| Security | `tests/security/` | No | SUPABASE_SERVICE_ROLE_KEY |
| E2E | `tests/e2e/` | No | Device + Detox/Maestro |

### Quick Reference

```bash
# Run all default tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
SUPABASE_SERVICE_ROLE_KEY=your_key npm test -- tests/integration/

# Clean up test data
SUPABASE_SERVICE_ROLE_KEY=your_key npx ts-node tests/cleanup/cleanupTestData.ts
```
