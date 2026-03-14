/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, useColorScheme } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: isDark ? '#2a2a2a' : '#e0e0e0',
          opacity,
        },
        style,
      ]}
    />
  );
}

export function ChartSkeleton() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.chartSkeleton, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
      {/* Time range tabs skeleton */}
      <View style={styles.tabsSkeleton}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} width={40} height={28} borderRadius={14} />
        ))}
      </View>
      {/* Chart area skeleton */}
      <View style={styles.chartArea}>
        <Skeleton width="100%" height={200} borderRadius={12} />
      </View>
      {/* Stats skeleton */}
      <View style={styles.statsSkeleton}>
        <Skeleton width="45%" height={14} />
        <Skeleton width="45%" height={14} />
      </View>
    </View>
  );
}

export function StatsSkeleton() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.statsGrid}>
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[styles.statCard, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}
        >
          <Skeleton width={60} height={12} style={{ marginBottom: 8 }} />
          <Skeleton width={90} height={20} />
        </View>
      ))}
    </View>
  );
}

export function NewsListSkeleton({ count = 3 }: { count?: number }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[styles.newsCard, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}
        >
          <Skeleton width="30%" height={12} style={{ marginBottom: 6 }} />
          <Skeleton width="100%" height={16} style={{ marginBottom: 4 }} />
          <Skeleton width="80%" height={16} style={{ marginBottom: 8 }} />
          <Skeleton width="60%" height={12} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chartSkeleton: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  tabsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  chartArea: {
    marginBottom: 12,
  },
  statsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginTop: 16,
    gap: 8,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 14,
    flexGrow: 1,
  },
  newsCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 14,
  },
});
