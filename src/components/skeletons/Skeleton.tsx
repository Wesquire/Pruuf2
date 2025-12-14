/**
 * Skeleton Loading Components
 * Provides shimmer-style loading placeholders
 * Item 27: Add Loading Skeletons (LOW)
 */

import React, {useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  DimensionValue,
} from 'react-native';
import {colors} from '../../theme/colors';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  animated?: boolean;
}

/**
 * Base Skeleton Component
 * Rectangular skeleton with optional animation
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 4,
  style,
  animated = true,
}) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) {
      return;
    }

    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    shimmer.start();

    return () => shimmer.stop();
  }, [animated]);

  const opacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity: animated ? opacity : 0.3,
        },
        style,
      ]}
    />
  );
};

/**
 * Circle Skeleton Component
 * Perfect for avatars and profile pictures
 */
export const SkeletonCircle: React.FC<
  Omit<SkeletonProps, 'width' | 'height' | 'borderRadius'> & {size: number}
> = ({size, style, animated = true}) => {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
      animated={animated}
    />
  );
};

/**
 * Rectangle Skeleton Component
 * With fixed aspect ratio
 */
export const SkeletonRect: React.FC<SkeletonProps & {aspectRatio?: number}> = ({
  width = '100%',
  aspectRatio = 1,
  borderRadius = 8,
  style,
  animated = true,
}) => {
  return (
    <View style={[{width, aspectRatio}, style]}>
      <Skeleton
        width="100%"
        height={undefined as any}
        borderRadius={borderRadius}
        style={{flex: 1}}
        animated={animated}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.backgroundGray,
  },
});
