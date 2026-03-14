/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-wagmi-charts';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useCoinPrice } from '../hooks/useMarket';
import { useChartData, TimeRange } from '../hooks/useChartData';
import { useNews } from '../hooks/useNews';
import NewsCard from '../components/NewsCard';
import Badge from '../components/Badge';
import { ChartSkeleton, StatsSkeleton, NewsListSkeleton } from '../components/Skeleton';
import type { RootStackParamList } from '../../App';
import type { Article } from '../api/client';

type CoinDetailRouteProp = RouteProp<RootStackParamList, 'CoinDetail'>;

interface StatItem {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: '1H', value: '1h' },
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '1Y', value: '1y' },
];

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function CoinDetailScreen() {
  const route = useRoute<CoinDetailRouteProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { symbol, name } = route.params;

  const { coin, loading, error, refresh } = useCoinPrice(symbol);
  const chart = useChartData(symbol.toLowerCase(), '24h');
  const relatedNews = useNews({ ticker: symbol.toUpperCase(), limit: 10 });

  const styles = createStyles(isDark);

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `$${price.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return `$${price.toFixed(6)}`;
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  if (loading && !coin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f7931a" />
          <Text style={styles.loadingText}>Loading {symbol}...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !coin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stats: StatItem[] = coin
    ? [
        {
          label: 'Market Cap',
          value: formatLargeNumber(coin.marketCap),
          icon: 'bar-chart',
        },
        {
          label: '24h Volume',
          value: formatLargeNumber(coin.volume24h),
          icon: 'swap-vertical',
        },
        {
          label: '24h Change',
          value: `${isPositive ? '+' : ''}${coin.change24h.toFixed(2)}%`,
          icon: isPositive ? 'trending-up' : 'trending-down',
        },
        {
          label: 'Price',
          value: formatPrice(coin.price),
          icon: 'pricetag',
        },
      ]
    : [];

  const renderStatsGrid = () => (
    <View style={styles.statsGrid}>
      {stats.map((stat) => (
        <View key={stat.label} style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons
              name={stat.icon}
              size={16}
              color={isDark ? '#888' : '#666'}
            />
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
          <Text
            style={[
              styles.statValue,
              stat.label === '24h Change' && {
                color: isPositive ? '#22c55e' : '#ef4444',
              },
            ]}
          >
            {stat.value}
          </Text>
        </View>
      ))}
    </View>
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([refresh(), chart.refresh(), relatedNews.refresh()]);
  }, [refresh, chart, relatedNews]);

  // Transform chart data for react-native-wagmi-charts
  const chartData = useMemo(() => {
    if (!chart.data || chart.data.length === 0) return [];
    return chart.data.map((point) => ({
      timestamp: point.timestamp,
      value: point.price,
    }));
  }, [chart.data]);

  const isPositive = coin ? coin.change24h >= 0 : true;
  const chartColor = isPositive ? '#22c55e' : '#ef4444';

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor="#f7931a"
            colors={['#f7931a']}
          />
        }
      >
        {/* Price Header */}
        <View style={styles.priceHeader}>
          <View style={styles.coinIdentity}>
            <View style={styles.coinIcon}>
              <Text style={styles.coinIconText}>
                {symbol.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.coinName}>{name}</Text>
              <Badge label={symbol.toUpperCase()} size="medium" />
            </View>
          </View>

          {coin && (
            <View style={styles.priceDisplay}>
              <Text style={styles.priceText}>{formatPrice(coin.price)}</Text>
              <View
                style={[
                  styles.changeContainer,
                  isPositive ? styles.positiveChange : styles.negativeChange,
                ]}
              >
                <Ionicons
                  name={isPositive ? 'caret-up' : 'caret-down'}
                  size={14}
                  color={isPositive ? '#22c55e' : '#ef4444'}
                />
                <Text
                  style={[
                    styles.changeText,
                    { color: isPositive ? '#22c55e' : '#ef4444' },
                  ]}
                >
                  {Math.abs(coin.change24h).toFixed(2)}%
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Interactive Price Chart */}
        {chart.loading && chartData.length === 0 ? (
          <ChartSkeleton />
        ) : chartData.length > 0 ? (
          <GestureHandlerRootView style={styles.chartContainer}>
            {/* Time Range Selector */}
            <View style={styles.timeRangeRow}>
              {TIME_RANGES.map((tr) => (
                <TouchableOpacity
                  key={tr.value}
                  style={[
                    styles.timeRangeBtn,
                    chart.range === tr.value && styles.timeRangeBtnActive,
                  ]}
                  onPress={() => chart.setRange(tr.value)}
                >
                  <Text
                    style={[
                      styles.timeRangeText,
                      chart.range === tr.value && styles.timeRangeTextActive,
                    ]}
                  >
                    {tr.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Chart */}
            <LineChart.Provider data={chartData}>
              <LineChart width={SCREEN_WIDTH - 64} height={200}>
                <LineChart.Path color={chartColor}>
                  <LineChart.Gradient color={chartColor} />
                </LineChart.Path>
                <LineChart.CursorCrosshair color={chartColor}>
                  <LineChart.Tooltip
                    style={styles.chartTooltip}
                    textStyle={styles.chartTooltipText}
                  />
                </LineChart.CursorCrosshair>
              </LineChart>
              <LineChart.PriceText
                style={styles.chartPriceText}
                format={({ value }) => {
                  'worklet';
                  const num = Number(value);
                  if (num >= 1) return `$${num.toFixed(2)}`;
                  return `$${num.toFixed(6)}`;
                }}
              />
              <LineChart.DatetimeText
                style={styles.chartDateText}
                locale="en-US"
              />
            </LineChart.Provider>

            {/* Chart Stats */}
            {chart.stats && (
              <View style={styles.chartStats}>
                <View style={styles.chartStatItem}>
                  <Text style={styles.chartStatLabel}>High</Text>
                  <Text style={[styles.chartStatValue, { color: '#22c55e' }]}>
                    {formatPrice(chart.stats.high)}
                  </Text>
                </View>
                <View style={styles.chartStatItem}>
                  <Text style={styles.chartStatLabel}>Low</Text>
                  <Text style={[styles.chartStatValue, { color: '#ef4444' }]}>
                    {formatPrice(chart.stats.low)}
                  </Text>
                </View>
                <View style={styles.chartStatItem}>
                  <Text style={styles.chartStatLabel}>Change</Text>
                  <Text
                    style={[
                      styles.chartStatValue,
                      {
                        color:
                          chart.stats.changePercent >= 0
                            ? '#22c55e'
                            : '#ef4444',
                      },
                    ]}
                  >
                    {chart.stats.changePercent >= 0 ? '+' : ''}
                    {chart.stats.changePercent.toFixed(2)}%
                  </Text>
                </View>
              </View>
            )}

            {chart.fromCache && (
              <View style={styles.cacheIndicator}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={12}
                  color={isDark ? '#666' : '#999'}
                />
                <Text style={styles.cacheText}>Cached data</Text>
              </View>
            )}
          </GestureHandlerRootView>
        ) : (
          <View style={styles.chartEmpty}>
            <Ionicons
              name="analytics-outline"
              size={32}
              color={isDark ? '#444' : '#ccc'}
            />
            <Text style={styles.chartEmptyText}>
              Chart data unavailable
            </Text>
          </View>
        )}

        {/* Stats Grid */}
        {renderStatsGrid()}

        {/* Related News */}
        <View style={styles.newsSection}>
          <Text style={styles.newsSectionTitle}>
            Related News
          </Text>
          {relatedNews.loading && relatedNews.articles.length === 0 ? (
            <View style={styles.newsLoading}>
              <ActivityIndicator size="small" color="#f7931a" />
              <Text style={styles.newsLoadingText}>Loading news...</Text>
            </View>
          ) : relatedNews.articles.length === 0 ? (
            <View style={styles.noNews}>
              <Ionicons
                name="newspaper-outline"
                size={32}
                color={isDark ? '#444' : '#ccc'}
              />
              <Text style={styles.noNewsText}>
                No recent news for {symbol.toUpperCase()}
              </Text>
            </View>
          ) : (
            relatedNews.articles.slice(0, 5).map((article: Article, index: number) => (
              <NewsCard key={`${article.link}-${index}`} article={article} compact />
            ))
          )}
        </View>
      </ScrollView>
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
      fontSize: 16,
    },
    priceHeader: {
      padding: 20,
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 16,
    },
    coinIdentity: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    coinIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    coinIconText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#f7931a',
    },
    coinName: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#ffffff' : '#000000',
      marginBottom: 4,
    },
    priceDisplay: {
      alignItems: 'flex-start',
    },
    priceText: {
      fontSize: 36,
      fontWeight: '700',
      color: isDark ? '#ffffff' : '#000000',
      letterSpacing: -1,
    },
    changeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      marginTop: 8,
      gap: 4,
    },
    positiveChange: {
      backgroundColor: 'rgba(34, 197, 94, 0.12)',
    },
    negativeChange: {
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
    },
    changeText: {
      fontSize: 16,
      fontWeight: '700',
    },
    chartPlaceholder: {
      marginHorizontal: 16,
      marginTop: 16,
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderRadius: 12,
      padding: 16,
    },
    priceBar: {
      height: 8,
      backgroundColor: isDark ? '#2a2a2a' : '#e0e0e0',
      borderRadius: 4,
      overflow: 'hidden',
    },
    priceBarFill: {
      height: '100%',
      borderRadius: 4,
    },
    priceBarLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    priceBarLabel: {
      fontSize: 11,
      color: isDark ? '#666' : '#999',
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
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderRadius: 12,
      padding: 14,
      flexGrow: 1,
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    statLabel: {
      fontSize: 12,
      color: isDark ? '#888' : '#666',
      fontWeight: '500',
    },
    statValue: {
      fontSize: 17,
      fontWeight: '700',
      color: isDark ? '#ffffff' : '#000000',
    },
    newsSection: {
      marginTop: 24,
      paddingBottom: 32,
    },
    newsSectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#ffffff' : '#000000',
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    newsLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      gap: 8,
    },
    newsLoadingText: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
    },
    noNews: {
      alignItems: 'center',
      padding: 32,
    },
    noNewsText: {
      fontSize: 14,
      color: isDark ? '#666' : '#999',
      marginTop: 8,
    },
  });
