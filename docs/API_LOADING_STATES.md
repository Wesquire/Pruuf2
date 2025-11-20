# API Loading States

**Item 38: Add Loading States to All API Calls (MEDIUM)**

This document describes the comprehensive loading state management system for all API calls, integrating retry logic and error handling.

## Overview

The `useAPI` hook family provides a complete solution for managing API call states with:
- Loading states
- Error handling
- Retry logic with exponential backoff
- Cancellation support
- Optimistic updates

## Hooks

### useAPI (Core Hook)

The base hook for all API operations.

```typescript
import { useAPI } from '@/hooks/useAPI';
import { authAPI } from '@/services/api';

function LoginScreen() {
  const loginAPI = useAPI(
    (phone: string, pin: string) => authAPI.login(phone, pin),
    {
      retryPreset: 'standard',
      onSuccess: (data) => {
        console.log('Login successful!', data);
      },
      onError: (error) => {
        console.error('Login failed:', error);
      }
    }
  );

  const handleLogin = async () => {
    try {
      const result = await loginAPI.execute(phone, pin);
      // Navigate to home screen
    } catch (error) {
      // Show error message
    }
  };

  if (loginAPI.state.isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View>
      <Button onPress={handleLogin} disabled={loginAPI.state.isLoading}>
        {loginAPI.state.isRetrying
          ? `Retrying (${loginAPI.state.attemptCount})...`
          : 'Login'
        }
      </Button>
      {loginAPI.state.error && (
        <ErrorMessage message={loginAPI.state.error.message} />
      )}
    </View>
  );
}
```

### useQuery (GET Requests)

Simplified hook for fetching data that executes immediately.

```typescript
import { useQuery } from '@/hooks/useAPI';
import { membersAPI } from '@/services/api';

function MemberListScreen() {
  const members = useQuery(
    () => membersAPI.getContacts('member-id'),
    {
      retryPreset: 'standard',
    }
  );

  if (members.state.isLoading && !members.state.data) {
    return <LoadingScreen />;
  }

  if (members.state.error) {
    return <ErrorScreen error={members.state.error} onRetry={members.refetch} />;
  }

  return (
    <View>
      <FlatList
        data={members.state.data?.members || []}
        renderItem={({ item }) => <MemberCard member={item} />}
        refreshControl={
          <RefreshControl
            refreshing={members.state.isLoading}
            onRefresh={members.refetch}
          />
        }
      />
    </View>
  );
}
```

### useMutation (POST/PUT/DELETE Requests)

Hook for mutations that don't execute immediately.

```typescript
import { useMutation } from '@/hooks/useAPI';
import { membersAPI } from '@/services/api';

function CheckInButton({ memberId }: { memberId: string }) {
  const checkIn = useMutation(
    (id: string, timezone: string) => membersAPI.checkIn(id, timezone),
    {
      retryPreset: 'quick',
      onSuccess: () => {
        showToast('Checked in successfully!');
      },
      onError: (error) => {
        showToast(`Check-in failed: ${error.message}`);
      },
    }
  );

  const handleCheckIn = async () => {
    await checkIn.execute(memberId, 'America/New_York');
  };

  return (
    <TouchableOpacity
      onPress={handleCheckIn}
      disabled={checkIn.state.isLoading}
    >
      <Text>
        {checkIn.state.isLoading ? 'Checking in...' : 'Check In'}
      </Text>
      {checkIn.state.isRetrying && (
        <Text>Retry {checkIn.state.attemptCount}...</Text>
      )}
    </TouchableOpacity>
  );
}
```

### useOptimisticMutation (Optimistic Updates)

Hook for mutations with optimistic UI updates.

```typescript
import { useOptimisticMutation } from '@/hooks/useAPI';
import { contactsAPI } from '@/services/api';

function MemberList() {
  const removeMember = useOptimisticMutation(
    (relationshipId: string) => contactsAPI.removeRelationship(relationshipId),
    (relationshipId: string) => {
      // Optimistic update: immediately remove from UI
      return {
        members: members.filter(m => m.relationshipId !== relationshipId)
      };
    },
    {
      retryPreset: 'standard',
      onError: (error) => {
        // Optimistically updated UI will rollback automatically
        showToast('Failed to remove member');
      },
    }
  );

  // The UI updates immediately, then rolls back if the API call fails
}
```

## Retry Presets

Four presets are available for common scenarios:

### quick
- 3 attempts
- 500ms initial delay
- 2s max delay
- Best for: Fast operations, UI interactions

### standard (Recommended)
- 3 attempts
- 1s initial delay
- 5s max delay
- Best for: Most API calls

### patient
- 5 attempts
- 2s initial delay
- 15s max delay
- Best for: Critical operations

### aggressive
- 7 attempts
- 500ms initial delay
- 10s max delay
- Best for: Unreliable connections

## Custom Retry Options

```typescript
const api = useAPI(fetchData, {
  maxAttempts: 5,
  initialDelayMs: 2000,
  maxDelayMs: 10000,
  backoffFactor: 2,
  shouldRetry: (error, attempt) => {
    // Custom retry logic
    return error.message.includes('network') && attempt < 3;
  },
  onRetry: (error, attempt, delay) => {
    console.log(`Retry ${attempt} in ${delay}ms`);
  },
});
```

## State Properties

Each hook provides a `state` object with:

```typescript
{
  data: T | null;           // Response data
  error: Error | null;      // Error if failed
  isLoading: boolean;       // True during initial load or execution
  isRetrying: boolean;      // True during retry attempts
  attemptCount: number;     // Number of attempts made
}
```

## Methods

- `execute(...args)`: Execute the API call
- `reset()`: Reset state to initial values
- `cancel()`: Cancel ongoing request
- `refetch()`: Re-execute with last used arguments

## Integration with Existing Services

### Before (Without Loading States)
```typescript
const handleLogin = async () => {
  try {
    const result = await authAPI.login(phone, pin);
    // Handle success
  } catch (error) {
    // Handle error
  }
};
```

### After (With Loading States)
```typescript
const loginAPI = useMutation(
  (phone: string, pin: string) => authAPI.login(phone, pin),
  { retryPreset: 'standard' }
);

const handleLogin = async () => {
  await loginAPI.execute(phone, pin);
};

// UI automatically reflects loading, retrying, and error states
```

## Best Practices

1. **Use appropriate retry presets**
   - `quick` for UI interactions
   - `standard` for most API calls
   - `patient` for critical operations

2. **Handle loading states in UI**
   ```typescript
   if (api.state.isLoading && !api.state.data) {
     return <LoadingSkeleton />;
   }
   ```

3. **Show retry feedback**
   ```typescript
   {api.state.isRetrying && (
     <Text>Retrying ({api.state.attemptCount})...</Text>
   )}
   ```

4. **Provide error recovery**
   ```typescript
   {api.state.error && (
     <ErrorState error={api.state.error} onRetry={api.refetch} />
   )}
   ```

5. **Cancel on unmount**
   ```typescript
   useEffect(() => {
     return () => api.cancel();
   }, []);
   ```

6. **Use optimistic updates for better UX**
   - For operations like deleting, liking, or updating
   - UI updates immediately, rolls back on error

## Testing

The hooks are fully tested with:
- State management
- Retry logic integration
- Cancellation
- Error handling
- Success/error callbacks
- Argument passing
- Refetch functionality

See `src/__tests__/useAPI.test.ts` for comprehensive test examples.

## Migration Guide

### Step 1: Update Component Imports
```typescript
import { useMutation, useQuery } from '@/hooks/useAPI';
```

### Step 2: Replace Direct API Calls
```diff
- const [loading, setLoading] = useState(false);
- const [error, setError] = useState(null);
- const handleSubmit = async () => {
-   setLoading(true);
-   try {
-     const result = await api.submit(data);
-     setLoading(false);
-   } catch (err) {
-     setError(err);
-     setLoading(false);
-   }
- };

+ const submit = useMutation(
+   (data) => api.submit(data),
+   { retryPreset: 'standard' }
+ );
+ const handleSubmit = () => submit.execute(data);
```

### Step 3: Update UI for Loading States
```diff
- {loading && <Spinner />}
+ {submit.state.isLoading && <Spinner />}
+ {submit.state.isRetrying && <Text>Retrying...</Text>}
```

## Summary

All API calls now have:
✅ Automatic loading states
✅ Built-in retry logic
✅ Error handling
✅ Cancellation support
✅ Optimistic updates (where applicable)
✅ Type safety
✅ Comprehensive testing
