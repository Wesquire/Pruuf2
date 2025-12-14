# PRUUF COMPONENT PATTERNS & ADVANCED USAGE GUIDE

**Document Version:** 1.0  
**Date:** December 2025  
**Purpose:** Advanced patterns, hooks integration, and best practices for component usage

---

## TABLE OF CONTENTS

1. [Component Composition Patterns](#component-composition-patterns)
2. [Custom Hook Integration](#custom-hook-integration)
3. [TypeScript Patterns](#typescript-patterns)
4. [Testing Strategies](#testing-strategies)
5. [Performance Optimization](#performance-optimization)
6. [Common Implementation Examples](#common-implementation-examples)
7. [Troubleshooting Guide](#troubleshooting-guide)

---

## COMPONENT COMPOSITION PATTERNS

### 1. Modal/Dialog Pattern

**Usage pattern for all modal components:**

```typescript
// State management
const [visible, setVisible] = useState(false);
const [data, setData] = useState<T>(null);

// Open with data
const openDialog = (item: T) => {
  setData(item);
  setVisible(true);
};

// Handlers
const handleConfirm = async (result: T) => {
  await saveData(result);
  setVisible(false);
};

const handleCancel = () => {
  setData(null);
  setVisible(false);
};

// Render
<ConfirmDialog
  visible={visible}
  title={data?.title}
  message={data?.message}
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>
```

**Key principles:**
- Always reset state on dismiss (prevent stale data)
- Separate open/close logic
- Handle errors gracefully
- Confirm before performing action

---

### 2. Form Pattern

**Controlled form with validation:**

```typescript
interface FormData {
  phone: string;
  name: string;
}

const [formData, setFormData] = useState<FormData>({
  phone: '',
  name: '',
});
const [errors, setErrors] = useState<Partial<FormData>>({});
const [isSubmitting, setIsSubmitting] = useState(false);

// Validation
const validate = (data: FormData): boolean => {
  const newErrors: Partial<FormData> = {};
  
  if (!data.phone) newErrors.phone = 'Phone is required';
  if (!data.name) newErrors.name = 'Name is required';
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

// Submit handler
const handleSubmit = async () => {
  if (!validate(formData)) return;
  
  setIsSubmitting(true);
  try {
    await api.submitForm(formData);
    // Success
  } catch (error) {
    setErrors({ phone: error.message });
  } finally {
    setIsSubmitting(false);
  }
};

// Render
<View>
  <TextInput
    label="Phone Number"
    value={formData.phone}
    onChangeText={(phone) => setFormData({...formData, phone})}
    error={errors.phone}
  />
  <TextInput
    label="Name"
    value={formData.name}
    onChangeText={(name) => setFormData({...formData, name})}
    error={errors.name}
  />
  <Button
    title="Submit"
    loading={isSubmitting}
    onPress={handleSubmit}
  />
</View>
```

---

### 3. List with Empty State Pattern

**Pattern for dynamic list rendering:**

```typescript
interface Props {
  items: T[];
  isLoading: boolean;
  error?: string;
  onRefresh: () => Promise<void>;
}

const [refreshing, setRefreshing] = useState(false);

const handleRefresh = async () => {
  setRefreshing(true);
  try {
    await onRefresh();
  } finally {
    setRefreshing(false);
  }
};

// Render logic
if (isLoading && items.length === 0) {
  return <SkeletonListScreen count={5} />;
}

if (error && items.length === 0) {
  return (
    <EmptyState
      icon="alert-circle"
      title="Error loading items"
      message={error}
      actionText="Try again"
      onActionPress={handleRefresh}
    />
  );
}

if (items.length === 0) {
  return (
    <EmptyState
      icon="inbox"
      title="No items yet"
      message="Start by creating your first item"
      actionText="Create Item"
      onActionPress={handleCreate}
    />
  );
}

return (
  <FlatList
    data={items}
    renderItem={({item}) => <ListItem item={item} />}
    keyExtractor={(item) => item.id}
    onRefresh={handleRefresh}
    refreshing={refreshing}
  />
);
```

---

### 4. Card List Pattern

**Pattern for interactive card lists:**

```typescript
const [selectedId, setSelectedId] = useState<string | null>(null);
const [showDetails, setShowDetails] = useState(false);

const handleCardPress = (id: string) => {
  setSelectedId(id);
  setShowDetails(true);
};

return (
  <View>
    {items.map((item) => (
      <Card
        key={item.id}
        variant="outlined"
        onPress={() => handleCardPress(item.id)}
      >
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </Card>
    ))}
    
    {/* Details modal */}
    {selectedId && (
      <DetailModal
        visible={showDetails}
        itemId={selectedId}
        onClose={() => setShowDetails(false)}
      />
    )}
  </View>
);
```

---

## CUSTOM HOOK INTEGRATION

### 1. useAPI Hook Integration

**Pattern for data fetching with components:**

```typescript
const MyComponent: React.FC = () => {
  const { data, loading, error, refetch } = useAPI<Member[]>(
    '/api/members'
  );

  return (
    <View>
      {loading && <SkeletonListScreen />}
      {error && (
        <EmptyState
          title="Error"
          message={error}
          actionText="Retry"
          onActionPress={refetch}
        />
      )}
      {data && data.map((member) => (
        <Card key={member.id}>
          <Text>{member.name}</Text>
        </Card>
      ))}
    </View>
  );
};
```

---

### 2. useConfirmDialog Hook

**Pattern for confirmation dialogs:**

```typescript
const MyComponent: React.FC = () => {
  const {
    visible,
    title,
    message,
    showConfirm,
    confirmAction,
  } = useConfirmDialog();

  const handleDelete = (id: string) => {
    showConfirm(
      'Delete Member?',
      'This cannot be undone',
      async () => {
        await api.deleteMember(id);
        // Handle success
      }
    );
  };

  return (
    <View>
      {/* Content */}
      <Button
        title="Delete"
        onPress={() => handleDelete(itemId)}
        variant="danger"
      />
      
      <ConfirmDialog
        visible={visible}
        title={title}
        message={message}
        onConfirm={confirmAction}
        onCancel={() => confirmAction(false)}
      />
    </View>
  );
};
```

---

### 3. useOfflineMode Hook

**Pattern for offline handling:**

```typescript
const MyComponent: React.FC = () => {
  const { isOnline } = useOfflineMode();

  return (
    <View>
      {!isOnline && <OfflineIndicator />}
      
      {/* Component content */}
      <Button
        disabled={!isOnline}
        title={isOnline ? 'Submit' : 'Offline'}
        onPress={handleSubmit}
      />
    </View>
  );
};
```

---

## TYPESCRIPT PATTERNS

### 1. Strict Component Typing

**Pattern for type-safe components:**

```typescript
import React from 'react';

interface Props {
  title: string;              // Required
  description?: string;       // Optional
  onPress?: () => void;       // Optional callback
  variant?: 'primary' | 'secondary';  // Union type
  disabled?: boolean;
  items?: Array<{
    id: string;
    label: string;
  }>;
}

export const MyComponent: React.FC<Props> = ({
  title,
  description,
  onPress,
  variant = 'primary',
  disabled = false,
  items = [],
}) => {
  // Implementation
  return null;
};
```

**Benefits:**
- Type safety at compile time
- IDE autocomplete support
- Clear API documentation
- Prevents runtime errors

---

### 2. Generic Component Pattern

**Pattern for reusable generic components:**

```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
  onItemPress?: (item: T) => void;
}

export const GenericList = React.forwardRef<
  FlatListHandle,
  ListProps<any>
>(({ items, renderItem, keyExtractor, onItemPress }, ref) => {
  return (
    <FlatList
      ref={ref}
      data={items}
      renderItem={({ item }) => (
        <Card onPress={() => onItemPress?.(item)}>
          {renderItem(item)}
        </Card>
      )}
      keyExtractor={(item) => keyExtractor(item)}
    />
  );
});
```

---

## TESTING STRATEGIES

### 1. Component Unit Tests

**Example test for Button component:**

```typescript
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders with correct title', () => {
    render(<Button title="Click me" onPress={() => {}} />);
    expect(screen.getByText('Click me')).toBeTruthy();
  });

  it('calls onPress handler', () => {
    const mockPress = jest.fn();
    render(<Button title="Click" onPress={mockPress} />);
    
    fireEvent.press(screen.getByText('Click'));
    expect(mockPress).toHaveBeenCalled();
  });

  it('disables when disabled prop is true', () => {
    const mockPress = jest.fn();
    render(
      <Button
        title="Click"
        onPress={mockPress}
        disabled={true}
      />
    );
    
    fireEvent.press(screen.getByText('Click'));
    expect(mockPress).not.toHaveBeenCalled();
  });

  it('shows spinner when loading', () => {
    const { getByTestId } = render(
      <Button title="Click" onPress={() => {}} loading={true} />
    );
    
    expect(getByTestId('button-spinner')).toBeTruthy();
  });

  it('applies correct variant styles', () => {
    const { getByTestId } = render(
      <Button
        title="Click"
        onPress={() => {}}
        variant="danger"
        testID="danger-button"
      />
    );
    
    const button = getByTestId('danger-button');
    expect(button.props.style).toContainEqual(
      expect.objectContaining({ backgroundColor: colors.error })
    );
  });
});
```

---

### 2. Integration Tests

**Pattern for component integration:**

```typescript
describe('CheckIn Flow', () => {
  it('completes check-in flow', async () => {
    const { getByText, getByTestId } = render(<CheckInScreen />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(getByText('Check In')).toBeTruthy();
    });
    
    // Tap check-in button
    fireEvent.press(getByTestId('check-in-button'));
    
    // Verify success state
    await waitFor(() => {
      expect(getByText('Great job!')).toBeTruthy();
    });
  });
});
```

---

## PERFORMANCE OPTIMIZATION

### 1. Memo for Expensive Components

**Pattern for preventing unnecessary re-renders:**

```typescript
interface ListItemProps {
  item: Member;
  onPress: (id: string) => void;
}

const ListItem = React.memo<ListItemProps>(
  ({ item, onPress }) => (
    <Card onPress={() => onPress(item.id)}>
      <Text>{item.name}</Text>
    </Card>
  ),
  (prevProps, nextProps) => {
    // Custom comparison
    return prevProps.item.id === nextProps.item.id;
  }
);
```

---

### 2. useMemo for Expensive Calculations

**Pattern for memoizing computed values:**

```typescript
const MyComponent: React.FC<Props> = ({ members }) => {
  const sortedMembers = useMemo(
    () => members.sort((a, b) => a.name.localeCompare(b.name)),
    [members]
  );

  return (
    <FlatList
      data={sortedMembers}
      renderItem={({ item }) => <ListItem item={item} />}
    />
  );
};
```

---

### 3. useCallback for Event Handlers

**Pattern for memoizing callbacks:**

```typescript
const MyComponent: React.FC<Props> = ({ onDelete }) => {
  const handleDelete = useCallback(
    (id: string) => {
      onDelete(id);
    },
    [onDelete]
  );

  return (
    <Button
      title="Delete"
      onPress={() => handleDelete(itemId)}
    />
  );
};
```

---

## COMMON IMPLEMENTATION EXAMPLES

### 1. Member List with Real-time Updates

**Complete example:**

```typescript
interface Member {
  id: string;
  name: string;
  lastCheckIn: Date | null;
  status: 'active' | 'pending' | 'inactive';
}

const MemberListScreen: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Load members
  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const response = await api.getMembers();
      setMembers(response);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberPress = (member: Member) => {
    setSelectedMember(member);
    setShowDetail(true);
  };

  // Render
  if (loading && members.length === 0) {
    return <SkeletonListScreen />;
  }

  if (error && members.length === 0) {
    return (
      <EmptyState
        icon="alert-circle"
        title="Error loading members"
        message={error}
        actionText="Try again"
        onActionPress={loadMembers}
      />
    );
  }

  if (members.length === 0) {
    return (
      <EmptyState
        icon="inbox"
        title="No members yet"
        message="Invite your first family member"
        actionText="Invite Member"
        onActionPress={() => {/* navigate to invite */}}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={members}
        renderItem={({ item }) => (
          <MemberCard
            member={item}
            onPress={() => handleMemberPress(item)}
          />
        )}
        keyExtractor={(member) => member.id}
      />

      {selectedMember && (
        <MemberDetailModal
          visible={showDetail}
          member={selectedMember}
          onClose={() => setShowDetail(false)}
        />
      )}
    </View>
  );
};

// Member card component
const MemberCard: React.FC<{
  member: Member;
  onPress: () => void;
}> = ({ member, onPress }) => {
  const getStatusColor = () => {
    switch (member.status) {
      case 'active':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'inactive':
        return colors.error;
    }
  };

  return (
    <Card variant="outlined" onPress={onPress}>
      <View style={styles.cardContent}>
        <Text style={styles.name}>{member.name}</Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor() },
            ]}
          />
          <Text style={styles.status}>{member.status}</Text>
        </View>
        {member.lastCheckIn && (
          <Text style={styles.lastCheckIn}>
            Last: {formatDate(member.lastCheckIn)}
          </Text>
        )}
      </View>
    </Card>
  );
};
```

---

### 2. Check-in Flow

**Complete example:**

```typescript
const CheckInScreen: React.FC = () => {
  const [checkInTime, setCheckInTime] = useState<string>('10:00');
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null);
  const { isOnline } = useOfflineMode();
  const { showConfirm } = useConfirmDialog();

  useEffect(() => {
    loadCheckInData();
  }, []);

  const loadCheckInData = async () => {
    try {
      const data = await api.getCheckInData();
      setCheckInTime(data.checkInTime);
      setLastCheckIn(data.lastCheckIn);
    } catch (error) {
      console.error('Error loading check-in data:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!isOnline) {
      showConfirm(
        'Offline',
        'You appear to be offline. Check-ins require internet.',
        () => {}
      );
      return;
    }

    setIsChecking(true);
    try {
      await api.checkIn({ timestamp: new Date() });
      setLastCheckIn(new Date());
      
      // Show success feedback
      showConfirm(
        'Great job!',
        'You checked in successfully',
        () => {}
      );
    } catch (error) {
      showConfirm(
        'Error',
        'Failed to check in. Please try again.',
        () => handleCheckIn()
      );
    } finally {
      setIsChecking(false);
    }
  };

  const handleUpdateTime = (newTime: string) => {
    setCheckInTime(newTime);
    api.updateCheckInTime(newTime);
  };

  return (
    <View style={styles.container}>
      {!isOnline && <OfflineIndicator />}

      {/* Check-in time display */}
      <Text style={styles.nextCheckIn}>
        Next check-in: {checkInTime}
      </Text>

      {/* Large check-in button */}
      <Button
        title="I'm OK"
        variant="primary"
        size="xlarge"
        onPress={handleCheckIn}
        loading={isChecking}
        disabled={!isOnline}
        accessibilityHint="Tap to confirm you're okay"
        testID="check-in-button"
      />

      {/* Time picker */}
      <TimePicker
        value={checkInTime}
        onChange={handleUpdateTime}
        label="Daily Check-in Time"
      />

      {/* Last check-in display */}
      {lastCheckIn && (
        <Card variant="filled">
          <Text>Last checked in: {formatDate(lastCheckIn)}</Text>
        </Card>
      )}
    </View>
  );
};
```

---

## TROUBLESHOOTING GUIDE

### 1. Component Not Re-rendering

**Issue:** State changes don't trigger re-render

**Solutions:**
```typescript
// Wrong: direct mutation
state.items.push(newItem);
setState(state);

// Correct: new array
setState([...state.items, newItem]);

// Or for complex objects
setState({
  ...state,
  items: [...state.items, newItem],
});
```

---

### 2. Accessibility Not Working

**Issue:** Screen readers not reading component content

**Solutions:**
```typescript
// Always include accessible props
<Button
  accessible={true}              // Enable accessibility
  accessibilityRole="button"     // Semantic role
  accessibilityLabel="Action"    // What it does
  accessibilityHint="Press to..."  // How to use
/>

// Test with VoiceOver/TalkBack
// Check that all interactive elements have labels
```

---

### 3. Touch Targets Too Small

**Issue:** Buttons hard to tap

**Solutions:**
```typescript
// Minimum 60px height
<Button
  size="large"  // 60px height
  style={{ minHeight: 60 }}
/>

// Proper padding around content
<TouchableOpacity
  style={{
    padding: 16,  // 32px total with content
    minWidth: 60,
    minHeight: 60,
  }}
/>
```

---

### 4. Modal Not Dismissing

**Issue:** Modal stays visible after onCancel

**Solutions:**
```typescript
// Ensure state updates
const handleCancel = () => {
  setModalVisible(false);  // Must update state
};

// Modal must be controlled
<Modal visible={modalVisible} onRequestClose={handleCancel} />
```

---

### 5. Loading State Never Completes

**Issue:** Spinner continues indefinitely

**Solutions:**
```typescript
// Always use try-finally
const handleAsync = async () => {
  setLoading(true);
  try {
    await apiCall();
  } catch (error) {
    // Handle error
  } finally {
    setLoading(false);  // Always reset
  }
};
```

---

## BEST PRACTICES SUMMARY

1. **Always use TypeScript** - Prevents runtime errors
2. **Implement error boundaries** - Catch component crashes
3. **Show loading states** - Improve UX during async operations
4. **Validate inputs** - Prevent invalid data submission
5. **Test accessibility** - Ensure all users can interact
6. **Optimize performance** - Use memo/useMemo for expensive operations
7. **Handle offline state** - Gracefully degrade when disconnected
8. **Use semantic colors** - Consistent UI communication
9. **Maintain touch targets** - 60pt minimum for accessibility
10. **Document components** - Include JSDoc comments

---

**Document Complete**  
**Patterns Covered:** 15+  
**Examples Provided:** 20+

