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
import { Sentiment } from '../api/client';

interface SentimentBadgeProps {
  sentiment: Sentiment;
  asset?: string;
}

export default function SentimentBadge({ sentiment, asset }: SentimentBadgeProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getColor = (label: string) => {
    switch (label) {
      case 'bullish': return '#22c55e';
      case 'bearish': return '#ef4444';
      default: return '#eab308';
    }
  };

  const getIcon = (label: string) => {
    switch (label) {
      case 'bullish': return '📈';
      case 'bearish': return '📉';
      default: return '➡️';
    }
  };

  const styles = createStyles(isDark);
  const color = getColor(sentiment.label);

  return (
    <View style={[styles.container, { borderColor: color }]}>
      <Text style={styles.icon}>{getIcon(sentiment.label)}</Text>
      <View style={styles.content}>
        <Text style={styles.title}>
          {asset ? `${asset} Sentiment` : 'Market Sentiment'}
        </Text>
        <View style={styles.row}>
          <Text style={[styles.label, { color }]}>
            {sentiment.label.toUpperCase()}
          </Text>
          <Text style={styles.score}>
            Score: {sentiment.score.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderRadius: 12,
      borderLeftWidth: 4,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 8,
    },
    icon: {
      fontSize: 32,
      marginRight: 12,
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: 13,
      color: isDark ? '#888' : '#666',
      marginBottom: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    label: {
      fontSize: 16,
      fontWeight: '700',
    },
    score: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
    },
  });
