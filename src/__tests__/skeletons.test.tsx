/**
 * Skeleton Components Tests
 * Item 27: Add Loading Skeletons (LOW)
 *
 * Tests skeleton loading components and patterns
 * Updated for React 19 concurrent mode compatibility
 */

import React from 'react';
import renderer, {act, ReactTestRenderer} from 'react-test-renderer';
import {
  Skeleton,
  SkeletonCircle,
  SkeletonRect,
  SkeletonListItem,
  SkeletonCard,
  SkeletonProfile,
  SkeletonDetailRow,
  SkeletonCheckInItem,
  SkeletonStats,
  SkeletonFormField,
  SkeletonSection,
  SkeletonDetailScreen,
  SkeletonListScreen,
} from '../components/skeletons';

// Track all created renderers for cleanup
let activeRenderers: ReactTestRenderer[] = [];

// Helper to create renderer with act() for React 19 compatibility
const createWithAct = (element: React.ReactElement): ReactTestRenderer => {
  let tree: ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  activeRenderers.push(tree!);
  return tree!;
};

// Use fake timers to prevent animation issues with Jest teardown
beforeEach(() => {
  jest.useFakeTimers();
  activeRenderers = [];
});

afterEach(() => {
  // Unmount all renderers to stop animations before Jest teardown
  act(() => {
    activeRenderers.forEach(tree => {
      if (tree) {
        tree.unmount();
      }
    });
  });
  activeRenderers = [];
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('Skeleton - Base Components', () => {
  it('should render Skeleton with default props', () => {
    const tree = createWithAct(<Skeleton />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render Skeleton with custom dimensions', () => {
    const tree = createWithAct(<Skeleton width={200} height={50} />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render Skeleton with percentage width', () => {
    const tree = createWithAct(<Skeleton width="75%" />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render Skeleton without animation', () => {
    const tree = createWithAct(<Skeleton animated={false} />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render SkeletonCircle', () => {
    const tree = createWithAct(<SkeletonCircle size={48} />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render SkeletonCircle with various sizes', () => {
    [24, 48, 80].forEach(size => {
      const tree = createWithAct(<SkeletonCircle size={size} />);
      expect(tree.toJSON()).toBeTruthy();
    });
  });

  it('should render SkeletonRect', () => {
    const tree = createWithAct(<SkeletonRect />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render SkeletonRect with custom aspect ratio', () => {
    const tree = createWithAct(<SkeletonRect aspectRatio={16 / 9} />);
    expect(tree.toJSON()).toBeTruthy();
  });
});

describe('Skeleton - Pattern Components', () => {
  it('should render SkeletonListItem with avatar', () => {
    const tree = createWithAct(<SkeletonListItem />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render SkeletonListItem without avatar', () => {
    const tree = createWithAct(<SkeletonListItem showAvatar={false} />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render SkeletonCard with default lines', () => {
    const tree = createWithAct(<SkeletonCard />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render SkeletonCard with custom lines', () => {
    [1, 3, 5].forEach(lines => {
      const tree = createWithAct(<SkeletonCard lines={lines} />);
      expect(tree.toJSON()).toBeTruthy();
    });
  });

  it('should render SkeletonProfile', () => {
    const tree = createWithAct(<SkeletonProfile />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render SkeletonDetailRow', () => {
    const tree = createWithAct(<SkeletonDetailRow />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render SkeletonCheckInItem', () => {
    const tree = createWithAct(<SkeletonCheckInItem />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render SkeletonStats with default count', () => {
    const tree = createWithAct(<SkeletonStats />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render SkeletonStats with custom count', () => {
    [2, 4, 6].forEach(count => {
      const tree = createWithAct(<SkeletonStats count={count} />);
      expect(tree.toJSON()).toBeTruthy();
    });
  });

  it('should render SkeletonFormField', () => {
    const tree = createWithAct(<SkeletonFormField />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render SkeletonSection with default rows', () => {
    const tree = createWithAct(<SkeletonSection />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render SkeletonSection with custom rows', () => {
    [1, 3, 5].forEach(rows => {
      const tree = createWithAct(<SkeletonSection rows={rows} />);
      expect(tree.toJSON()).toBeTruthy();
    });
  });
});

describe('Skeleton - Full Screen Components', () => {
  it('should render SkeletonDetailScreen', () => {
    const tree = createWithAct(<SkeletonDetailScreen />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render SkeletonListScreen with default count', () => {
    const tree = createWithAct(<SkeletonListScreen />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render SkeletonListScreen with custom count', () => {
    const tree = createWithAct(<SkeletonListScreen count={3} />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render SkeletonListScreen without avatars', () => {
    const tree = createWithAct(<SkeletonListScreen showAvatar={false} />);
    expect(tree.toJSON()).toBeTruthy();
  });
});

describe('Skeleton - Props Variations', () => {
  it('should handle all width types', () => {
    const widths = [100, '50%', '100%'];
    widths.forEach(width => {
      const tree = createWithAct(<Skeleton width={width} />);
      expect(tree.toJSON()).toBeTruthy();
    });
  });

  it('should handle various heights', () => {
    [16, 24, 48].forEach(height => {
      const tree = createWithAct(<Skeleton height={height} />);
      expect(tree.toJSON()).toBeTruthy();
    });
  });

  it('should handle various border radius values', () => {
    [0, 8, 16, 24].forEach(radius => {
      const tree = createWithAct(<Skeleton borderRadius={radius} />);
      expect(tree.toJSON()).toBeTruthy();
    });
  });
});

describe('Skeleton - Animation States', () => {
  it('should render with animation enabled by default', () => {
    const tree = createWithAct(<Skeleton />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render with animation disabled', () => {
    const tree = createWithAct(<Skeleton animated={false} />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should handle animation in all base components', () => {
    const components = [
      <Skeleton animated={false} key="1" />,
      <SkeletonCircle size={48} animated={false} key="2" />,
      <SkeletonRect animated={false} key="3" />,
    ];

    components.forEach(component => {
      const tree = createWithAct(component);
      expect(tree.toJSON()).toBeTruthy();
    });
  });
});

describe('Skeleton - Composition', () => {
  it('should render multiple skeletons together', () => {
    const tree = createWithAct(
      <>
        <Skeleton width="80%" height={20} />
        <Skeleton width="60%" height={16} />
        <Skeleton width="100%" height={16} />
      </>,
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render nested skeleton patterns', () => {
    const tree = createWithAct(
      <>
        <SkeletonProfile />
        <SkeletonSection rows={3} />
        <SkeletonSection rows={4} />
      </>,
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render list of skeleton items', () => {
    const tree = createWithAct(
      <>
        {Array.from({length: 5}).map((_, i) => (
          <SkeletonListItem key={i} />
        ))}
      </>,
    );
    expect(tree.toJSON()).toBeTruthy();
  });
});

describe('Skeleton - Performance', () => {
  beforeEach(() => {
    // Use real timers for performance tests
    jest.useRealTimers();
  });

  afterEach(() => {
    // Switch back to fake timers
    jest.useFakeTimers();
  });

  it('should render many skeletons quickly', () => {
    const start = Date.now();

    for (let i = 0; i < 50; i++) {
      createWithAct(<Skeleton animated={false} />);
    }

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000); // Increased timeout for React 19
  });

  it('should render complex screens efficiently', () => {
    const start = Date.now();

    for (let i = 0; i < 5; i++) {
      createWithAct(<SkeletonDetailScreen />);
    }

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000); // Increased timeout for React 19
  });
});

describe('Skeleton - Edge Cases', () => {
  it('should handle zero size', () => {
    const tree = createWithAct(<Skeleton width={0} height={0} />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should handle very large sizes', () => {
    const tree = createWithAct(<Skeleton width={5000} height={500} />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should handle circle with size 0', () => {
    const tree = createWithAct(<SkeletonCircle size={0} />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should handle card with 0 lines', () => {
    const tree = createWithAct(<SkeletonCard lines={0} />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should handle list screen with 0 items', () => {
    const tree = createWithAct(<SkeletonListScreen count={0} />);
    expect(tree.toJSON()).toBeTruthy();
  });
});
