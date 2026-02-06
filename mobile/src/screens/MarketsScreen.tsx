import React from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CoinCard from '../components/CoinCard';
import FearGreedGauge from '../components/FearGreedGauge';
import { useMarketCoins, useFearGreed } from '../hooks/useMarket';
import type { MarketCoin } from '../api/client';

export default function MarketsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { coins, loading, error, refresh } = useMarketCoins(50);
  const fearGreed = useFearGreed();

  const styles = createStyles(isDark);

  const renderHeader = () => (
    <View style={styles.header}>
      {fearGreed.data && <FearGreedGauge data={fearGreed.data} />}
      <View style={styles.tableHeader}>
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
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading markets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <FlatList<MarketCoin>
        data={coins}
        keyExtractor={(item: MarketCoin) => item.id}
        renderItem={({ item }: { item: MarketCoin }) => <CoinCard coin={item} />}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor="#ffffff"
            colors={['#ffffff']}
          />
        }
        showsVerticalScrollIndicator={false}
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
      color: '#ef4444',
      textAlign: 'center',
    },
    header: {
      paddingVertical: 8,
    },
    tableHeader: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      marginTop: 8,
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
      width: 70,
      textAlign: 'center',
    },
  });
