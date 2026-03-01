/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { FearGreed } from '../api/client';

interface FearGreedGaugeProps {
  data: FearGreed;
}

export default function FearGreedGauge({ data }: FearGreedGaugeProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getColor = (value: number) => {
    if (value <= 25) return '#ef4444'; // Extreme Fear
    if (value <= 45) return '#f97316'; // Fear
    if (value <= 55) return '#eab308'; // Neutral
    if (value <= 75) return '#84cc16'; // Greed
    return '#22c55e'; // Extreme Greed
  };

  const styles = createStyles(isDark);
  const color = getColor(data.value);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fear & Greed Index</Text>
      <View style={styles.gaugeContainer}>
        <View style={styles.gauge}>
          <View 
            style={[
              styles.gaugeFill, 
              { width: `${data.value}%`, backgroundColor: color }
            ]} 
          />
        </View>
        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color }]}>{data.value}</Text>
          <Text style={[styles.classification, { color }]}>{data.classification}</Text>
        </View>
      </View>
      <View style={styles.labels}>
        <Text style={styles.label}>Extreme Fear</Text>
        <Text style={styles.label}>Extreme Greed</Text>
      </View>
    </View>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 8,
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#888' : '#666',
      marginBottom: 12,
    },
    gaugeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    gauge: {
      flex: 1,
      height: 8,
      backgroundColor: isDark ? '#2a2a2a' : '#e0e0e0',
      borderRadius: 4,
      overflow: 'hidden',
    },
    gaugeFill: {
      height: '100%',
      borderRadius: 4,
    },
    valueContainer: {
      alignItems: 'flex-end',
    },
    value: {
      fontSize: 28,
      fontWeight: '700',
    },
    classification: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    labels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    label: {
      fontSize: 11,
      color: isDark ? '#666' : '#888',
    },
  });
