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
import { MarketCoin } from '../api/client';

interface CoinCardProps {
  coin: MarketCoin;
}

export default function CoinCard({ coin }: CoinCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isPositive = coin.change24h >= 0;

  const styles = createStyles(isDark);

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `$${price.toFixed(6)}`;
  };

  const formatMarketCap = (cap: number) => {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    return `$${cap.toLocaleString()}`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.symbol}>{coin.symbol.toUpperCase()}</Text>
        <Text style={styles.name} numberOfLines={1}>{coin.name}</Text>
      </View>
      <View style={styles.center}>
        <Text style={styles.price}>{formatPrice(coin.price)}</Text>
        <Text style={styles.marketCap}>{formatMarketCap(coin.marketCap)}</Text>
      </View>
      <View style={[styles.changeBadge, isPositive ? styles.positive : styles.negative]}>
        <Text style={styles.changeText}>
          {isPositive ? '+' : ''}{coin.change24h.toFixed(2)}%
        </Text>
      </View>
    </View>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#2a2a2a' : '#e0e0e0',
    },
    left: {
      flex: 1,
    },
    symbol: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#ffffff' : '#000000',
    },
    name: {
      fontSize: 13,
      color: isDark ? '#888' : '#666',
      marginTop: 2,
    },
    center: {
      flex: 1,
      alignItems: 'flex-end',
      marginRight: 12,
    },
    price: {
      fontSize: 15,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#000000',
    },
    marketCap: {
      fontSize: 12,
      color: isDark ? '#888' : '#666',
      marginTop: 2,
    },
    changeBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      minWidth: 70,
      alignItems: 'center',
    },
    positive: {
      backgroundColor: 'rgba(34, 197, 94, 0.15)',
    },
    negative: {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    changeText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#000000',
    },
  });
