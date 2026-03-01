/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import PriceRow from '../components/PriceRow';
import FearGreedGauge from '../components/FearGreedGauge';
import { useMarketCoins, useFearGreed } from '../hooks/useMarket';
import type { MarketCoin } from '../api/client';
import type { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MarketsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const { coins, loading, error, refresh } = useMarketCoins(50);
  const fearGreed = useFearGreed();

  const styles = createStyles(isDark);

  const filteredCoins = useMemo(() => {
    if (!searchQuery.trim()) return coins;
    const query = searchQuery.toLowerCase();
    return coins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(query) ||
        coin.symbol.toLowerCase().includes(query)
    );
  }, [coins, searchQuery]);

  const handleCoinPress = (coin: MarketCoin) => {
    navigation.navigate('CoinDetail', {
      symbol: coin.symbol,
      name: coin.name,
    });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {fearGreed.data && <FearGreedGauge data={fearGreed.data} />}

      {/* Search Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={isDark ? '#666' : '#999'} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search coins..."
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Ionicons
              name="close-circle"
              size={18}
              color={isDark ? '#666' : '#999'}
              onPress={() => setSearchQuery('')}
            />
          )}
        </View>
      </View>

      {/* Market Summary */}
      <View style={styles.marketSummary}>
        <Text style={styles.summaryText}>
          {filteredCoins.length} coins
        </Text>
        <Text style={styles.summaryText}>Auto-updates every 60s</Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, styles.headerRank]}>#</Text>
        <Text style={styles.headerText}>Coin</Text>
        <Text style={[styles.headerText, styles.headerPrice]}>Price</Text>
        <Text style={[styles.headerText, styles.headerChange]}>24h</Text>
      </View>
    </View>
  );

  if (loading && coins.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f7931a" />
          <Text style={styles.loadingText}>Loading markets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && coins.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <FlatList<MarketCoin>
        data={filteredCoins}
        keyExtractor={(item: MarketCoin) => item.id}
        renderItem={({ item, index }: { item: MarketCoin; index: number }) => (
          <PriceRow
            coin={item}
            rank={index + 1}
            onPress={() => handleCoinPress(item)}
          />
        )}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor="#f7931a"
            colors={['#f7931a']}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={isDark ? '#444' : '#ccc'} />
            <Text style={styles.emptyText}>No coins match "{searchQuery}"</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#0a0a0a' : '#f5f5f5',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      color: isDark ? '#888' : '#666',
      fontSize: 14,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      marginTop: 12,
      color: '#ef4444',
      textAlign: 'center',
    },
    header: {
      paddingVertical: 8,
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: isDark ? '#ffffff' : '#000000',
    },
    marketSummary: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
    },
    summaryText: {
      fontSize: 12,
      color: isDark ? '#666' : '#999',
    },
    tableHeader: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      marginTop: 8,
    },
    headerRank: {
      width: 24,
      textAlign: 'center',
    },
    headerText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#888' : '#666',
      textTransform: 'uppercase',
      flex: 1,
    },
    headerPrice: {
      textAlign: 'right',
      marginRight: 12,
    },
    headerChange: {
      width: 72,
      textAlign: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyText: {
      fontSize: 16,
      color: isDark ? '#666' : '#999',
      marginTop: 12,
      textAlign: 'center',
    },
  });
